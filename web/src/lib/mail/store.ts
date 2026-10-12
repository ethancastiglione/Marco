import "server-only";

import { connection } from "next/server";

import { bodyToText, initials, senderLabel } from "./format";
import { sanitizeEmailHtml } from "./html";
import { highlight, parseQuery, snippetAround, type ParsedQuery } from "./search";
import { me, seedAccounts, seedLabels, seedThreads } from "./seed";
import {
  SYSTEM_MAILBOXES,
  type Account,
  type AccountColor,
  type Attachment,
  type NewAttachment,
  type SearchHit,
  type SearchPerson,
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
  search(query: string, accounts?: string[]): Promise<SearchHit[]>;
  searchPeople(term: string, accounts?: string[]): Promise<SearchPerson[]>;
  getThread(id: string): Promise<Thread | undefined>;

  setStarred(id: string, starred: boolean): Promise<void>;
  setRead(id: string, read: boolean): Promise<void>;
  markAllRead(mailbox: string): Promise<void>;
  move(id: string, location: "inbox" | "archive" | "trash"): Promise<void>;
  snooze(id: string, until: string): Promise<void>;
  reply(id: string, html: string, attachments?: NewAttachment[]): Promise<void>;
  setLabels(id: string, labelIds: string[]): Promise<void>;
  addAccount(email: string, name: string): Promise<Account>;
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

const MAILBOX_NAMES: Record<string, string> = {
  inbox: "Inbox",
  archive: "Archive",
  trash: "Trash",
  drafts: "Drafts",
};

function toAttachments(files: NewAttachment[] | undefined, prefix: string): Attachment[] {
  return (files ?? []).map((file, index) => ({ id: `${prefix}-a${index}`, ...file }));
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

  async listThreads({ mailbox, unreadOnly, accounts, sort = "newest" }: ListQuery) {
    await connection();
    const now = Date.now();
    return this.threads
      .filter((thread) => inAccounts(thread, accounts) && inMailbox(thread, mailbox, now))
      .filter((thread) => !unreadOnly || thread.unread)
      .map((thread) => this.summarize(thread))
      .sort((a, b) => {
        if (sort === "unread" && a.unread !== b.unread) return a.unread ? -1 : 1;
        return sort === "oldest" ? a.lastAt.localeCompare(b.lastAt) : b.lastAt.localeCompare(a.lastAt);
      });
  }

  private matches(thread: Thread, parsed: ParsedQuery, now: number) {
    const people = (list: { name: string; email: string }[]) =>
      list.map((person) => `${person.name} ${person.email}`.toLowerCase()).join(" ");
    const senders = people(thread.messages.map((message) => message.from));
    const recipients = people(thread.messages.flatMap((message) => message.to));
    const subject = thread.subject.toLowerCase();
    const body = thread.messages.map((message) => bodyToText(message.body)).join(" ").toLowerCase();
    const label = this.labels.filter((candidate) => thread.labelIds.includes(candidate.id));

    if (parsed.in ? !inMailbox(thread, parsed.in, now) : thread.location === "trash") return undefined;
    if (parsed.from && !senders.includes(parsed.from)) return undefined;
    if (parsed.to && !recipients.includes(parsed.to)) return undefined;
    if (parsed.subject && !subject.includes(parsed.subject)) return undefined;
    if (parsed.label && !label.some((candidate) => `${candidate.id} ${candidate.name}`.toLowerCase().includes(parsed.label!))) return undefined;
    if (parsed.account) {
      const account = this.accounts.find((candidate) => candidate.id === thread.accountId);
      if (!account || !`${account.id} ${account.name} ${account.email}`.toLowerCase().includes(parsed.account)) return undefined;
    }
    if (parsed.hasAttachment && !thread.messages.some((message) => message.attachments.length)) return undefined;
    if (parsed.is.unread && !thread.unread) return undefined;
    if (parsed.is.read && thread.unread) return undefined;
    if (parsed.is.starred && !thread.starred) return undefined;

    // Every free-text term must appear somewhere; where it appears decides the score.
    let score = 0;
    const participants = people(thread.participants);
    const attachmentNames = thread.messages.flatMap((message) => message.attachments.map((file) => file.name)).join(" ").toLowerCase();
    const labelNames = label.map((candidate) => candidate.name.toLowerCase()).join(" ");
    for (const term of parsed.terms) {
      const inSubject = subject.includes(term);
      const inPeople = participants.includes(term) || senders.includes(term);
      const inBody = body.includes(term);
      const inFiles = attachmentNames.includes(term);
      const inLabels = labelNames.includes(term);
      if (!inSubject && !inPeople && !inBody && !inFiles && !inLabels) return undefined;
      // A person match beats a passing mention; subject beats body.
      score += (inPeople ? 8 : 0) + (inSubject ? 6 : 0) + (inLabels ? 4 : 0) + (inFiles ? 3 : 0) + (inBody ? 2 : 0);
      if (subject.split(/\W+/).includes(term)) score += 2; // whole-word subject match
    }
    const days = (now - new Date(lastMessage(thread).sentAt).getTime()) / 86_400_000;
    score += Math.max(0, 3 - days * 0.3) + (thread.unread ? 1 : 0) + (thread.starred ? 1 : 0);
    return score;
  }

  async search(query: string, accounts?: string[]) {
    await connection();
    const now = Date.now();
    const parsed = parseQuery(query);
    const terms = [...parsed.terms, parsed.from, parsed.to, parsed.subject].filter((term): term is string => Boolean(term));
    return this.threads
      .filter((thread) => inAccounts(thread, accounts))
      .flatMap((thread) => {
        const score = this.matches(thread, parsed, now);
        if (score === undefined) return [];
        const summary = this.summarize(thread);
        const fullText = thread.messages.map((message) => bodyToText(message.body)).join(" ");
        const hit: SearchHit = {
          ...summary,
          score,
          where: MAILBOX_NAMES[thread.location],
          highlights: {
            sender: highlight(summary.sender, terms),
            subject: highlight(summary.subject, terms),
            snippet: highlight(snippetAround(parsed.terms.length ? fullText : summary.preview, parsed.terms), parsed.terms),
          },
        };
        return [hit];
      })
      .sort((a, b) => b.score - a.score || b.lastAt.localeCompare(a.lastAt));
  }

  async searchPeople(term: string, accounts?: string[]) {
    await connection();
    const needle = term.trim().toLowerCase();
    const people = new Map<string, SearchPerson>();
    for (const thread of this.threads) {
      if (!inAccounts(thread, accounts)) continue;
      for (const person of thread.participants) {
        const key = person.email || person.name;
        const existing = people.get(key);
        if (existing) existing.threads += 1;
        else people.set(key, { ...person, initials: initials(person.name), threads: 1 });
      }
    }
    return [...people.values()]
      .filter((person) => !needle || person.name.toLowerCase().split(/\s+/).some((word) => word.startsWith(needle)) || person.email.toLowerCase().startsWith(needle))
      .sort((a, b) => b.threads - a.threads)
      .slice(0, 4);
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

  async reply(id: string, html: string, attachments?: NewAttachment[]) {
    const thread = this.find(id);
    const messageId = `${id}-${thread.messages.length + 1}`;
    thread.messages.push({
      id: messageId,
      from: me,
      to: thread.participants,
      sentAt: new Date().toISOString(),
      fromMe: true,
      body: [{ type: "html", html: sanitizeEmailHtml(html) }],
      attachments: toAttachments(attachments, messageId),
    });
  }

  async setLabels(id: string, labelIds: string[]) {
    this.find(id).labelIds = labelIds.filter((labelId) => this.labels.some((label) => label.id === labelId));
  }

  async addAccount(email: string, name: string) {
    const address = email.trim().toLowerCase();
    const existing = this.accounts.find((account) => account.email === address);
    if (existing) return existing;
    const colors: AccountColor[] = ["green", "amber", "red", "blue"];
    const id = slugify(address.split("@")[0]) || `account-${this.accounts.length + 1}`;
    const label = name.trim() || address.split("@")[1]?.split(".")[0] || address;
    const account: Account = {
      id: this.accounts.some((candidate) => candidate.id === id) ? `${id}-${this.accounts.length}` : id,
      name: label.charAt(0).toUpperCase() + label.slice(1),
      email: address,
      initial: (label[0] ?? "?").toUpperCase(),
      color: colors[this.accounts.length % colors.length],
    };
    this.accounts.push(account);
    return account;
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
      attachments: toAttachments(message.attachments, `out${this.nextId}`),
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
    if (!id || isSystemMailbox(id) || id === "search") throw new Error("That label name is reserved.");
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
