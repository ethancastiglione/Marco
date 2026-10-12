"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { searchSuggestions } from "@/app/actions";
import { formatListTime } from "@/lib/mail/format";
import { OPERATORS, tokenize, type Segment } from "@/lib/mail/search";
import type { SearchSuggestions } from "@/lib/mail/types";

import Icon from "./icon";
import { useMailUI } from "./mail-ui";

const RECENT_KEY = "aster-recent-searches";
const MAILBOXES = ["inbox", "sent", "archive", "drafts", "trash", "starred", "snoozed"];

function loadRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveRecent(query: string) {
  try {
    const next = [query, ...loadRecent().filter((item) => item !== query)].slice(0, 5);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // Private mode or storage disabled: recents are a convenience only.
  }
}

/** Replaces the last token of the query (the one being typed). */
function replaceLast(query: string, token: string) {
  const tokens = tokenize(query);
  if (query && !/\s$/.test(query)) tokens.pop();
  return [...tokens, token].join(" ");
}

type Option = { key: string; section: string; render: ReactNode; run: () => void };

function Highlighted({ segments }: { segments: Segment[] }) {
  return segments.map((segment, index) => (segment.hit ? <mark key={index}>{segment.text}</mark> : segment.text));
}

export function TopbarFallback() {
  return (
    <header className="topbar">
      <div className="search">
        <label className="search-box">
          <Icon name="search" size={18} />
          <input aria-label="Search mail" placeholder="Search mail" disabled />
          <kbd>⌘ K</kbd>
        </label>
      </div>
    </header>
  );
}

