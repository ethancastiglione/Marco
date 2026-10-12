"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useOptimistic, useRef, useState, useTransition } from "react";

import { markAllRead, moveThread, restoreThread, setRead, setStarred, setThreadLabels, snoozeThread } from "@/app/actions";
import type { Attachment, Label, SortOrder, ThreadLocation } from "@/lib/mail/types";

import Icon from "./icon";
import { isTypingTarget, overlayOpen, useMailUI, type ComposeDraft } from "./mail-ui";
import Menu from "./menu";

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
  labels: Label[];
  labelIds: string[];
  forward: ComposeDraft;
};

export function ThreadToolbar({ id, location, unread, position, hrefs, labels, labelIds, forward }: ToolbarProps) {
  const router = useRouter();
  const { showToast, openCompose } = useMailUI();
  const [pending, startTransition] = useTransition();
  const [optimisticLabels, setOptimisticLabels] = useOptimistic(labelIds);

  const move = (to: "inbox" | "archive" | "trash", message: string) =>
    startTransition(async () => {
      const before = await moveThread(id, to);
      router.push(hrefs.afterRemove);
      showToast({ message, undo: () => restoreThread(id, before) });
    });

  const archive = () =>
    location === "archive" || location === "trash"
      ? move("inbox", "Moved to inbox")
      : move("archive", "Conversation archived");
  const trash = () => location !== "trash" && move("trash", "Moved to trash");

  const snooze = (label: string) =>
    startTransition(async () => {
      // Resolve the time at click, not render, so a long-open thread never snoozes into the past.
      const option = snoozeOptions().find((candidate) => candidate.label === label);
      if (!option) return;
      const before = await snoozeThread(id, option.until.toISOString());
      router.push(hrefs.afterRemove);
      showToast({ message: `Snoozed until ${label.toLowerCase()}`, undo: () => restoreThread(id, before) });
    });

  const toggleRead = () =>
    startTransition(async () => {
      // Leave the thread before marking it unread, or opening it would mark it read again.
      if (!unread) router.push(hrefs.list);
      await setRead(id, unread);
    });

  const toggleLabel = (labelId: string) => {
    const next = optimisticLabels.includes(labelId)
      ? optimisticLabels.filter((value) => value !== labelId)
      : [...optimisticLabels, labelId];
    startTransition(async () => {
      setOptimisticLabels(next);
      await setThreadLabels(id, next);
    });
  };

  // Keyboard shortcuts for the open thread. Re-bound each render so they see current props.
  const handlers = useRef<Record<string, () => void>>({});
  handlers.current = {
    j: () => hrefs.next && router.push(hrefs.next),
    k: () => hrefs.prev && router.push(hrefs.prev),
    e: () => location !== "drafts" && archive(),
    "#": () => location !== "drafts" && trash(),
    s: () => location !== "drafts" && document.querySelector<HTMLButtonElement>(".large-star")?.click(),
    r: () => document.querySelector<HTMLElement>("#reply-input")?.focus(),
    f: () => location !== "drafts" && openCompose(forward),
    u: () => router.push(hrefs.list),
  };
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target) || event.metaKey || event.ctrlKey || event.altKey || overlayOpen()) return;
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
            <button className="icon-button" data-tooltip={restoring ? "Move to inbox" : "Archive · E"} aria-label={restoring ? "Move to inbox" : "Archive"} onClick={archive} disabled={pending}>
              <Icon name={restoring ? "inbox" : "archive"} size={17} />
            </button>
            <Menu
              label="Snooze"
              icon="clock"
              disabled={pending}
              items={[
                { type: "heading", label: "Snooze until…" },
                ...snoozeOptions().map((option) => ({
                  label: option.label,
                  hint: option.detail,
                  onSelect: () => snooze(option.label),
                })),
              ]}
            />
            {location !== "trash" && (
              <button className="icon-button" data-tooltip="Delete · #" aria-label="Delete" onClick={trash} disabled={pending}>
                <Icon name="trash" size={17} />
              </button>
            )}
            <button
              className="icon-button"
              data-tooltip={unread ? "Mark as read" : "Mark as unread"}
              aria-label={unread ? "Mark as read" : "Mark as unread"}
              onClick={toggleRead}
              disabled={pending}
            >
              <Icon name={unread ? "mailOpen" : "mail"} size={17} />
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
          <Link className="icon-button" aria-label="Previous" data-tooltip="Previous · K" href={hrefs.prev}>
            <Icon name="arrowLeft" size={16} />
          </Link>
        ) : (
          <button className="icon-button" aria-label="Previous" disabled>
            <Icon name="arrowLeft" size={16} />
          </button>
        )}
        {hrefs.next ? (
          <Link className="icon-button" aria-label="Next" data-tooltip="Next · J" href={hrefs.next}>
            <Icon name="arrowRight" size={16} />
          </Link>
        ) : (
          <button className="icon-button" aria-label="Next" disabled>
            <Icon name="arrowRight" size={16} />
          </button>
        )}
        <Menu
          label="More actions"
          align="end"
          items={[
            { label: "Reply", icon: "reply", hint: "R", disabled: isDraft, onSelect: () => handlers.current.r() },
            { label: "Forward", icon: "send", hint: "F", disabled: isDraft, onSelect: () => openCompose(forward) },
            { label: unread ? "Mark as read" : "Mark as unread", icon: unread ? "mailOpen" : "mail", disabled: isDraft, onSelect: toggleRead },
            { type: "divider" },
            { type: "heading", label: "Label as" },
            ...labels.map((label) => ({
              label: label.name,
              checked: optimisticLabels.includes(label.id),
              keepOpen: true,
              onSelect: () => toggleLabel(label.id),
            })),
            { type: "divider" },
            { label: "Print", icon: "print", onSelect: () => window.print() },
          ]}
        />
      </div>
    </div>
  );
}

