"use client";

import { useCallback, useState, useTransition } from "react";

import { discardDraft, draftMessageWithAI, saveDraft, sendMessage, undoSend } from "@/app/actions";
import { htmlToText, textToHtml } from "@/lib/mail/format";

import { FileChips, useAttachments } from "./attachments";
import Icon from "./icon";
import { useMailUI, type ComposeDraft } from "./mail-ui";
import RichEditor from "./rich-editor";

export default function ComposeWindow({ initial }: { initial: ComposeDraft }) {
  const { closeCompose, openCompose, showToast } = useMailUI();
  const [draft, setDraft] = useState(initial);
  const [minimized, setMinimized] = useState(false);
  const [showCc, setShowCc] = useState(false);
  const [cc, setCc] = useState("");
  const [pending, startTransition] = useTransition();
  const [bodyText, setBodyText] = useState(() => htmlToText(initial.body));
  const [showFormatting, setShowFormatting] = useState(true);
  // Bumped to remount the editor when its content is replaced (e.g. by an AI draft).
  const [editorKey, setEditorKey] = useState(0);
  const [linkRequest, setLinkRequest] = useState(0);
  const attachments = useAttachments();

  const onBodyChange = useCallback((html: string, text: string) => {
    setDraft((current) => ({ ...current, body: html }));
    setBodyText(text);
  }, []);

  const update = (field: keyof ComposeDraft) => (event: { target: { value: string } }) =>
    setDraft((current) => ({ ...current, [field]: event.target.value }));

  const recipients = [draft.to, cc].filter((value) => value.trim()).join(", ");
  const isEmpty = !recipients && !draft.subject.trim() && !bodyText.trim();
  const message = { to: recipients, subject: draft.subject, body: draft.body, draftId: draft.draftId, attachments: attachments.files };

  const send = () => {
    if (!recipients) {
      document.getElementById("compose-to")?.focus();
      return;
    }
    startTransition(async () => {
      const id = await sendMessage(message);
      closeCompose();
      showToast({
        message: "Message sent",
        undo: async () => {
          await undoSend(id);
          openCompose({ ...draft, to: recipients, draftId: id });
        },
      });
    });
  };

  const close = () => {
    if (isEmpty) return closeCompose();
    startTransition(async () => {
      await saveDraft(message);
      closeCompose();
      showToast({ message: "Draft saved" });
    });
  };

  const discard = () => {
    startTransition(async () => {
      if (draft.draftId) await discardDraft(draft.draftId);
      closeCompose();
      if (!isEmpty) showToast({ message: "Draft discarded" });
    });
  };

  const writeWithAI = () => {
    startTransition(async () => {
      const text = await draftMessageWithAI(recipients, draft.subject);
      setDraft((current) => ({ ...current, body: textToHtml(text) }));
      setBodyText(text);
      setEditorKey((key) => key + 1);
    });
  };

  return (
    <div
      className={`compose-window ${minimized ? "minimized" : ""}`}
      role="dialog"
      aria-label="New message"
      onKeyDown={(event) => {
        if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) send();
        if (event.key === "Escape") close();
      }}
    >
      <div className="compose-header">
        <strong>{draft.subject.trim() || "New message"}</strong>
        <div>
          <button
            className="icon-button"
            aria-label={minimized ? "Expand" : "Minimize"}
            onClick={() => setMinimized((value) => !value)}
          >
            <span className="minimize-line" />
          </button>
          <button className="icon-button" aria-label="Close" onClick={close}>
            <Icon name="close" size={16} />
          </button>
        </div>
      </div>
      {!minimized && (
        <>
          <label className="compose-line">
            <span>To</span>
            <input id="compose-to" autoFocus={!draft.to} aria-label="Recipients" value={draft.to} onChange={update("to")} />
            {!showCc && (
              <button type="button" onClick={() => setShowCc(true)}>
                Cc Bcc
              </button>
            )}
          </label>
          {showCc && (
            <label className="compose-line">
              <span>Cc</span>
              <input autoFocus aria-label="Cc" value={cc} onChange={(event) => setCc(event.target.value)} />
            </label>
          )}
          <label className="compose-line">
            <span>Subject</span>
            <input aria-label="Subject" value={draft.subject} onChange={update("subject")} />
          </label>
          <RichEditor
            key={editorKey}
            initialHtml={draft.body}
            placeholder="Write something thoughtful..."
            showToolbar={showFormatting}
            autoFocus={Boolean(draft.to)}
            onChange={onBodyChange}
            linkRequest={linkRequest}
          />
          <FileChips files={attachments.files} onRemove={attachments.remove} />
          {attachments.picker}
          <div className="compose-footer">
            <button className="send-button" onClick={send} disabled={pending}>
              Send <kbd>⌘ ↵</kbd>
            </button>
            <div>
              <button
                className={`icon-button ${showFormatting ? "toggled" : ""}`}
                aria-label="Formatting options"
                aria-pressed={showFormatting}
                data-tooltip="Formatting options"
                onClick={() => setShowFormatting((value) => !value)}
              >
                <Icon name="format" size={18} />
              </button>
              <button
                className="icon-button"
                aria-label="Insert link"
                data-tooltip="Insert link (⌘K)"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => setLinkRequest((value) => value + 1)}
              >
                <Icon name="link" size={17} />
              </button>
              <button className="icon-button" aria-label="Attach files" data-tooltip="Attach files" onClick={attachments.pick}>
                <Icon name="paperclip" size={18} />
              </button>
              <button className="icon-button ai-write" aria-label="Write with AI" data-tooltip="Write with AI" onClick={writeWithAI} disabled={pending}>
                <Icon name="sparkle" size={17} />
              </button>
            </div>
            <button className="icon-button compose-trash" aria-label="Discard draft" data-tooltip="Discard draft" onClick={discard} disabled={pending}>
              <Icon name="trash" size={17} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
