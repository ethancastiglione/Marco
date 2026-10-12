"use server";

import { refresh } from "next/cache";
import { cookies } from "next/headers";

import { draftMessage, draftReply } from "@/lib/ai/draft";
import { askAster as answer } from "@/lib/ai/assistant";
import { ACCOUNTS_COOKIE, getAccountFilter } from "@/lib/mail/accounts";
import { freeText, parseQuery, tokenize } from "@/lib/mail/search";
import { mail } from "@/lib/mail/store";
import type { NewAttachment, OutgoingMessage, SearchSuggestions } from "@/lib/mail/types";

export async function setStarred(id: string, starred: boolean) {
  await mail.setStarred(id, starred);
  refresh();
}

export async function setRead(id: string, read: boolean) {
  await mail.setRead(id, read);
  refresh();
}

export async function markAllRead(mailbox: string) {
  await mail.markAllRead(mailbox);
  refresh();
}

export async function moveThread(id: string, location: "inbox" | "archive" | "trash") {
  await mail.move(id, location);
  refresh();
}

export async function snoozeThread(id: string, until: string) {
  await mail.snooze(id, until);
  refresh();
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
  const hasCriteria = parseQuery(query).terms.length > 0 || /\w+:\S/.test(query);
  const [people, messages] = await Promise.all([
    personTerm.length >= 1 || /^(from|to):$/i.test(lastToken) ? mail.searchPeople(personTerm, enabled) : Promise.resolve([]),
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
  const id = await mail.send(message);
  refresh();
  return id;
}

export async function saveDraft(message: OutgoingMessage) {
  const id = await mail.saveDraft(message);
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
