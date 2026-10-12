import Link from "next/link";

import { formatListTime } from "@/lib/mail/format";
import { filterTokens, freeText, OPERATORS, toggleToken, type Segment } from "@/lib/mail/search";
import type { SearchHit, SortOrder, ThreadSummary } from "@/lib/mail/types";

import Icon from "./icon";
import { ListMenu, MarkAllReadButton, StarButton } from "./thread-actions";

function Highlighted({ segments }: { segments: Segment[] }) {
  return segments.map((segment, index) => (segment.hit ? <mark key={index}>{segment.text}</mark> : segment.text));
}

function MessageCard({
  thread,
  selected,
  href,
  showAccount,
}: {
  thread: ThreadSummary | SearchHit;
  selected: boolean;
  href: string;
  showAccount: boolean;
}) {
  const hit = "highlights" in thread ? thread : undefined;
  return (
    <article className={`message-card ${selected ? "selected" : ""} ${thread.unread ? "unread" : ""}`}>
      <Link className="card-link" href={href} aria-label={`${thread.sender}: ${thread.subject}`} aria-current={selected ? "true" : undefined} />
      <span className="read-state" aria-label={thread.unread ? "Unread" : "Read"} />
      <div className={`sender-avatar avatar-${thread.avatar}`}>
        {thread.initials}
        {showAccount && thread.account && <span className={`account-pip account-${thread.account.color}`} title={thread.account.email} />}
      </div>
      <div className="message-main">
        <div className="message-meta">
          <strong className={thread.isDraft ? "draft-sender" : undefined}>
            {hit ? <Highlighted segments={hit.highlights.sender} /> : thread.sender}
          </strong>
          <span>{formatListTime(thread.lastAt)}</span>
        </div>
        <div className="subject-row">
          <span>{hit ? <Highlighted segments={hit.highlights.subject} /> : thread.subject}</span>
          {!thread.isDraft && <StarButton id={thread.id} starred={thread.starred} />}
        </div>
        <p>{hit ? <Highlighted segments={hit.highlights.snippet} /> : thread.preview}</p>
        {(thread.label || thread.hasAttachment || thread.receipt || (hit && hit.where !== "Inbox")) && (
          <div className="message-badges">
            {hit && hit.where !== "Inbox" && <span className="where-badge">{hit.where}</span>}
            {thread.receipt && (
              <span className={`receipt-badge ${thread.receipt}`}>
                <Icon name={thread.receipt === "read" ? "eye" : "check"} size={11} />
                {thread.receipt === "read" ? "Read" : "Not opened"}
              </span>
            )}
            {thread.label && <span>{thread.label.name}</span>}
            {thread.hasAttachment && <Icon name="paperclip" size={13} />}
          </div>
        )}
      </div>
    </article>
  );
}

type MailboxProps = {
  mailbox: string;
  title: string;
  threads: ThreadSummary[];
  selectedId?: string;
  unreadOnly: boolean;
  unreadCount: number;
  sort: SortOrder;
  /** Which inboxes are shown, e.g. "All inboxes". */
  scope: string;
  /** Mark each card with its account when several inboxes are mixed together. */
  showAccounts: boolean;
  hrefFor: (id: string) => string;
};

export default function MessageList({ mailbox, title, threads, selectedId, unreadOnly, unreadCount, sort, scope, showAccounts, hrefFor }: MailboxProps) {
  const filterHref = (unread: boolean) => {
    const params = new URLSearchParams();
    if (unread) params.set("filter", "unread");
    if (sort !== "newest") params.set("sort", sort);
    const qs = params.toString();
    return `/${mailbox}${qs ? `?${qs}` : ""}`;
  };
  const query = new URLSearchParams();
  if (unreadOnly) query.set("filter", "unread");

  return (
    <section className="message-list">
      <div className="list-heading">
        <div>
          <span className="section-kicker">{scope}</span>
          <h1>{title}</h1>
        </div>
        <div className="heading-actions">
          <MarkAllReadButton mailbox={mailbox} />
          <ListMenu mailbox={mailbox} sort={sort} query={query.toString()} />
        </div>
      </div>
      <div className="filter-row">
        <Link className={`filter ${unreadOnly ? "" : "active"}`} href={filterHref(false)} replace>
          All
        </Link>
        <Link className={`filter ${unreadOnly ? "active" : ""}`} href={filterHref(true)} replace>
          Unread
          {unreadCount > 0 && <span className="filter-count">{unreadCount}</span>}
        </Link>
        <span className="message-total">
          {sort !== "newest" && <span className="sort-note">{sort === "oldest" ? "Oldest first" : "Unread first"} · </span>}
          {threads.length} {threads.length === 1 ? "message" : "messages"}
        </span>
      </div>

      <div className="messages">
        {threads.length ? (
          threads.map((thread) => (
            <MessageCard thread={thread} selected={selectedId === thread.id} href={hrefFor(thread.id)} showAccount={showAccounts} key={thread.id} />
          ))
        ) : (
          <div className="empty-state">
            <Icon name="check" size={24} />
            <strong>{unreadOnly ? "No unread mail" : "Nothing here"}</strong>
            <span>You’re all caught up.</span>
          </div>
        )}
      </div>
    </section>
  );
}

const QUICK_FILTERS = [
  { token: "is:unread", label: "Unread" },
  { token: "is:starred", label: "Starred" },
  { token: "has:attachment", label: "Has attachment" },
  { token: "in:sent", label: "Sent by me" },
];

type SearchProps = {
  query: string;
  sections: { title: string; threads: SearchHit[] }[];
  total: number;
  selectedId?: string;
  scope: string;
  showAccounts: boolean;
  hrefFor: (id: string) => string;
};

export function SearchResults({ query, sections, total, selectedId, scope, showAccounts, hrefFor }: SearchProps) {
  const searchHref = (q: string) => (q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  const active = filterTokens(query);
  const words = freeText(query);

  return (
    <section className="message-list search-list">
      <div className="list-heading">
        <div>
          <span className="section-kicker">
            {total} {total === 1 ? "result" : "results"} · {scope}
          </span>
          <h1>{words ? `“${words}”` : "Search"}</h1>
        </div>
      </div>
      <div className="filter-row chips-row">
        {active.map((token) => (
          <Link className="chip active" href={searchHref(toggleToken(query, token))} key={token} replace aria-label={`Remove filter ${token}`}>
            {token}
            <Icon name="close" size={10} />
          </Link>
        ))}
        {QUICK_FILTERS.filter((filter) => !active.includes(filter.token)).map((filter) => (
          <Link className="chip" href={searchHref(toggleToken(query, filter.token))} key={filter.token} replace>
            <Icon name="filter" size={11} />
            {filter.label}
          </Link>
        ))}
      </div>

      <div className="messages">
        {total ? (
          sections.map((section) => (
            <div key={section.title}>
              <h2 className="list-section">{section.title}</h2>
              {section.threads.map((thread) => (
                <MessageCard thread={thread} selected={selectedId === thread.id} href={hrefFor(thread.id)} showAccount={showAccounts} key={thread.id} />
              ))}
            </div>
          ))
        ) : (
          <div className="empty-state search-empty">
            <Icon name="search" size={24} />
            <strong>{query ? "No matching conversations" : "Search your mail"}</strong>
            <span>{query ? "Try fewer words, or remove a filter." : "Search across every inbox you have selected."}</span>
            <dl className="operator-help">
              {OPERATORS.slice(0, 6).map((operator) => (
                <div key={operator.token}>
                  <dt>{operator.token}</dt>
                  <dd>{operator.hint}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>
    </section>
  );
}
