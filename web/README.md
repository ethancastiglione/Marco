# Aster Mail — Next.js

A Next.js 16 rebuild of the Figma Make prototype that lives at the repo root (`../src`). The Make files are left untouched so Make can keep syncing.

```bash
pnpm install
pnpm dev        # http://localhost:3000 → redirects to /inbox
```

## Layout

- `src/app/(mail)/layout.tsx` — app shell (sidebar, top bar); stays mounted across mailboxes
- `src/app/(mail)/[mailbox]/[[...thread]]/page.tsx` — `/inbox`, `/inbox/<thread-id>`, `/starred`, `/<label>`; `?q=` search, `?filter=unread`
- `src/app/globals.css` — the Make prototype's CSS, ported verbatim, plus additions at the bottom
- `src/components/mail/` — UI components
- `src/lib/mail/` — types, seed data (relative timestamps) and an in-memory `MailStore`
- `src/lib/ai/draft.ts` — placeholder "Draft with AI" text (swap for a model call)

Data is mock and in-memory: it resets when the server restarts.
