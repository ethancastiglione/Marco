import "server-only";

import { connection } from "next/server";

import { bodyToText, initials, senderLabel, textToBody } from "./format";
import { sanitizeEmailHtml } from "./html";
import { me, seedAccounts, seedLabels, seedThreads } from "./seed";
import {
  SYSTEM_MAILBOXES,
  type Account,
  type Label,
  type LabelColor,
  type ListQuery,
  type MailboxCounts,
  type OutgoingMessage,
  type Person,
  type SystemMailbox,
  type Thread,
  type ThreadSummary,
} from "./types";

/**
 * The boundary between the UI and a mail provider. The in-memory store below
 * backs the demo; a Gmail/IMAP adapter implements the same interface.
 */
export interface MailStore {
  listAccounts(): Promise<Account[]>;
  listLabels(): Promise<Label[]>;
  counts(accounts?: string[]): Promise<MailboxCounts>;
  listThreads(query: ListQuery): Promise<ThreadSummary[]>;
  getThread(id: string): Promise<Thread | undefined>;

  setStarred(id: string, starred: boolean): Promise<void>;
  setRead(id: string, read: boolean): Promise<void>;
  markAllRead(mailbox: string): Promise<void>;
  move(id: string, location: "inbox" | "archive" | "trash"): Promise<void>;
  snooze(id: string, until: string): Promise<void>;
  reply(id: string, text: string): Promise<void>;
  undoReply(id: string): Promise<void>;
  send(message: OutgoingMessage): Promise<string>;
  saveDraft(message: OutgoingMessage): Promise<string>;
  discard(id: string): Promise<void>;
  undoSend(id: string): Promise<void>;
  createLabel(name: string): Promise<Label>;
}

export function isSystemMailbox(value: string): value is SystemMailbox {
  return (SYSTEM_MAILBOXES as readonly string[]).includes(value);
}

const LABEL_COLORS: LabelColor[] = ["blue", "violet", "green", "amber", "pink"];

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function lastMessage(thread: Thread) {
  return thread.messages[thread.messages.length - 1];
}

function isSnoozed(thread: Thread, now: number) {
  return thread.snoozedUntil !== undefined && new Date(thread.snoozedUntil).getTime() > now;
}

function inAccounts(thread: Thread, accounts?: string[]) {
  return !accounts || accounts.includes(thread.accountId);
}

function inMailbox(thread: Thread, mailbox: string, now: number) {
  const live = thread.location !== "trash";
  switch (mailbox) {
    case "inbox":
      return thread.location === "inbox" && !isSnoozed(thread, now);
    case "starred":
      return live && thread.starred;
    case "snoozed":
      return live && isSnoozed(thread, now);
    case "sent":
      return live && thread.location !== "drafts" && thread.messages.some((message) => message.fromMe);
    case "drafts":
    case "archive":
    case "trash":
      return thread.location === mailbox;
    default:
      return live && thread.location !== "drafts" && thread.labelIds.includes(mailbox);
  }
}

function parseRecipients(to: string, known: Person[]): Person[] {
  return to
    .split(/[,;]/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const match = known.find(
        (person) => person.email === entry || person.name.toLowerCase() === entry.toLowerCase(),
      );
      if (match) return match;
      const name = entry.includes("@") ? entry.split("@")[0] : entry;
      return { name, email: entry.includes("@") ? entry : "", avatar: "light" as const };
    });
}

class InMemoryMailStore implements MailStore {
  private threads: Thread[] = seedThreads();
  private labels: Label[] = [...seedLabels];
  private accounts: Account[] = [...seedAccounts];
  private nextId = 1;

  private find(id: string) {
    const thread = this.threads.find((candidate) => candidate.id === id);
    if (!thread) throw new Error(`Thread ${id} not found`);
    return thread;
  }

  private knownPeople() {
    return this.threads.flatMap((thread) => thread.participants);
  }

  private summarize(thread: Thread): ThreadSummary {
    const latest = lastMessage(thread);
    const lead = thread.participants[0];
    const isDraft = thread.location === "drafts";
    return {
      id: thread.id,
      account: this.accounts.find((account) => account.id === thread.accountId),
      sender: isDraft ? `To ${senderLabel(thread.participants)}` : senderLabel(thread.participants),
      initials: lead ? initials(lead.name) : "D",
      avatar: lead?.avatar ?? "light",
      subject: thread.subject || "(no subject)",
      preview: bodyToText(latest.body),
      lastAt: latest.sentAt,
      unread: thread.unread,
      starred: thread.starred,
      label: this.labels.find((label) => thread.labelIds.includes(label.id)),
      hasAttachment: thread.messages.some((message) => message.attachments.length > 0),
      isDraft,
      receipt: !isDraft && latest.fromMe ? (latest.readAt ? "read" : "sent") : undefined,
    };
  }

