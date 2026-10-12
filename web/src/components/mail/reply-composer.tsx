"use client";

import { useCallback, useState, useTransition } from "react";

import { draftReplyWithAI, replyToThread, undoReply } from "@/app/actions";
import { textToHtml } from "@/lib/mail/format";

import { FileChips, useAttachments } from "./attachments";
import Icon from "./icon";
import { useMailUI } from "./mail-ui";
import RichEditor from "./rich-editor";

export default function ReplyComposer({ id, recipient }: { id: string; recipient: string }) {
  const { showToast } = useMailUI();
  const [html, setHtml] = useState("");
  const [text, setText] = useState("");
  const [showFormatting, setShowFormatting] = useState(false);
  // Bumped to remount the editor when its content is replaced (AI draft, send, undo).
  const [editorKey, setEditorKey] = useState(0);
  const [linkRequest, setLinkRequest] = useState(0);
  const [sending, startSend] = useTransition();
  const [drafting, startDraft] = useTransition();
  const attachments = useAttachments();

  const onChange = useCallback((nextHtml: string, nextText: string) => {
    setHtml(nextHtml);
    setText(nextText);
  }, []);

  const replace = (nextHtml: string, nextText: string) => {
    setHtml(nextHtml);
    setText(nextText);
    setEditorKey((key) => key + 1);
  };

  const canSend = Boolean(text.trim() || attachments.files.length);

  const send = () => {
    if (!canSend || sending) return;
    const sentHtml = html;
    const sentText = text;
    const sentFiles = attachments.files;
    startSend(async () => {
      await replyToThread(id, sentHtml, attachments.files);
      replace("", "");
      attachments.clear();
      showToast({
        message: "Message sent",
        undo: async () => {
          await undoReply(id);
          replace(sentHtml, sentText);
          attachments.set(sentFiles);
        },
      });
    });
  };

  return (
    <div
      className={`reply-composer ${showFormatting ? "formatting" : ""}`}
      onKeyDown={(event) => {
        if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
          event.preventDefault();
          send();
        }
        if (event.key === "Escape") (document.activeElement as HTMLElement | null)?.blur();
      }}
    >
      <RichEditor
        key={editorKey}
        id="reply-input"
        variant="inline"
        initialHtml={html}
        placeholder={`Reply to ${recipient}...`}
        showToolbar={showFormatting}
        onChange={onChange}
        linkRequest={linkRequest}
      />
      <FileChips files={attachments.files} onRemove={attachments.remove} />
      {attachments.picker}
      <div className="reply-composer-actions">
        <div>
          <button
            className={`composer-tool ${showFormatting ? "toggled" : ""}`}
            aria-label="Formatting options"
            aria-pressed={showFormatting}
            data-tooltip="Formatting options"
            onClick={() => setShowFormatting((value) => !value)}
          >
            <Icon name="format" size={17} />
          </button>
          <button className="composer-tool" aria-label="Attach files" data-tooltip="Attach files" onClick={attachments.pick}>
            <Icon name="paperclip" size={17} />
          </button>
          <button
            className="composer-tool"
            aria-label="Insert link"
            data-tooltip="Insert link · ⌘K"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => setLinkRequest((value) => value + 1)}
          >
            <Icon name="link" size={16} />
          </button>
          <span className="tool-divider" />
          <button
            className="composer-tool ai-tool"
            aria-label="Draft with AI"
            disabled={drafting}
            onClick={() =>
              startDraft(async () => {
                const draft = await draftReplyWithAI(id);
                replace(textToHtml(draft), draft);
              })
            }
          >
            <Icon name="sparkle" size={16} />
            <span>{drafting ? "Drafting…" : "Draft with AI"}</span>
          </button>
        </div>
        <div>
          <span className="send-hint">⌘ ↵</span>
          <button className="reply-send" aria-label="Send reply" disabled={!canSend || sending} onClick={send}>
            <Icon name="arrowRight" size={17} />
          </button>
        </div>
      </div>
    </div>
  );
}
