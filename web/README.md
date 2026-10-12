# Index — Next.js

A Next.js 16 rebuild of the Figma Make prototype that lives at the repo root (`../src`). The Make files are left untouched so Make can keep syncing.

```bash
pnpm install
pnpm dev        # http://localhost:3000 → redirects to /inbox
pnpm typecheck  # generates Next's route types, then runs tsc
pnpm build
```

## Layout

- `src/app/(mail)/layout.tsx` — app shell (sidebar, top bar); stays mounted across mailboxes
- `src/app/(mail)/[mailbox]/[[...thread]]/page.tsx` — `/inbox`, `/inbox/<thread-id>`, `/starred`, `/<label>`; `?q=` search, `?filter=unread`
- `src/app/globals.css` — the Make prototype's CSS, ported verbatim, plus additions at the bottom
- `src/components/mail/` — UI components
- `src/lib/mail/` — types, seed data (relative timestamps) and an in-memory `MailStore`
- `src/lib/ai/draft.ts` — placeholder "Draft with AI" text (swap for a model call)

Data is mock and in-memory: it resets when the server restarts.

## Design system

Everything is built from the tokens at the top of `src/app/globals.css` (ink + four greys, three
fills, two line weights, one blue accent, a 9–13px type scale, four radii) and two primitives:

- `components/mail/menu.tsx` — the only dropdown (snooze, sort, labels, overflow, account menus)
- `components/mail/modal.tsx` — the only dialog (settings, shortcuts, add account, attachment preview)

## Search

`/search?q=` searches every selected inbox (trash excluded unless `in:trash`) and ranks matches:
people > subject > label > attachment name > body, plus recency, unread and starred boosts.
Results are grouped into "Top results" and date sections, with matches highlighted.

Syntax: `"exact phrase"`, `from:`, `to:`, `subject:`, `has:attachment`, `is:unread|read|starred`,
`label:`, `in:inbox|sent|archive|drafts|trash`, `account:`. The search box suggests people,
conversations, operators and their values as you type, and remembers recent searches.
