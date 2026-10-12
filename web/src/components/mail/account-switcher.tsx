"use client";

import { useRouter } from "next/navigation";
import { useOptimistic, useTransition } from "react";

import type { Account } from "@/lib/mail/types";

import Icon from "./icon";
import { useMailUI } from "./mail-ui";

const COOKIE = "aster-accounts";

export default function AccountSwitcher({ accounts, enabled }: { accounts: Account[]; enabled: string[] }) {
  const router = useRouter();
  const [optimistic, setOptimistic] = useOptimistic(enabled);
  const [, startTransition] = useTransition();
  const { openPanel } = useMailUI();

  const toggle = (id: string) => {
    const next = optimistic.includes(id) ? optimistic.filter((value) => value !== id) : [...optimistic, id];
    if (next.length === 0) return; // Always keep at least one inbox visible.
    startTransition(() => {
      setOptimistic(next);
      document.cookie = `${COOKIE}=${next.join(",")}; path=/; max-age=31536000; samesite=lax`;
      router.refresh();
    });
  };

  return (
    <div className="account-switcher" role="group" aria-label="Inboxes">
      {accounts.map((account) => {
        const on = optimistic.includes(account.id);
        return (
          <button
            key={account.id}
            className={`account-chip account-${account.color} ${on ? "on" : ""}`}
            aria-pressed={on}
            aria-label={`${on ? "Hide" : "Show"} ${account.name} (${account.email})`}
            data-tooltip={`${account.name} · ${account.email}`}
            onClick={() => toggle(account.id)}
          >
            {account.initial}
            <span className="account-check">
              <Icon name="check" size={8} />
            </span>
          </button>
        );
      })}
      <button className="account-add" aria-label="Add account" data-tooltip="Add account" onClick={() => openPanel({ type: "add-account" })}>
        +
      </button>
    </div>
  );
}