  async listAccounts() {
    await connection();
    return this.accounts;
  }

  async listLabels() {
    await connection();
    return this.labels;
  }

  async counts(accounts?: string[]) {
    await connection();
    const now = Date.now();
    const count = (mailbox: SystemMailbox, unreadOnly = false) =>
      this.threads.filter(
        (thread) =>
          inAccounts(thread, accounts) && inMailbox(thread, mailbox, now) && (!unreadOnly || thread.unread),
      ).length;
    return {
      inbox: count("inbox", true),
      starred: 0,
      snoozed: count("snoozed"),
      sent: 0,
      drafts: count("drafts"),
      archive: 0,
      trash: 0,
    };
  }

  async listThreads({ mailbox, q, unreadOnly, accounts }: ListQuery) {
    await connection();
    const now = Date.now();
    const needle = q?.trim().toLowerCase();
    return this.threads
      .filter((thread) => inAccounts(thread, accounts) && inMailbox(thread, mailbox, now))
      .filter((thread) => !unreadOnly || thread.unread)
      .map((thread) => this.summarize(thread))
      .filter(
        (summary) =>
          !needle || `${summary.sender} ${summary.subject} ${summary.preview}`.toLowerCase().includes(needle),
      )
      .sort((a, b) => b.lastAt.localeCompare(a.lastAt));
  }

  async getThread(id: string) {
    await connection();
    return this.threads.find((thread) => thread.id === id);
  }

  async setStarred(id: string, starred: boolean) {
    this.find(id).starred = starred;
  }

  async setRead(id: string, read: boolean) {
    this.find(id).unread = !read;
  }

  async markAllRead(mailbox: string) {
    const now = Date.now();
    for (const thread of this.threads) if (inMailbox(thread, mailbox, now)) thread.unread = false;
  }

  async move(id: string, location: "inbox" | "archive" | "trash") {
    const thread = this.find(id);
    thread.location = location;
    thread.snoozedUntil = undefined;
  }

  async snooze(id: string, until: string) {
    const thread = this.find(id);
    thread.snoozedUntil = until;
    thread.location = "inbox";
  }

  async reply(id: string, text: string) {
    const thread = this.find(id);
    thread.messages.push({
      id: `${id}-${thread.messages.length + 1}`,
      from: me,
      to: thread.participants,
      sentAt: new Date().toISOString(),
      fromMe: true,
      body: textToBody(text),
      attachments: [],
    });
  }

  async undoReply(id: string) {
    const thread = this.find(id);
    const last = lastMessage(thread);
    if (last.fromMe && thread.messages.length > 1) thread.messages.pop();
  }

  private upsertOutgoing(message: OutgoingMessage, location: "inbox" | "drafts") {
    const recipients = parseRecipients(message.to, this.knownPeople());
    const outgoing = {
      id: "",
      from: me,
      to: recipients,
      sentAt: new Date().toISOString(),
      fromMe: true,
      body: [{ type: "html" as const, html: sanitizeEmailHtml(message.body) }],
      attachments: [],
    };

    const existing = message.draftId ? this.threads.find((thread) => thread.id === message.draftId) : undefined;
    if (existing) {
      existing.subject = message.subject;
      existing.participants = recipients;
      existing.location = location === "drafts" ? "drafts" : "archive";
      existing.messages = [{ ...outgoing, id: `${existing.id}-1` }];
      return existing.id;
    }

    const id = `m${Date.now().toString(36)}${this.nextId++}`;
    this.threads.push({
      id,
      accountId: this.accounts[0].id,
      subject: message.subject,
      participants: recipients,
      labelIds: [],
      // Sent mail lives in the archive so it shows in Sent without cluttering the inbox.
      location: location === "drafts" ? "drafts" : "archive",
      unread: false,
      starred: false,
      messages: [{ ...outgoing, id: `${id}-1` }],
    });
    return id;
  }

  async send(message: OutgoingMessage) {
    return this.upsertOutgoing(message, "inbox");
  }

  async saveDraft(message: OutgoingMessage) {
    return this.upsertOutgoing(message, "drafts");
  }

  async discard(id: string) {
    this.threads = this.threads.filter((thread) => thread.id !== id);
  }

  async undoSend(id: string) {
    this.find(id).location = "drafts";
  }

  async createLabel(name: string) {
    const id = slugify(name);
    if (!id || isSystemMailbox(id)) throw new Error("That label name is reserved.");
    const existing = this.labels.find((label) => label.id === id);
    if (existing) return existing;
    const label = { id, name: name.trim(), color: LABEL_COLORS[this.labels.length % LABEL_COLORS.length] };
    this.labels.push(label);
    return label;
  }
}

// Keep one store across dev hot reloads.
const globalStore = globalThis as unknown as { __mailStore?: MailStore };
export const mail: MailStore = (globalStore.__mailStore ??= new InMemoryMailStore());

export { me };
