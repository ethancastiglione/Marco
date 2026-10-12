import type { ReactNode } from "react";

export type IconName =
  | "archive"
  | "arrowDown"
  | "arrowLeft"
  | "arrowRight"
  | "calendar"
  | "check"
  | "chevron"
  | "clock"
  | "close"
  | "compose"
  | "dots"
  | "inbox"
  | "mail"
  | "menu"
  | "paperclip"
  | "reply"
  | "search"
  | "send"
  | "settings"
  | "sparkle"
  | "star"
  | "trash"
  | "users"
  | "undo"
  | "redo"
  | "bold"
  | "italic"
  | "underline"
  | "strike"
  | "textColor"
  | "alignLeft"
  | "alignCenter"
  | "alignRight"
  | "listOl"
  | "listUl"
  | "indent"
  | "outdent"
  | "quote"
  | "clearFormat"
  | "link"
  | "format"
  | "mailOpen"
  | "eye"
  | "checkDouble"
  | "print"
  | "filter";

const paths: Record<IconName, ReactNode> = {
  archive: (
    <>
      <path d="M4 7.5h16M5.5 7.5v11h13v-11M3.5 4h17v3.5h-17z" />
      <path d="M9.5 12h5" />
    </>
  ),
  arrowDown: <path d="M12 5v14m-5-5 5 5 5-5" />,
  arrowLeft: <path d="m15 18-6-6 6-6" />,
  arrowRight: <path d="m9 18 6-6-6-6" />,
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M8 3v4M16 3v4M3.5 9.5h17" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  chevron: <path d="m9 18 6-6-6-6" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  close: <path d="m6 6 12 12M18 6 6 18" />,
  compose: (
    <>
      <path d="M13.5 5.5 18.5 10.5M4 20l3.4-.8L19.6 7a1.8 1.8 0 0 0 0-2.6 1.8 1.8 0 0 0-2.6 0L4.8 16.6 4 20Z" />
    </>
  ),
  dots: (
    <>
      <circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  inbox: (
    <>
      <path d="M4 5h16v14H4z" />
      <path d="M4 13h4l2 3h4l2-3h4" />
    </>
  ),
  mail: (
    <>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="m4.5 7 7.5 6 7.5-6" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  paperclip: <path d="m8 12.5 6.8-6.8a3 3 0 0 1 4.2 4.2l-8.2 8.2a4.2 4.2 0 0 1-6-6l8-8" />,
  reply: <path d="m9.5 8-5 4 5 4v-3h4.2c3.3 0 5.2 1.2 6.3 4.5-.2-5.8-2.8-8.5-7.8-8.5H9.5V8Z" />,
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m15.5 15.5 4.5 4.5" />
    </>
  ),
  send: <path d="m21 3-7.5 18-3.2-7.3L3 10.5 21 3Zm-10.7 10.7L21 3" />,
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" />
    </>
  ),
  sparkle: <path d="M12 2.8c.5 5 2.2 7 6.8 7.7-4.6.7-6.3 2.7-6.8 7.7-.5-5-2.2-7-6.8-7.7C9.8 9.8 11.5 7.8 12 2.8Z" />,
  star: <path d="m12 3.5 2.7 5.4 6 .9-4.4 4.2 1 6-5.3-2.8L6.7 20l1-6-4.4-4.2 6-.9L12 3.5Z" />,
  trash: (
    <>
      <path d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" />
    </>
  ),
  undo: <path d="M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />,
  redo: <path d="m15 14 5-5-5-5M20 9H9.5a5.5 5.5 0 0 0 0 11H13" />,
  bold: <path d="M7 5h6a3.5 3.5 0 0 1 0 7H7zM7 12h7a3.5 3.5 0 0 1 0 7H7z" strokeWidth="2.2" />,
  italic: <path d="M10 5h8M6 19h8M14 5l-4 14" />,
  underline: <path d="M7 4v7a5 5 0 0 0 10 0V4M5 20h14" />,
  strike: <path d="M5 12h14M16.5 7.5C16 5.8 14.3 5 12 5c-2.8 0-4.5 1.3-4.5 3.2 0 1.5 1 2.4 2.7 3M8 16.5c.6 1.7 2.3 2.5 4.2 2.5 2.8 0 4.6-1.3 4.6-3.3 0-.9-.3-1.6-1-2.2" />,
  textColor: <path d="m6.5 16 5.5-12 5.5 12M8.5 11.5h7" />,
  alignLeft: <path d="M4 6h16M4 10h10M4 14h16M4 18h10" />,
  alignCenter: <path d="M4 6h16M7 10h10M4 14h16M7 18h10" />,
  alignRight: <path d="M4 6h16M10 10h10M4 14h16M10 18h10" />,
  listOl: (
    <>
      <path d="M10 6h10M10 12h10M10 18h10" />
      <path d="M4 5h1.5v4M4 9h3M4 14.5c0-.8.7-1.5 1.5-1.5S7 13.6 7 14.3c0 1.2-3 1.7-3 3.7h3" strokeWidth="1.3" />
    </>
  ),
  listUl: (
    <>
      <path d="M10 6h10M10 12h10M10 18h10" />
      <circle cx="5" cy="6" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="5" cy="12" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="5" cy="18" r="1.2" fill="currentColor" stroke="none" />
    </>
  ),
  indent: <path d="M4 5h16M11 10h9M11 14h9M4 19h16M4 9l3.5 3L4 15" />,
  outdent: <path d="M4 5h16M11 10h9M11 14h9M4 19h16M7.5 9 4 12l3.5 3" />,
  quote: (
    <path d="M6 17c-1.2-1-2-2.6-2-4.6C4 9 6 6.8 9 6M9.5 13a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0ZM16 17c-1.2-1-2-2.6-2-4.6 0-3.4 2-5.6 5-6.4M19.5 13a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z" />
  ),
  clearFormat: <path d="M6 5h12M12 5l-3 14M4 4l16 16" />,
  link: (
    <path d="M10 14a4.2 4.2 0 0 0 6 0l3-3a4.2 4.2 0 0 0-6-6l-1 1M14 10a4.2 4.2 0 0 0-6 0l-3 3a4.2 4.2 0 0 0 6 6l1-1" />
  ),
  format: <path d="M3.5 18 8 6l4.5 12M5 14h6M15 18v-6.5M15 14.5a2.5 2.5 0 1 1 5 0V18" />,
  mailOpen: (
    <>
      <path d="M3.5 10 12 4l8.5 6v9.5h-17z" />
      <path d="m4 10.5 8 5.5 8-5.5" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.8" />
    </>
  ),
  print: (
    <>
      <path d="M7 8V3.5h10V8M7 17H4.5V9.5a1.5 1.5 0 0 1 1.5-1.5h12a1.5 1.5 0 0 1 1.5 1.5V17H17" />
      <path d="M7 13.5h10v7H7z" />
    </>
  ),
  filter: <path d="M4 6h16M7 12h10M10 18h4" />,
  checkDouble: <path d="m2.5 12.5 4 4L15 8M10.5 16.5 19 8" />,
  users: (
    <>
      <circle cx="9" cy="9" r="3" />
      <path d="M3.5 19c.5-3.2 2.3-5 5.5-5s5 1.8 5.5 5M15 7.2a3 3 0 0 1 0 5.6M16.5 14.2c2.3.5 3.6 2.1 4 4.8" />
    </>
  ),
};

export default function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
    >
      {paths[name]}
    </svg>
  );
}
