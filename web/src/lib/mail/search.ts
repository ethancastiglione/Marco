/**
 * Gmail-style search syntax, shared by the server (ranking) and the client (chips, autocomplete).
 *
 *   maya budget            words must all match (sender, subject or body)
 *   "final review"         exact phrase
 *   from:maya  to:jon      people, by name or address
 *   subject:offsite        subject only
 *   has:attachment         threads with files
 *   is:unread is:read is:starred
 *   label:design  in:archive  account:personal
 */

export type ParsedQuery = {
  terms: string[];
  from?: string;
  to?: string;
  subject?: string;
  label?: string;
  in?: string;
  account?: string;
  hasAttachment?: boolean;
  is: { unread?: boolean; read?: boolean; starred?: boolean };
};

export type Segment = { text: string; hit: boolean };

export const OPERATORS = [
  { token: "from:", hint: "Sender name or address" },
  { token: "to:", hint: "Recipient" },
  { token: "subject:", hint: "Words in the subject" },
  { token: "has:attachment", hint: "Has files attached" },
  { token: "is:unread", hint: "Unread conversations" },
  { token: "is:starred", hint: "Starred conversations" },
  { token: "label:", hint: "One of your labels" },
  { token: "in:", hint: "inbox, sent, archive, drafts, trash" },
  { token: "account:", hint: "Only one connected inbox" },
] as const;

/** Splits a query into tokens, keeping quoted phrases and `key:"quoted value"` together. */
export function tokenize(query: string): string[] {
  return [...(query.match(/(\w+:)?"[^"]*"?|\S+/g) ?? [])];
}

const unquote = (value: string) => value.replace(/^"|"$/g, "").trim().toLowerCase();

export function parseQuery(query: string): ParsedQuery {
  const parsed: ParsedQuery = { terms: [], is: {} };
  for (const token of tokenize(query)) {
    const match = token.match(/^(\w+):(.*)$/);
    const key = match?.[1].toLowerCase();
    const value = match ? unquote(match[2]) : "";
    if (match && value) {
      if (key === "from" || key === "to" || key === "subject" || key === "label" || key === "in" || key === "account") {
        parsed[key] = value;
        continue;
      }
      if (key === "has" && value.startsWith("attach")) {
        parsed.hasAttachment = true;
        continue;
      }
      if (key === "is" && (value === "unread" || value === "read" || value === "starred")) {
        parsed.is[value] = true;
        continue;
      }
    }
    const term = unquote(token);
    if (term) parsed.terms.push(term);
  }
  return parsed;
}

/** Every token that narrows the search (shown as removable chips). */
export function filterTokens(query: string) {
  return tokenize(query).filter((token) => /^\w+:\S/.test(token));
}

export function freeText(query: string) {
  return tokenize(query)
    .filter((token) => !/^\w+:\S/.test(token))
    .join(" ");
}

/** Adds a filter token, or removes it if it's already present. */
export function toggleToken(query: string, token: string) {
  const tokens = tokenize(query);
  const index = tokens.findIndex((existing) => existing.toLowerCase() === token.toLowerCase());
  if (index >= 0) tokens.splice(index, 1);
  else tokens.push(token);
  return tokens.join(" ").trim();
}

/** Splits text into highlighted and plain runs. Rendered as React text, never as HTML. */
export function highlight(text: string, terms: string[]): Segment[] {
  const needles = terms.filter((term) => term.length > 1);
  if (!needles.length) return [{ text, hit: false }];
  const pattern = new RegExp(`(${needles.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  return text
    .split(pattern)
    .filter(Boolean)
    .map((part) => ({ text: part, hit: needles.some((term) => term.toLowerCase() === part.toLowerCase()) }));
}

/** A ~150 character window of `text` around the first match. */
export function snippetAround(text: string, terms: string[], size = 150) {
  const lower = text.toLowerCase();
  const first = terms
    .map((term) => lower.indexOf(term.toLowerCase()))
    .filter((index) => index >= 0)
    .sort((a, b) => a - b)[0];
  if (first === undefined || first < 40) return text.length > size ? `${text.slice(0, size).trimEnd()}…` : text;
  // Start at a word boundary so the snippet never opens mid-word.
  const rough = Math.max(0, first - 40);
  const space = text.indexOf(" ", rough);
  const start = space >= 0 && space < first ? space + 1 : rough;
  const slice = text.slice(start, start + size).trim();
  return `…${slice}${start + size < text.length ? "…" : ""}`;
}

export function dateBucket(iso: string, now = new Date()) {
  const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const days = Math.round((startOfDay(now) - startOfDay(new Date(iso))) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return "Earlier this week";
  if (days < 31) return "Earlier this month";
  return "Older";
}
