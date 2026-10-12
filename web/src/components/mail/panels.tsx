"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";

import { addAccount, askAster, getAccounts } from "@/app/actions";
import type { AsterAnswer } from "@/lib/ai/assistant";
import type { Account, Attachment } from "@/lib/mail/types";

import Icon from "./icon";
import Modal from "./modal";

export type Panel =
  | { type: "settings"; tab?: SettingsTab }
  | { type: "shortcuts" }
  | { type: "add-account" }
  | { type: "ai" }
  | { type: "attachment"; attachment: Attachment; from: string };

type SettingsTab = "general" | "accounts" | "signature" | "notifications";

export const SHORTCUTS = [
  {
    group: "Navigate",
    items: [
      ["J", "Next conversation"],
      ["K", "Previous conversation"],
      ["U", "Back to list"],
      ["/", "Search"],
    ],
  },
  {
    group: "Act on a conversation",
    items: [
      ["E", "Archive"],
      ["S", "Star"],
      ["#", "Delete"],
      ["R", "Reply"],
      ["F", "Forward"],
    ],
  },
  {
    group: "Write",
    items: [
      ["C", "Compose"],
      ["⌘ ↵", "Send"],
      ["⌘ K", "Insert link"],
      ["⌘ B", "Bold"],
      ["⌘ I", "Italic"],
      ["⌘ J", "Ask Aster AI"],
    ],
  },
] as const;

export default function Panels({
  panel,
  onClose,
  onOpen,
}: {
  panel: Panel | null;
  onClose: () => void;
  onOpen: (panel: Panel) => void;
}) {
  if (!panel) return null;
  switch (panel.type) {
    case "shortcuts":
      return <ShortcutsModal onClose={onClose} />;
    case "settings":
      return <SettingsModal initialTab={panel.tab ?? "general"} onClose={onClose} onAddAccount={() => onOpen({ type: "add-account" })} />;
    case "add-account":
      return <AddAccountModal onClose={onClose} />;
    case "attachment":
      return <AttachmentModal attachment={panel.attachment} from={panel.from} onClose={onClose} />;
    case "ai":
      return <AsterPanel onClose={onClose} />;
  }
}

function ShortcutsModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="Keyboard shortcuts" description="Work through your inbox without touching the mouse." onClose={onClose} size="lg">
      <div className="shortcut-columns">
        {SHORTCUTS.map((section) => (
          <section key={section.group}>
            <h3 className="section-label">{section.group}</h3>
            <dl className="shortcut-list">
              {section.items.map(([keys, action]) => (
                <div key={action + keys}>
                  <dt>{action}</dt>
                  <dd>
                    {keys.split(" ").map((key) => (
                      <kbd className="key" key={key}>
                        {key}
                      </kbd>
                    ))}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </Modal>
  );
}

function Toggle({ label, hint, defaultOn }: { label: string; hint?: string; defaultOn?: boolean }) {
  const [on, setOn] = useState(Boolean(defaultOn));
  return (
    <label className="setting-row">
      <span>
        <strong>{label}</strong>
        {hint && <small>{hint}</small>}
      </span>
      <button type="button" role="switch" aria-checked={on} className={`switch ${on ? "on" : ""}`} onClick={() => setOn(!on)}>
        <span />
      </button>
    </label>
  );
}

function Segmented({ label, options, defaultValue }: { label: string; options: string[]; defaultValue: string }) {
  const [value, setValue] = useState(defaultValue);
  return (
    <div className="setting-row">
      <span>
        <strong>{label}</strong>
      </span>
      <div className="segmented" role="radiogroup" aria-label={label}>
        {options.map((option) => (
          <button type="button" role="radio" aria-checked={value === option} className={value === option ? "on" : ""} key={option} onClick={() => setValue(option)}>
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function SettingsModal({ initialTab, onClose, onAddAccount }: { initialTab: SettingsTab; onClose: () => void; onAddAccount: () => void }) {
  const [tab, setTab] = useState<SettingsTab>(initialTab);
  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const tabs: { id: SettingsTab; label: string; icon: "settings" | "users" | "compose" | "clock" }[] = [
    { id: "general", label: "General", icon: "settings" },
    { id: "accounts", label: "Accounts", icon: "users" },
    { id: "signature", label: "Signature", icon: "compose" },
    { id: "notifications", label: "Notifications", icon: "clock" },
  ];

  useEffect(() => {
    void getAccounts().then((result) => setAccounts(result.accounts));
  }, []);

  return (
    <Modal title="Settings" onClose={onClose} size="lg">
      <div className="settings">
        <nav className="settings-nav" aria-label="Settings sections">
          {tabs.map((item) => (
            <button key={item.id} className={`nav-item ${tab === item.id ? "active" : ""}`} onClick={() => setTab(item.id)}>
              <Icon name={item.icon} size={16} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="settings-body">
          {tab === "general" && (
            <>
              <h3 className="section-label">Reading</h3>
              <Segmented label="Density" options={["Comfortable", "Compact"]} defaultValue="Comfortable" />
              <Segmented label="After archiving" options={["Next message", "Back to list"]} defaultValue="Next message" />
              <Toggle label="Mark as read when opened" defaultOn />
              <h3 className="section-label">Sending</h3>
              <Segmented label="Undo send window" options={["5s", "10s", "20s", "30s"]} defaultValue="10s" />
              <Toggle label="Send & archive" hint="Archive the conversation when you reply" />
              <Toggle label="Show formatting bar" hint="Open new messages with the formatting toolbar visible" defaultOn />
            </>
          )}
          {tab === "accounts" && (
            <>
              <h3 className="section-label">Connected inboxes</h3>
              <div className="account-list">
                {(accounts ?? []).map((account) => (
                  <div className="account-item" key={account.id}>
                    <span className={`account-chip on account-${account.color}`}>{account.initial}</span>
                    <span>
                      <strong>{account.name}</strong>
                      <small>{account.email}</small>
                    </span>
                    <span className="status-pill">
                      <span className="status-dot" />
                      Synced
                    </span>
                  </div>
                ))}
                {!accounts && <div className="skeleton-row" />}
              </div>
              <button className="button button-secondary" onClick={onAddAccount}>
                <Icon name="users" size={15} />
                Add another account
              </button>
            </>
          )}
          {tab === "signature" && (
            <>
              <h3 className="section-label">Signature</h3>
              <textarea className="field textarea" rows={5} defaultValue={"Noah Smith\nAster Labs · noah@aster.ai"} aria-label="Signature" />
              <Toggle label="Add to replies and forwards" defaultOn />
            </>
          )}
          {tab === "notifications" && (
            <>
              <h3 className="section-label">Desktop notifications</h3>
              <Segmented label="Notify me about" options={["All mail", "Important", "Off"]} defaultValue="Important" />
              <Toggle label="Play a sound" />
              <Toggle label="Daily digest" hint="A morning summary from Aster AI" defaultOn />
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}

const PROVIDERS = [
  { id: "google", name: "Google", detail: "Gmail and Google Workspace", initial: "G", color: "red" },
  { id: "microsoft", name: "Microsoft", detail: "Outlook and Microsoft 365", initial: "M", color: "blue" },
  { id: "icloud", name: "iCloud", detail: "iCloud Mail", initial: "i", color: "ink" },
  { id: "imap", name: "Other", detail: "Any IMAP mail server", initial: "@", color: "green" },
] as const;

function AddAccountModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [provider, setProvider] = useState<(typeof PROVIDERS)[number] | null>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [connected, setConnected] = useState<Account | null>(null);
  const [pending, startTransition] = useTransition();

  const connect = (event: FormEvent) => {
    event.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    startTransition(async () => {
      setConnected(await addAccount(email, name));
      router.refresh();
    });
  };

  if (connected) {
    return (
      <Modal title="Account connected" onClose={onClose} size="sm" footer={<button className="button button-primary" onClick={onClose} data-autofocus>Done</button>}>
        <div className="success-state">
          <span className={`account-chip on account-${connected.color} large`}>{connected.initial}</span>
          <strong>{connected.email}</strong>
          <span>Its mail now appears alongside your other inboxes. Toggle it any time from the top bar.</span>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      title={provider ? `Connect ${provider.name}` : "Add an account"}
      description={provider ? provider.detail : "Bring another inbox into Aster."}
      onClose={onClose}
      size="sm"
      footer={
        provider && (
          <>
            <button className="button button-ghost" onClick={() => setProvider(null)}>
              Back
            </button>
            <button className="button button-primary" form="add-account-form" type="submit" disabled={pending || !email}>
              {pending ? "Connecting…" : "Connect"}
            </button>
          </>
        )
      }
    >
      {provider ? (
        <form id="add-account-form" className="form-stack" onSubmit={connect}>
          <label className="field-label">
            Email address
            <input className="field" type="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label className="field-label">
            Display name <small>optional</small>
            <input className="field" placeholder="e.g. Personal" value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <p className="form-note">Aster signs in through {provider.name} — your password is never stored here.</p>
        </form>
      ) : (
        <div className="provider-list">
          {PROVIDERS.map((option) => (
            <button key={option.id} className="provider" onClick={() => setProvider(option)} data-autofocus={option.id === "google" ? true : undefined}>
              <span className={`account-chip on account-${option.color}`}>{option.initial}</span>
              <span>
                <strong>{option.name}</strong>
                <small>{option.detail}</small>
              </span>
              <Icon name="arrowRight" size={15} />
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
}

function AttachmentModal({ attachment, from, onClose }: { attachment: Attachment; from: string; onClose: () => void }) {
  const pages = Math.min(3, Number(attachment.detail?.match(/\d+/)?.[0] ?? 1));
  return (
    <Modal
      title={attachment.name}
      description={[attachment.size, attachment.detail, `from ${from}`].filter(Boolean).join(" · ")}
      onClose={onClose}
      size="lg"
      footer={
        <>
          <span className="form-note">Preview shows the first {pages === 1 ? "page" : `${pages} pages`}.</span>
          <button className="button button-primary" data-tooltip="Downloads need a connected mail provider" disabled>
            <Icon name="arrowDown" size={15} />
            Download
          </button>
        </>
      }
    >
      <div className="doc-preview">
        {Array.from({ length: pages }, (_, page) => (
          <div className="doc-page" key={page}>
            <span className="doc-title" />
            <span className="doc-line wide" />
            <span className="doc-line" />
            <span className="doc-line wide" />
            <span className="doc-line short" />
            <span className="doc-block" />
            <span className="doc-line wide" />
            <span className="doc-line" />
            <span className="doc-line short" />
            <span className="doc-page-number">{page + 1}</span>
          </div>
        ))}
      </div>
    </Modal>
  );
}

const SUGGESTIONS = ["Summarize my unread mail", "What needs a reply from me?", "Find attachments", "Anything about the offsite?"];

type Turn = { role: "user"; text: string } | { role: "aster"; answer: AsterAnswer };

function AsterPanel({ onClose }: { onClose: () => void }) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [prompt, setPrompt] = useState("");
  const [pending, startTransition] = useTransition();
  const input = useRef<HTMLTextAreaElement>(null);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    input.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [turns, pending]);

  const ask = (text: string) => {
    const question = text.trim();
    if (!question || pending) return;
    setPrompt("");
    setTurns((current) => [...current, { role: "user", text: question }]);
    startTransition(async () => {
      const answer = await askAster(question);
      setTurns((current) => [...current, { role: "aster", answer }]);
    });
  };

  return (
    <aside className="ai-panel" aria-label="Ask Aster AI">
      <header className="ai-header">
        <span className="storage-icon">
          <Icon name="sparkle" size={15} />
        </span>
        <div>
          <strong>Ask Aster</strong>
          <small>Answers from the inboxes you have selected</small>
        </div>
        <button className="icon-button" aria-label="Close" onClick={onClose}>
          <Icon name="close" size={16} />
        </button>
      </header>

      <div className="ai-thread" ref={scroller}>
        {turns.length === 0 && (
          <div className="ai-empty">
            <strong>How can I help?</strong>
            <span>Ask about your mail in plain language.</span>
          </div>
        )}
        {turns.map((turn, index) =>
          turn.role === "user" ? (
            <div className="ai-bubble user" key={index}>
              {turn.text}
            </div>
          ) : (
            <div className="ai-bubble aster" key={index}>
              <p>{turn.answer.text}</p>
              {turn.answer.references.length > 0 && (
                <div className="ai-refs">
                  {turn.answer.references.map((reference) => (
                    <Link className="ai-ref" href={reference.href} key={reference.id}>
                      <span className={`sender-avatar avatar-${reference.avatar}`}>{reference.initials}</span>
                      <span>
                        <strong>{reference.subject}</strong>
                        <small>
                          {reference.sender} — {reference.note}
                        </small>
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ),
        )}
        {pending && (
          <div className="ai-bubble aster typing" aria-label="Aster is thinking">
            <span />
            <span />
            <span />
          </div>
        )}
      </div>

      <div className="ai-suggestions">
        {SUGGESTIONS.map((suggestion) => (
          <button key={suggestion} className="chip" onClick={() => ask(suggestion)} disabled={pending}>
            {suggestion}
          </button>
        ))}
      </div>
      <form
        className="ai-input"
        onSubmit={(event) => {
          event.preventDefault();
          ask(prompt);
        }}
      >
        <textarea
          ref={input}
          rows={1}
          placeholder="Ask anything about your mail…"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              ask(prompt);
            }
          }}
        />
        <button className="reply-send" aria-label="Ask" disabled={!prompt.trim() || pending}>
          <Icon name="arrowRight" size={16} />
        </button>
      </form>
    </aside>
  );
}
