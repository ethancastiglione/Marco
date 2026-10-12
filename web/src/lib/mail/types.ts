export const SYSTEM_MAILBOXES = [
  "inbox",
  "starred",
  "snoozed",
  "sent",
  "drafts",
  "archive",
  "trash",
] as const;

export type SystemMailbox = (typeof SYSTEM_MAILBOXES)[number];

export type AvatarTone =
  | "coral"
  | "dark"
  | "blue"
  | "violet"
  | "light"
  | "green"
  | "pink"
  | "amber";

export type LabelColor = "blue" | "violet" | "green" | "amber" | "pink";

export type Person = {
  name: string;
  email: string;
  avatar: AvatarTone;
};

export type AccountColor = "ink" | "red" | "blue" | "green" | "amber";

/** A connected mailbox (work, personal, ...). Threads belong to exactly one. */
export type Account = {
  id: string;
  name: string;
  email: string;
  initial: string;
  color: AccountColor;
};

export type Label = {
  /** URL slug, also used as the mailbox route segment. */
  id: string;
  name: string;
  color: LabelColor;
};

export type BodyBlock =
  | { type: "p"; text: string }
  | { type: "ol"; items: { title: string; text: string }[] };

export type Attachment = {
  id: string;
  name: string;
  kind: "pdf" | "image" | "doc";
  size: string;
  detail?: string;
};

export type Message = {
  id: string;
  from: Person;
  to: Person[];
  sentAt: string;
  body: BodyBlock[];
  attachments: Attachment[];
  fromMe: boolean;
};

/** Where a thread lives. Starred, snoozed and sent are derived views. */
export type ThreadLocation = "inbox" | "archive" | "trash" | "drafts";

export type Thread = {
  id: string;
  accountId: string;
  subject: string;
  /** Everyone on the thread except the account owner. */
  participants: Person[];
  messages: Message[];
  labelIds: string[];
  location: ThreadLocation;
  unread: boolean;
  starred: boolean;
  snoozedUntil?: string;
};

export type ThreadSummary = {
  id: string;
  account?: Account;
  sender: string;
  initials: string;
  avatar: AvatarTone;
  subject: string;
  preview: string;
  lastAt: string;
  unread: boolean;
  starred: boolean;
  label?: Label;
  hasAttachment: boolean;
  isDraft: boolean;
};

export type MailboxCounts = Record<SystemMailbox, number>;

export type ListQuery = {
  mailbox: string;
  q?: string;
  unreadOnly?: boolean;
  /** Only include threads from these accounts. Omit for all. */
  accounts?: string[];
};

export type OutgoingMessage = {
  to: string;
  subject: string;
  body: string;
  /** When sending an existing draft, the draft's thread id. */
  draftId?: string;
};
