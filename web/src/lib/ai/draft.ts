import "server-only";

import { firstName } from "@/lib/mail/format";
import type { Thread } from "@/lib/mail/types";

/**
 * Drafts a reply to the latest message in a thread.
 *
 * This is a deterministic placeholder so the UI works without credentials.
 * Swap the body for a model call (e.g. the AI SDK with a Claude model) that
 * receives the thread transcript and returns the draft text.
 */
export async function draftReply(thread: Thread): Promise<string> {
  const lead = thread.participants[0];
  const name = lead ? firstName(lead.name) : "there";
  const subject = thread.subject.replace(/^re:\s*/i, "");

  return `Thanks, ${name} — this looks great. I've read through "${subject}" and I'm aligned. Let's go ahead as you suggested, and I'll follow up if anything else comes up.`;
}

/** Drafts a new message from its recipients and subject. Same placeholder caveat as `draftReply`. */
export async function draftMessage(to: string, subject: string): Promise<string> {
  const name = to.split(/[,;@\s]/)[0]?.trim();
  const greeting = name ? `Hi ${name.charAt(0).toUpperCase()}${name.slice(1)},` : "Hi,";
  const topic = subject.trim() ? ` about ${subject.trim()}` : "";

  return `${greeting}\n\nI wanted to reach out${topic}. Do you have a few minutes this week to talk it through?\n\nThanks,\nNoah`;
}