export default function Topbar({ accounts }: { accounts?: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { setSidebarOpen, openPanel } = useMailUI();
  const onSearchPage = pathname.startsWith("/search");
  const urlQuery = onSearchPage ? (searchParams.get("q") ?? "") : "";

  const [value, setValue] = useState(urlQuery);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [recent, setRecent] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestions | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const request = useRef(0);

  // Keep the box in sync when the URL changes from elsewhere (back button, chips, mailbox switch).
  useEffect(() => setValue(urlQuery), [urlQuery]);

  // Fetch suggestions as the query changes (debounced; stale responses are dropped).
  useEffect(() => {
    if (!open) return;
    const id = ++request.current;
    const timer = window.setTimeout(async () => {
      const result = await searchSuggestions(value);
      if (id === request.current) setSuggestions(result);
    }, 120);
    return () => window.clearTimeout(timer);
  }, [value, open]);

  const submit = (query: string) => {
    const trimmed = query.trim();
    setOpen(false);
    input.current?.blur();
    if (!trimmed) return;
    saveRecent(trimmed);
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const complete = (query: string) => {
    setValue(query);
    setActive(0);
    input.current?.focus();
  };

  const options = useMemo<Option[]>(() => {
    const list: Option[] = [];
    const trimmed = value.trim();
    const last = /\s$/.test(value) ? "" : (tokenize(value).at(-1) ?? "");
    const operator = last.match(/^(\w+):(.*)$/);

    if (!trimmed) {
      for (const query of recent) {
        list.push({
          key: `recent-${query}`,
          section: "Recent searches",
          render: (
            <>
              <Icon name="clock" size={15} />
              <span className="option-main">{query}</span>
            </>
          ),
          run: () => submit(query),
        });
      }
      for (const op of OPERATORS) {
        list.push({
          key: `op-${op.token}`,
          section: "Narrow your search",
          render: (
            <>
              <Icon name="filter" size={15} />
              <span className="option-main">
                <span className="option-title">
                  <code>{op.token}</code>
                </span>
              </span>
              <small>{op.hint}</small>
            </>
          ),
          run: () => complete(`${op.token}${op.token.endsWith(":") ? "" : " "}`),
        });
      }
      return list;
    }

    // A bare operator ("from:") isn't a search yet — lead with its completions instead.
    const bareOperator = Boolean(operator && !operator[2]) && tokenize(value).length === 1;
    if (!bareOperator) list.push({
      key: "submit",
      section: "",
      render: (
        <>
          <Icon name="search" size={15} />
          <span className="option-main">
            Search all mail for <strong>“{trimmed}”</strong>
          </span>
          <kbd className="key">↵</kbd>
        </>
      ),
      run: () => submit(value),
    });

    // Autocomplete the value of an operator being typed, e.g. `from:ma` → people.
    if (operator) {
      const [, key, partial] = operator;
      const lower = partial.toLowerCase();
      const values: { token: string; label: string; hint?: string }[] =
        key === "from" || key === "to"
          ? (suggestions?.people ?? []).map((person) => ({ token: `${key}:${person.email || person.name.split(" ")[0]}`, label: person.name, hint: person.email }))
          : key === "label"
            ? (suggestions?.labels ?? []).filter((label) => label.id.startsWith(lower)).map((label) => ({ token: `label:${label.id}`, label: label.name }))
            : key === "in"
              ? MAILBOXES.filter((mailbox) => mailbox.startsWith(lower)).map((mailbox) => ({ token: `in:${mailbox}`, label: mailbox }))
              : key === "is"
                ? ["unread", "read", "starred"].filter((state) => state.startsWith(lower)).map((state) => ({ token: `is:${state}`, label: state }))
                : key === "has"
                  ? [{ token: "has:attachment", label: "attachment" }]
                  : key === "account"
                    ? (suggestions?.accounts ?? []).map((account) => ({ token: `account:${account.id}`, label: account.name, hint: account.email }))
                    : [];
      for (const option of values.slice(0, 6)) {
        list.push({
          key: `value-${option.token}`,
          section: `${key}:`,
          render: (
            <>
              <Icon name="filter" size={15} />
              <span className="option-main">{option.label}</span>
              {option.hint && <small>{option.hint}</small>}
            </>
          ),
          run: () => complete(`${replaceLast(value, option.token)} `),
        });
      }
    } else {
      // Typing the start of an operator, e.g. `ha` → has:attachment.
      if (last.length >= 2) {
        for (const op of OPERATORS.filter((candidate) => candidate.token.startsWith(last.toLowerCase()))) {
          list.push({
            key: `op-${op.token}`,
            section: "Filters",
            render: (
              <>
                <Icon name="filter" size={15} />
                <span className="option-main">
                  <span className="option-title">
                    <code>{op.token}</code>
                  </span>
                </span>
                <small>{op.hint}</small>
              </>
            ),
            run: () => complete(`${replaceLast(value, op.token)}${op.token.endsWith(":") ? "" : " "}`),
          });
        }
      }
      for (const person of suggestions?.people ?? []) {
        list.push({
          key: `person-${person.email}`,
          section: "People",
          render: (
            <>
              <span className={`sender-avatar avatar-${person.avatar}`}>{person.initials}</span>
              <span className="option-main">
                {person.name}
                <small>{person.email}</small>
              </span>
              <small>
                {person.threads} {person.threads === 1 ? "conversation" : "conversations"}
              </small>
            </>
          ),
          run: () => submit(replaceLast(value, `from:${person.email || person.name.split(" ")[0]}`)),
        });
      }
    }

    for (const message of suggestions?.messages ?? []) {
      list.push({
        key: `message-${message.id}`,
        section: "Conversations",
        render: (
          <>
            <span className={`sender-avatar avatar-${message.avatar}`}>{message.initials}</span>
            <span className="option-main">
              <span className="option-title">
                <Highlighted segments={message.highlights.subject} />
              </span>
              <small>
                <Highlighted segments={message.highlights.sender} />
                {message.where !== "Inbox" && ` · ${message.where}`}
              </small>
            </span>
            <small>{formatListTime(message.lastAt)}</small>
          </>
        ),
        run: () => {
          saveRecent(value.trim());
          setOpen(false);
          input.current?.blur();
          router.push(`/search/${message.id}?q=${encodeURIComponent(value.trim())}`);
        },
      });
    }
    return list;
    // `submit`/`complete` only close over router and refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, recent, suggestions]);

  const activeIndex = Math.min(active, Math.max(options.length - 1, 0));

  return (
    <header className="topbar">
      <button className="mobile-menu icon-button" aria-label="Open menu" onClick={() => setSidebarOpen(true)}>
        <Icon name="menu" />
      </button>
      <div className="search">
        <label className={`search-box ${open ? "open" : ""}`}>
          <Icon name="search" size={18} />
          <input
            ref={input}
            id="mail-search"
            role="combobox"
            aria-label="Search mail"
            aria-expanded={open}
            aria-controls="search-panel"
            aria-activedescendant={open && options[activeIndex] ? `search-option-${activeIndex}` : undefined}
            autoComplete="off"
            spellCheck={false}
            value={value}
            placeholder="Search mail"
            onFocus={() => {
              setRecent(loadRecent());
              setOpen(true);
            }}
            onBlur={() => window.setTimeout(() => setOpen(false), 120)}
            onChange={(event) => {
              setValue(event.target.value);
              setActive(0);
              setOpen(true);
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                event.preventDefault();
                setOpen(true);
                const step = event.key === "ArrowDown" ? 1 : -1;
                setActive((activeIndex + step + options.length) % Math.max(options.length, 1));
              } else if (event.key === "Enter") {
                event.preventDefault();
                if (open && options[activeIndex]) options[activeIndex].run();
                else submit(value);
              } else if (event.key === "Tab" && open && options[activeIndex]?.key.startsWith("value-")) {
                event.preventDefault();
                options[activeIndex].run();
              } else if (event.key === "Escape") {
                if (open) setOpen(false);
                else if (onSearchPage) {
                  setValue("");
                  router.push("/inbox");
                }
                event.currentTarget.blur();
              }
            }}
          />
          {value ? (
            <button
              type="button"
              className="search-clear"
              aria-label="Clear search"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                setValue("");
                input.current?.focus();
                if (onSearchPage) router.push("/inbox");
              }}
            >
              <Icon name="close" size={13} />
            </button>
          ) : (
            <kbd>⌘ K</kbd>
          )}
        </label>

        {open && options.length > 0 && (
          <div className="search-panel" id="search-panel" role="listbox" aria-label="Search suggestions" onMouseDown={(event) => event.preventDefault()}>
            {options.map((option, index) => (
              <div key={option.key}>
                {option.section && option.section !== options[index - 1]?.section && <div className="search-section">{option.section}</div>}
                <button
                  type="button"
                  id={`search-option-${index}`}
                  role="option"
                  aria-selected={index === activeIndex}
                  className={`search-option ${index === activeIndex ? "active" : ""}`}
                  onMouseEnter={() => setActive(index)}
                  onClick={option.run}
                >
                  {option.render}
                </button>
              </div>
            ))}
            <div className="search-footer">
              <span>
                <kbd className="key">↑</kbd>
                <kbd className="key">↓</kbd> to move
              </span>
              <span>
                <kbd className="key">↵</kbd> to search
              </span>
              <span>
                Try <code>from:</code> <code>has:attachment</code> <code>is:unread</code>
              </span>
            </div>
          </div>
        )}
      </div>
      {accounts}
      <button className="help-button" aria-label="Keyboard shortcuts" data-tooltip="Keyboard shortcuts · ?" onClick={() => openPanel({ type: "shortcuts" })}>
        ?
      </button>
    </header>
  );
}
