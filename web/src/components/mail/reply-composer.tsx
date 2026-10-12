"use client";

import { useState, useTransition } from "react";

import { draftReplyWithAI, replyToThread, undoReply } from "@/app/actions";

import Icon from "./icon";
import { useMailUI } from "./mail-ui";

export default function ReplyComposer({ id, recipient }: { id: string; recipient: string }) {
  const { showToast } = useMailUI();
  const [text, setText] = useState("");
  const [sending, startSend] = useTransition();
  const [drafting, startDraft] = useTransition();

  const send = () => {
    const body = text.trim();
    if (!body || sending) return;
    startSend(async () => {
      await replyToThread(id, body);
      setText("");
      showToast({
        message: "Message sent",
        undo: async () => {
          await undoReply(id);
          setText(body);
        },
      });
    });
  };

  return (
    <div className="reply-composer">
      <textarea
        id="reply-input"
        aria-label={`Reply to ${recipient}`}
        placeholder={`Reply to ${recipient}...`}
        rows={2}
        value={text}
        disabled={sending}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) send();
          if (event.key === "Escape") event.currentTarget.blur();
        }}
      />
      <div className="reply-composer-actions">
        <div>
          <button className="composer-tool" aria-label="Attach file" title="Attachments need a connected mail provider" disabled>
            <Icon name="paperclip" size={17} />
          </button>
          <button
            className="composer-tool ai-tool"
            aria-label="Draft with AI"
            disabled={drafting}
            onClick={() => startDraft(async () => setText(await draftReplyWithAI(id)))}
          >
            <Icon name="sparkle" size={16} />
            <span>{drafting ? "Drafting…" : "Draft with AI"}</span>
          </button>
        </div>
        <div>
          <span className="send-hint">⌘ ↵</span>
          <button className="reply-send" aria-label="Send reply" disabled={!text.trim() || sending} onClick={send}>
            <Icon name="arrowRight" size={17} />
          </button>
        </div>
      </div>
    </div>
  );
}
