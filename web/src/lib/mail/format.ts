import type { BodyBlock, Person } from "./types";

export function initials(name: string) {
  const parts = name.replace(/&.*$/, "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function firstName(name: string) {
  return name.split(" ")[0];
}

export function senderLabel(participants: Person[]) {
  if (participants.length === 0) return "Draft";
  const [first, ...rest] = participants;
  if (rest.length === 0) return first.name;
  return `${firstName(first.name)} & ${rest.length} ${rest.length === 1 ? "other" : "others"}`;
}

const GREETING = /^(hi|hey|hello|dear)\b[^.!?\n]{0,24}[,!]?$/i;

/** Plain-text preview of a body, skipping a leading "Hi Noah," the way inbox previews do. */
export function bodyToText(body: BodyBlock[]) {
  const [first, ...rest] = body;
  const blocks = first?.type === "p" && GREETING.test(first.text.trim()) && rest.length ? rest : body;
  return blocks
    .map((block) =>
      block.type === "p" ? block.text : block.items.map((item) => `${item.title}: ${item.text}`).join(" "),
    )
    .join(" ");
}

export function textToBody(text: string): BodyBlock[] {
  return text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => ({ type: "p", text: paragraph }));
}

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

/** Inbox-style timestamp: time today, "Yesterday", weekday this week, then a date. */
export function formatListTime(iso: string, now = new Date()) {
  const date = new Date(iso);
  const days = Math.round((startOfDay(now).getTime() - startOfDay(date).getTime()) / 86_400_000);
  if (days <= 0) return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  if (days === 1) return "Yesterday";
  if (days < 7) return date.toLocaleDateString("en-US", { weekday: "short" });
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatMessageTime(iso: string, now = new Date()) {
  const date = new Date(iso);
  const time = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const days = Math.round((startOfDay(now).getTime() - startOfDay(date).getTime()) / 86_400_000);
  if (days <= 0) return time;
  return `${formatListTime(iso, now)}, ${time}`;
}
