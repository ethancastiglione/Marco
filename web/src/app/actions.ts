"use server";

import { refresh } from "next/cache";

import { draftMessage, draftReply } from "@/lib/ai/draft";
import { mail } from "@/lib/mail/store";
import type { OutgoingMessage } from "@/lib/mail/types";

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

export async function replyToThread(id: string, text: string) {
  if (!text.trim()) return;
  await mail.reply(id, text);
  refresh();
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
