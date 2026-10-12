import Link from "next/link";

import { formatListTime } from "@/lib/mail/format";
import type { ThreadSummary } from "@/lib/mail/types";

import Icon from "./icon";
import { MarkAllReadButton, StarButton } from "./thread-actions";

type Props = {
  mailbox: string;
  title: string;
  threads: ThreadSummary[];
  selectedId?: string;
  unreadOnly: boolean;
  query?: string;
  hrefFor: (id: string) => string;
};

export default function MessageList({ mailbox, title, threads, selectedId, unreadOnly, query, hrefFor }: Props) {
  const filterHref = (unread: boolean) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (unread) params.set("filter", "unread");
    const qs = params.toString();
    return `/${mailbox}${qs ? `?${qs}` : ""}`;
  };

  return (
    <section className="message-list">
      <div className="list-heading">
        <div>
          <span className="section-kicker">{query ? `Results for “${query}”` : "Mailbox"}</span>
          <h1>{title}</h1>
        </div>
        <div className="heading-actions">
          <MarkAllReadButton mailbox={mailbox} />
          <button className="icon-button" title="More options">
            <Icon name="dots" size={19} />
          </button>
        </div>
      </div>
      <div className="filter-row">
        <Link className={`filter ${unreadOnly ? "" : "active"}`} href={filterHref(false)} replace>
          All
        </Link>
        <Link className={`filter ${unreadOnly ? "active" : ""}`} href={filterHref(true)} replace>
          Unread
        </Link>
        <span className="message-total">
          {threads.length} {threads.length === 1 ? "message" : "messages"}
        </span>
      </div>

      <div className="messages">
        {threads.length ? (
          threads.map((thread) => (
            <article
              className={`message-card ${selectedId === thread.id ? "selected" : ""} ${thread.unread ? "unread" : ""}`}
              key={thread.id}
            >
              <Link
                className="card-link"
                href={hrefFor(thread.id)}
                aria-label={`${thread.sender}: ${thread.subject}`}
                aria-current={selectedId === thread.id ? "true" : undefined}
              />
              <div className={`sender-avatar avatar-${thread.avatar}`}>{thread.initials}</div>
              <div className="message-main">
                <div className="message-meta">
                  <strong className={thread.isDraft ? "draft-sender" : undefined}>{thread.sender}</strong>
                  <span>{formatListTime(thread.lastAt)}</span>
                </div>
                <div className="subject-row">
                  <span>{thread.subject}</span>
                  {!thread.isDraft && <StarButton id={thread.id} starred={thread.starred} />}
                </div>
                <p>{thread.preview}</p>
                {(thread.label || thread.hasAttachment) && (
                  <div className="message-badges">
                    {thread.label && <span>{thread.label.name}</span>}
                    {thread.hasAttachment && <Icon name="paperclip" size={13} />}
                  </div>
                )}
              </div>
            </article>
          ))
        ) : (
          <div className="empty-state">
            <Icon name={query ? "search" : "check"} size={24} />
            <strong>{query ? "No messages found" : "Nothing here"}</strong>
            <span>{query ? "Try a different name or keyword." : "You’re all caught up."}</span>
          </div>
        )}
      </div>
    </section>
  );
}
