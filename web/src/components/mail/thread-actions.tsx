"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useOptimistic, useRef, useState, useTransition } from "react";

import { markAllRead, moveThread, setRead, setStarred, snoozeThread } from "@/app/actions";
import type { ThreadLocation } from "@/lib/mail/types";

import Icon from "./icon";
import { isTypingTarget, useMailUI, type ComposeDraft } from "./mail-ui";

export function StarButton({ id, starred, large }: { id: string; starred: boolean; large?: boolean }) {
  const [optimistic, setOptimistic] = useOptimistic(starred);
  const [, startTransition] = useTransition();

  return (
    <button
      className={`${large ? "large-star" : "star-button"} ${optimistic ? "starred" : ""}`}
      aria-label={optimistic ? "Unstar message" : "Star message"}
      aria-pressed={optimistic}
      onClick={() =>
        startTransition(async () => {
          setOptimistic(!optimistic);
          await setStarred(id, !optimistic);
        })
      }
    >
      <Icon name="star" size={large ? 18 : 15} />
    </button>
  );
}

export function MarkAllReadButton({ mailbox }: { mailbox: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      className="icon-button"
      title="Mark all as read"
      disabled={pending}
      onClick={() => startTransition(() => markAllRead(mailbox))}
    >
      <Icon name="check" size={17} />
    </button>
  );
}

export function MarkReadOnOpen({ id }: { id: string }) {
  const marked = useRef(false);
  useEffect(() => {
    if (marked.current) return;
    marked.current = true;
    void setRead(id, true);
  }, [id]);
  return null;
}

export function RecipientsToggle({ summary, full }: { summary: string; full: string }) {
  const [open, setOpen] = useState(false);
  return (
    <button onClick={() => setOpen((value) => !value)} aria-expanded={open}>
      {open ? full : summary} <Icon name="arrowDown" size={12} />
    </button>
  );
}

export function ContinueDraftButton({ draft }: { draft: ComposeDraft }) {
  const { openCompose } = useMailUI();
  return (
    <button className="continue-draft" onClick={() => openCompose(draft)}>
      <Icon name="compose" size={16} />
      Continue editing
    </button>
  );
}

function snoozeOptions(now = new Date()) {
  const at = (days: number, hour: number) => {
    const date = new Date(now);
    date.setDate(date.getDate() + days);
    date.setHours(hour, 0, 0, 0);
    return date;
  };
  const laterToday = new Date(now.getTime() + 3 * 60 * 60_000);
  const daysToMonday = ((8 - now.getDay()) % 7) || 7;
  return [
    { label: "Later today", detail: laterToday.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }), until: laterToday },
    { label: "Tomorrow", detail: "8:00 AM", until: at(1, 8) },
    { label: "Next week", detail: "Mon, 8:00 AM", until: at(daysToMonday, 8) },
  ];
}

type ToolbarProps = {
  id: string;
  location: ThreadLocation;
  unread: boolean;
  position: { index: number; total: number };
  hrefs: { list: string; prev?: string; next?: string; afterRemove: string };
};

