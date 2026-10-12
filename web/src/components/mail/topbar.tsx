"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import Icon from "./icon";
import { useMailUI } from "./mail-ui";

export function TopbarFallback() {
  return (
    <header className="topbar">
      <label className="search-box">
        <Icon name="search" size={18} />
        <input aria-label="Search mail" placeholder="Search mail" disabled />
        <kbd>⌘ K</kbd>
      </label>
    </header>
  );
}

export default function Topbar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { setSidebarOpen } = useMailUI();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const timer = useRef<number | undefined>(undefined);

  const mailbox = pathname.split("/")[1] || "inbox";

  // Keep the box in sync when the URL changes from elsewhere (back button, mailbox switch).
  const urlQuery = searchParams.get("q") ?? "";
  useEffect(() => setQuery(urlQuery), [urlQuery]);

  const search = (value: string) => {
    setQuery(value);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (value.trim()) params.set("q", value.trim());
      else params.delete("q");
      const qs = params.toString();
      router.replace(`/${mailbox}${qs ? `?${qs}` : ""}`);
    }, 200);
  };

  return (
    <header className="topbar">
      <button className="mobile-menu icon-button" aria-label="Open menu" onClick={() => setSidebarOpen(true)}>
        <Icon name="menu" />
      </button>
      <label className="search-box">
        <Icon name="search" size={18} />
        <input
          id="mail-search"
          aria-label="Search mail"
          value={query}
          onChange={(event) => search(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              search("");
              event.currentTarget.blur();
            }
          }}
          placeholder="Search mail"
        />
        <kbd>⌘ K</kbd>
      </label>
      <button className="help-button" aria-label="Keyboard shortcuts" popoverTarget="shortcuts-help">
        ?
      </button>
      <div id="shortcuts-help" className="shortcuts-help" popover="auto">
        <strong>Keyboard shortcuts</strong>
        <dl>
          <dt>C</dt>
          <dd>Compose</dd>
          <dt>/ or ⌘ K</dt>
          <dd>Search</dd>
          <dt>J / K</dt>
          <dd>Next / previous message</dd>
          <dt>E</dt>
          <dd>Archive</dd>
          <dt>S</dt>
          <dd>Star</dd>
          <dt>#</dt>
          <dd>Delete</dd>
          <dt>R</dt>
          <dd>Reply</dd>
          <dt>U</dt>
          <dd>Back to list</dd>
          <dt>⌘ ↵</dt>
          <dd>Send</dd>
        </dl>
      </div>
    </header>
  );
}
