"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";

import { createLabel } from "@/app/actions";

import Icon from "./icon";
import { useMailUI } from "./mail-ui";
import Menu from "./menu";

export function SidebarFrame({ children }: { children: ReactNode }) {
  const { sidebarOpen, setSidebarOpen } = useMailUI();
  return (
    <>
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>{children}</aside>
      {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}
    </>
  );
}

export function ComposeButton() {
  const { openCompose } = useMailUI();
  return (
    <button className="compose-button" onClick={() => openCompose()}>
      <Icon name="compose" size={17} />
      <span>Compose</span>
      <kbd>C</kbd>
    </button>
  );
}

export function NavLink({ href, className, children }: { href: string; className: string; children: ReactNode }) {
  const pathname = usePathname();
  const { setSidebarOpen } = useMailUI();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      className={`${className} ${active ? "active" : ""}`}
      href={href}
      aria-current={active ? "page" : undefined}
      onClick={() => setSidebarOpen(false)}
    >
      {children}
    </Link>
  );
}

export function AddLabel({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const submit = () => {
    if (!name.trim()) return setAdding(false);
    startTransition(async () => {
      const result = await createLabel(name);
      if ("error" in result) return setError(result.error);
      setName("");
      setError("");
      setAdding(false);
      router.push(`/${result.id}`);
    });
  };

  return (
    <>
      <div className="nav-heading">
        <span>Labels</span>
        <button className="mini-add" aria-label="Add label" onClick={() => setAdding((value) => !value)}>
          +
        </button>
      </div>
      {children}
      {adding && (
        <form
          className="label-form"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <input
            autoFocus
            aria-label="Label name"
            placeholder="Label name"
            value={name}
            disabled={pending}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => event.key === "Escape" && setAdding(false)}
          />
          {error && <small>{error}</small>}
        </form>
      )}
    </>
  );
}

export function WorkspaceMenu() {
  const { openPanel } = useMailUI();
  return (
    <Menu
      label="Workspace options"
      triggerClassName="icon-button subtle"
      align="end"
      items={[
        { label: "Settings", icon: "settings", onSelect: () => openPanel({ type: "settings" }) },
        { label: "Manage accounts", icon: "users", onSelect: () => openPanel({ type: "settings", tab: "accounts" }) },
        { label: "Keyboard shortcuts", icon: "compose", hint: "?", onSelect: () => openPanel({ type: "shortcuts" }) },
      ]}
    />
  );
}

export function AskAsterButton() {
  const { openPanel } = useMailUI();
  return (
    <button className="storage-card" onClick={() => openPanel({ type: "ai" })}>
      <span className="storage-icon">
        <Icon name="sparkle" size={16} />
      </span>
      <span>
        <strong>Ask Aster AI</strong>
        <span>Search, summarize, write</span>
      </span>
      <kbd>⌘ J</kbd>
    </button>
  );
}

export function AccountMenu({ name, email, initials }: { name: string; email: string; initials: string }) {
  const { openPanel } = useMailUI();
  return (
    <Menu
      label="Account options"
      triggerClassName="account-row"
      placement="above"
      trigger={
        <>
          <span className="profile-avatar">
            {initials}
            <span className="presence-dot" />
          </span>
          <span>
            <strong>{name}</strong>
            <small>{email}</small>
          </span>
          <Icon name="dots" size={16} />
        </>
      }
      items={[
        { label: "Settings", icon: "settings", onSelect: () => openPanel({ type: "settings" }) },
        { label: "Signature", icon: "compose", onSelect: () => openPanel({ type: "settings", tab: "signature" }) },
        { label: "Add another account", icon: "users", onSelect: () => openPanel({ type: "add-account" }) },
        { type: "divider" },
        { label: "Keyboard shortcuts", icon: "mail", hint: "?", onSelect: () => openPanel({ type: "shortcuts" }) },
      ]}
    />
  );
}