export function ThreadToolbar({ id, location, unread, position, hrefs }: ToolbarProps) {
  const router = useRouter();
  const { showToast } = useMailUI();
  const [pending, startTransition] = useTransition();
  const [snoozeOpen, setSnoozeOpen] = useState(false);

  const move = (to: "inbox" | "archive" | "trash", message: string) =>
    startTransition(async () => {
      await moveThread(id, to);
      router.push(hrefs.afterRemove);
      showToast({ message, undo: () => moveThread(id, location === "drafts" ? "inbox" : location) });
    });

  const archive = () =>
    location === "archive" || location === "trash"
      ? move("inbox", "Moved to inbox")
      : move("archive", "Conversation archived");
  const trash = () => location !== "trash" && move("trash", "Moved to trash");

  const snooze = (until: Date, label: string) =>
    startTransition(async () => {
      setSnoozeOpen(false);
      await snoozeThread(id, until.toISOString());
      router.push(hrefs.afterRemove);
      showToast({ message: `Snoozed until ${label.toLowerCase()}`, undo: () => moveThread(id, "inbox") });
    });

  // Keyboard shortcuts for the open thread. Re-bound each render so they see current props.
  const handlers = useRef<Record<string, () => void>>({});
  handlers.current = {
    j: () => hrefs.next && router.push(hrefs.next),
    k: () => hrefs.prev && router.push(hrefs.prev),
    e: () => location !== "drafts" && archive(),
    "#": () => location !== "drafts" && trash(),
    s: () =>
      location !== "drafts" &&
      (document.querySelector<HTMLButtonElement>(".large-star")?.click()),
    r: () => document.getElementById("reply-input")?.focus(),
    u: () => router.push(hrefs.list),
  };
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target) || event.metaKey || event.ctrlKey || event.altKey) return;
      const handler = handlers.current[event.key];
      if (!handler) return;
      event.preventDefault();
      handler();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const isDraft = location === "drafts";
  const restoring = location === "archive" || location === "trash";

  return (
    <div className="message-toolbar">
      <div>
        <Link className="icon-button mobile-back" aria-label="Back" href={hrefs.list}>
          <Icon name="arrowLeft" />
        </Link>
        {!isDraft && (
          <>
            <button
              className="icon-button"
              title={restoring ? "Move to inbox" : "Archive (E)"}
              onClick={archive}
              disabled={pending}
            >
              <Icon name={restoring ? "inbox" : "archive"} size={17} />
            </button>
            <div className="menu-anchor">
              <button
                className="icon-button"
                title="Snooze"
                aria-expanded={snoozeOpen}
                onClick={() => setSnoozeOpen((value) => !value)}
                disabled={pending}
              >
                <Icon name="clock" size={17} />
              </button>
              {snoozeOpen && (
                <>
                  <div className="menu-dismiss" onClick={() => setSnoozeOpen(false)} />
                  <div className="menu" role="menu">
                    <span className="menu-title">Snooze until…</span>
                    {snoozeOptions().map((option) => (
                      <button role="menuitem" key={option.label} onClick={() => snooze(option.until, option.label)}>
                        <span>{option.label}</span>
                        <small>{option.detail}</small>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            {location !== "trash" && (
              <button className="icon-button" title="Delete (#)" onClick={trash} disabled={pending}>
                <Icon name="trash" size={17} />
              </button>
            )}
            <button
              className="icon-button"
              title={unread ? "Mark as read" : "Mark as unread"}
              onClick={() =>
                startTransition(async () => {
                  // Leave the thread before marking it unread, or opening it would mark it read again.
                  if (!unread) router.push(hrefs.list);
                  await setRead(id, unread);
                })
              }
              disabled={pending}
            >
              <Icon name="mail" size={17} />
            </button>
          </>
        )}
        {isDraft && <span className="toolbar-note">Draft</span>}
      </div>
      <div>
        <span className="pagination">
          {position.index >= 0 ? `${position.index + 1} of ${position.total}` : `${position.total} in view`}
        </span>
        {hrefs.prev ? (
          <Link className="icon-button" aria-label="Previous message (K)" href={hrefs.prev}>
            <Icon name="arrowLeft" size={16} />
          </Link>
        ) : (
          <button className="icon-button" aria-label="Previous message" disabled>
            <Icon name="arrowLeft" size={16} />
          </button>
        )}
        {hrefs.next ? (
          <Link className="icon-button" aria-label="Next message (J)" href={hrefs.next}>
            <Icon name="arrowRight" size={16} />
          </Link>
        ) : (
          <button className="icon-button" aria-label="Next message" disabled>
            <Icon name="arrowRight" size={16} />
          </button>
        )}
        <button className="icon-button" aria-label="More options">
          <Icon name="dots" size={19} />
        </button>
      </div>
    </div>
  );
}
