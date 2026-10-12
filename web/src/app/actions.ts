"use server";

import { refresh } from "next/cache";
import { cookies } from "next/headers";

import { draftMessage, draftReply } from "@/lib/ai/draft";
import { askAster as answer } from "@/lib/ai/assistant";
import { ACCOUNTS_COOKIE, getAccountFilter } from "@/lib/mail/accounts";
import { freeText, parseQuery, tokenize } from "@/lib/mail/search";
import { mail } from "@/lib/mail/store";
import type { NewAttachment, OutgoingMessage, SearchSuggestions, ThreadPlacement } from "@/lib/mail/types";

/** New mail is sent from the first inbox the viewer can see, so it never lands somewhere hidden. */
async function withSender(message: OutgoingMessage): Promise<OutgoingMessage> {
  if (message.accountId) return message;
  const { enabled } = await getAccountFilter();
  return { ...message, accountId: enabled[0] };
}

export async function setStarred(id: string, starred: boolean) {
  await mail.setStarred(id, starred);
  refresh();
}

export async function setRead(id: string, read: boolean) {
  await mail.setRead(id, read);
  refresh();
}

export async function markAllRead(mailbox: string) {
  const { enabled } = await getAccountFilter();
  await mail.markAllRead(mailbox, enabled);
  refresh();
}

/** Returns where the thread was, for Undo. */
export async function moveThread(id: string, location: "inbox" | "archive" | "trash") {
  const before = await mail.move(id, location);
  refresh();
  return before;
}

export async function restoreThread(id: string, placement: ThreadPlacement) {
  await mail.restore(id, placement);
  refresh();
}

export async function snoozeThread(id: string, until: string) {
  const before = await mail.snooze(id, until);
  refresh();
  return before;
}

export async function replyToThread(id: string, html: string, attachments?: NewAttachment[]) {
  await mail.reply(id, html, attachments);
  refresh();
}

export async function setThreadLabels(id: string, labelIds: string[]) {
  await mail.setLabels(id, labelIds);
  refresh();
}

export async function addAccount(email: string, name: string) {
  const account = await mail.addAccount(email, name);
  // If the viewer has narrowed the account filter, include the new inbox so it shows up straight away.
  const cookieStore = await cookies();
  const saved = cookieStore.get(ACCOUNTS_COOKIE)?.value;
  if (saved && !saved.split(",").includes(account.id)) {
    cookieStore.set(ACCOUNTS_COOKIE, `${saved},${account.id}`, { path: "/", maxAge: 31536000, sameSite: "lax" });
  }
  refresh();
  return account;
}

/** Powers the search box dropdown: matching people, top messages, and values for operator autocomplete. */
export async function searchSuggestions(query: string): Promise<SearchSuggestions> {
  const { accounts, enabled } = await getAccountFilter();
  const labels = await mail.listLabels();
  const lastToken = tokenize(query).at(-1) ?? "";
  const personTerm = /^(from|to):/i.test(lastToken) ? lastToken.replace(/^\w+:/, "") : freeText(query).split(" ").at(-1) ?? "";
  const parsed = parseQuery(query);
  const hasCriteria = parsed.terms.length > 0 || /\w+:[^\s"]/.test(query);
  const [people, messages] = await Promise.all([
    personTerm.length >= 1 || /^(from|to):$/i.test(lastToken)
      ? mail.searchPeople(personTerm, enabled, /^to:/i.test(lastToken) ? "to" : "from")
      : Promise.resolve([]),
    hasCriteria ? mail.search(query, enabled) : Promise.resolve([]),
  ]);
  return { people, messages: messages.slice(0, 5), labels, accounts };
}

export async function askAster(prompt: string) {
  const { enabled } = await getAccountFilter();
  return answer(prompt, enabled);
}

export async function undoReply(id: string) {
  await mail.undoReply(id);
  refresh();
}

export async function sendMessage(message: OutgoingMessage) {
  const id = await mail.send(await withSender(message));
  refresh();
  return id;
}

export async function saveDraft(message: OutgoingMessage) {
  const id = await mail.saveDraft(await withSender(message));
  refresh();
  return id;
}

export async function discardDraft(id: string) {
  await mail.discard(id);
  refresh();
}

export async function undoSend(id: string) {
  await mail.undoSend(id);
  refresh();
}

export async function createLabel(name: string) {
  const label = await mail.createLabel(name);
  refresh();
  return label;
}

export async function draftReplyWithAI(id: string) {
  const thread = await mail.getThread(id);
  if (!thread) throw new Error("Thread not found");
  return draftReply(thread);
}

export async function draftMessageWithAI(to: string, subject: string) {
  return draftMessage(to, subject);
}

export async function getAccounts() {
  return getAccountFilter();
}
