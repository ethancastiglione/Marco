import "server-only";

import { firstName } from "@/lib/mail/format";
import { mail } from "@/lib/mail/store";
import type { AvatarTone, ThreadSummary } from "@/lib/mail/types";

export type AsterReference = {
  id: string;
  href: string;
  sender: string;
  subject: string;
  initials: string;
  avatar: AvatarTone;
  note: string;
};

export type AsterAnswer = { text: string; references: AsterReference[] };

const firstSentence = (text: string) => (text.match(/^.*?[.!?](\s|$)/)?.[0] ?? text).trim().slice(0, 120);

function reference(thread: ThreadSummary, mailbox: string, note = firstSentence(thread.preview)): AsterReference {
  return {
    id: thread.id,
    href: `/${mailbox}/${thread.id}`,
    sender: thread.sender,
    subject: thread.subject,
    initials: thread.initials,
    avatar: thread.avatar,
    note,
  };
}

/**
 * Answers questions about the mailbox. This deterministic version understands a few
 * intents so the panel is useful without credentials; swap it for a model call with
 * the same inputs (prompt + visible threads) and output shape.
 */
export async function askAster(prompt: string, accounts: string[]): Promise<AsterAnswer> {
  const question = prompt.toLowerCase();
  const inbox = await mail.listThreads({ mailbox: "inbox", accounts });

  if (/summar|catch me up|unread|what('s| is) new/.test(question)) {
    const unread = inbox.filter((thread) => thread.unread);
    if (!unread.length) return { text: "You're all caught up — nothing unread in the inboxes you have selected.", references: [] };
    return {
      text: `You have ${unread.length} unread ${unread.length === 1 ? "conversation" : "conversations"}. Here's the short version:`,
      references: unread.map((thread) => reference(thread, "inbox")),
    };
  }

  if (/repl|respond|answer|waiting|follow/.test(question)) {
    const needsReply = inbox.filter((thread) => !thread.receipt && (thread.unread || thread.starred)).slice(0, 4);
    return {
      text: needsReply.length
        ? `${needsReply.length} ${needsReply.length === 1 ? "thread looks" : "threads look"} like they're waiting on you:`
        : "Nothing looks like it's waiting on a reply from you.",
      references: needsReply.map((thread) => reference(thread, "inbox", `${firstName(thread.sender)} is waiting — ${firstSentence(thread.preview)}`)),
    };
  }

  if (/attach|file|pdf|document/.test(question)) {
    const withFiles = (await mail.search("has:attachment", accounts)).slice(0, 5);
    return {
      text: withFiles.length ? `I found ${withFiles.length} conversations with attachments:` : "I couldn't find any attachments.",
      references: withFiles.map((thread) => reference(thread, thread.where.toLowerCase(), thread.subject)),
    };
  }

  const words = question.replace(/[^\w\s@.-]/g, " ").split(/\s+/).filter((word) => word.length > 3 && !STOP_WORDS.has(word));
  // Try all the words together first; if that's too strict, fall back to any single word.
  let results = words.length ? await mail.search(words.slice(0, 3).join(" "), accounts) : [];
  for (const word of words) {
    if (results.length) break;
    results = await mail.search(word, accounts);
  }
  if (results.length) {
    return {
      text: `Here's what I found for “${words.slice(0, 3).join(" ")}”:`,
      references: results.slice(0, 4).map((thread) => reference(thread, thread.where.toLowerCase())),
    };
  }

  return {
    text: "I can summarize your unread mail, find what needs a reply, look up attachments, or search across all your inboxes. Try one of the suggestions below.",
    references: [],
  };
}

const STOP_WORDS = new Set(["what", "when", "where", "which", "find", "show", "about", "from", "with", "that", "this", "have", "email", "emails", "mail", "message", "messages", "there", "please", "could", "would", "anything", "something", "everything", "thing", "things", "know", "tell", "know", "latest", "recent", "about"]);
