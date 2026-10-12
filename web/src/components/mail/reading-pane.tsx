import { Fragment } from "react";

import { bodyToHtml, firstName, formatMessageTime, initials } from "@/lib/mail/format";
import { sanitizeEmailHtml } from "@/lib/mail/html";
import type { Account, BodyBlock, Label, Message, Thread } from "@/lib/mail/types";

import { me } from "@/lib/mail/seed";

import Icon from "./icon";
import ReplyComposer from "./reply-composer";
import { ContinueDraftButton, MarkReadOnOpen, RecipientsToggle, StarButton, ThreadToolbar } from "./thread-actions";

type Props = {
  thread: Thread;
  label?: Label;
  account?: Account;
  /** True when the user opened this thread, rather than it being shown by default. */
  opened: boolean;
  position: { index: number; total: number };
  hrefs: { list: string; prev?: string; next?: string; afterRemove: string };
};

function Body({ blocks }: { blocks: BodyBlock[] }) {
  return blocks.map((block, index) =>
    block.type === "html" ? (
      // Sanitized when stored; sanitized again here so rendering never trusts storage.
      <div className="rich-body" key={index} dangerouslySetInnerHTML={{ __html: sanitizeEmailHtml(block.html) }} />
    ) : block.type === "p" ? (
      <p key={index}>
        {block.text.split("\n").map((line, lineIndex) => (
          <Fragment key={lineIndex}>
            {lineIndex > 0 && <br />}
            {line}
          </Fragment>
        ))}
      </p>
    ) : (
      <ol key={index}>
        {block.items.map((item) => (
          <li key={item.title}>
            <strong>{item.title}</strong>
            <span>{item.text}</span>
          </li>
        ))}
      </ol>
    ),
  );
}

function recipientSummary(message: Message) {
  const others = message.to.filter((person) => person.email !== me.email).length;
  if (others === 0) return "to me";
  return `to me & ${others} ${others === 1 ? "other" : "others"}`;
}

function IncomingMessage({ message }: { message: Message }) {
  return (
    <div className="thread-message">
      <div className="sender-row">
        <div className={`sender-avatar large avatar-${message.from.avatar}`}>
          {initials(message.from.name)}
        </div>
        <div className="sender-details">
          <strong>{message.from.name}</strong>
          <RecipientsToggle
            summary={recipientSummary(message)}
            full={`to ${message.to.map((person) => (person.email === me.email ? "me" : person.name)).join(", ")}`}
          />
        </div>
        <div className="sender-actions">
          <span>{formatMessageTime(message.sentAt)}</span>
          <button className="icon-button" aria-label="More">
            <Icon name="dots" size={18} />
          </button>
        </div>
      </div>

      <div className="email-body">
        <Body blocks={message.body} />
      </div>

      {message.attachments.map((attachment) => (
        <div className="attachment-card" key={attachment.id}>
          <div className="file-icon">{attachment.kind.toUpperCase()}</div>
          <div>
            <strong>{attachment.name}</strong>
            <span>{[attachment.size, attachment.detail].filter(Boolean).join(" · ")}</span>
          </div>
          <div className="download-icon" title="Downloads need a connected mail provider">
            <Icon name="arrowDown" size={17} />
          </div>
        </div>
      ))}
    </div>
  );
}

function SentMessage({ message }: { message: Message }) {
  return (
    <div className="sent-thread-message">
      <div className="sent-message-meta">
        <span>You</span>
        <span>{formatMessageTime(message.sentAt)}</span>
      </div>
      <div className="sent-body">
        <Body blocks={message.body} />
      </div>
      <div className={`read-receipt ${message.readAt ? "read" : ""}`}>
        <Icon name={message.readAt ? "checkDouble" : "check"} size={12} />
        {message.readAt ? `Read ${formatMessageTime(message.readAt)}` : "Sent · not opened yet"}
      </div>
    </div>
  );
}

export default function ReadingPane({ thread, label, account, opened, position, hrefs }: Props) {
  const isDraft = thread.location === "drafts";
  const lead = thread.participants[0];

  return (
    <section className="reading-pane">
      {opened && thread.unread && <MarkReadOnOpen id={thread.id} />}
      <ThreadToolbar
        id={thread.id}
        location={thread.location}
        unread={thread.unread}
        position={position}
        hrefs={hrefs}
      />

      <article className="email-content">
        <div className="email-title-row">
          <div>
            <div className="email-tags">
              <div className="email-label">{isDraft ? "Draft" : (label?.name ?? "Inbox")}</div>
              {account && (
                <div className="email-account">
                  <span className={`account-dot account-${account.color}`} />
                  {account.email}
                </div>
              )}
            </div>
            <h2>{thread.subject || "(no subject)"}</h2>
          </div>
          {!isDraft && <StarButton id={thread.id} starred={thread.starred} large />}
        </div>

        <div className="thread">
          {thread.messages.map((message) =>
            message.fromMe ? (
              <SentMessage message={message} key={message.id} />
            ) : (
              <IncomingMessage message={message} key={message.id} />
            ),
          )}
        </div>

        {isDraft ? (
          <ContinueDraftButton
            draft={{
              draftId: thread.id,
              to: thread.participants.map((person) => person.email || person.name).join(", "),
              subject: thread.subject,
              body: bodyToHtml(thread.messages[0].body),
            }}
          />
        ) : (
          <ReplyComposer key={thread.id} id={thread.id} recipient={lead ? firstName(lead.name) : "thread"} />
        )}
      </article>
    </section>
  );
}

export function EmptyReadingPane() {
  return (
    <section className="reading-pane no-selection">
      <Icon name="check" size={28} />
      <strong>Inbox zero, for now</strong>
      <span>You’ve cleared every message in this view.</span>
    </section>
  );
}