/** Per-message overflow in the reading pane. */
export function MessageMenu({ forward, link }: { forward: ComposeDraft; link: string }) {
  const { openCompose, showToast } = useMailUI();
  return (
    <Menu
      label="Message actions"
      align="end"
      items={[
        { label: "Reply", icon: "reply", onSelect: () => document.querySelector<HTMLElement>("#reply-input")?.focus() },
        { label: "Forward", icon: "send", onSelect: () => openCompose(forward) },
        {
          label: "Copy link",
          icon: "link",
          onSelect: () => {
            void navigator.clipboard?.writeText(new URL(link, window.location.origin).toString());
            showToast({ message: "Link copied" });
          },
        },
        { label: "Print", icon: "print", onSelect: () => window.print() },
      ]}
    />
  );
}

/** Sort and bulk actions for the message list. */
export function ListMenu({ mailbox, sort, query }: { mailbox: string; sort: SortOrder; query: string }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const sortHref = (next: SortOrder) => {
    const params = new URLSearchParams(query);
    if (next === "newest") params.delete("sort");
    else params.set("sort", next);
    const qs = params.toString();
    return `/${mailbox}${qs ? `?${qs}` : ""}`;
  };
  const options: { value: SortOrder; label: string }[] = [
    { value: "newest", label: "Newest first" },
    { value: "oldest", label: "Oldest first" },
    { value: "unread", label: "Unread first" },
  ];
  return (
    <Menu
      label="List options"
      align="end"
      items={[
        { type: "heading", label: "Sort" },
        ...options.map((option) => ({
          label: option.label,
          checked: sort === option.value,
          onSelect: () => router.replace(sortHref(option.value)),
        })),
        { type: "divider" },
        { label: "Mark all as read", icon: "check", onSelect: () => startTransition(() => markAllRead(mailbox)) },
        { label: "Refresh", icon: "arrowDown", onSelect: () => router.refresh() },
      ]}
    />
  );
}

export function AttachmentCard({ attachment, from }: { attachment: Attachment; from: string }) {
  const { openPanel } = useMailUI();
  return (
    <button className="attachment-card" onClick={() => openPanel({ type: "attachment", attachment, from })}>
      <div className={`file-icon file-${attachment.kind}`}>{attachment.kind.toUpperCase()}</div>
      <div>
        <strong>{attachment.name}</strong>
        <span>{[attachment.size, attachment.detail].filter(Boolean).join(" · ")}</span>
      </div>
      <div className="download-icon" aria-hidden="true">
        <Icon name="eye" size={16} />
      </div>
    </button>
  );
}
