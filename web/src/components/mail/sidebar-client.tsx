"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";

import { createLabel } from "@/app/actions";

import Icon from "./icon";
import { useMailUI } from "./mail-ui";

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
      try {
        const label = await createLabel(name);
        setName("");
        setError("");
        setAdding(false);
        router.push(`/${label.id}`);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Couldn't create label");
      }
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
