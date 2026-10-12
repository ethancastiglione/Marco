"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import ComposeWindow from "./compose-window";
import type { NewAttachment } from "@/lib/mail/types";

import Icon from "./icon";
import Panels, { type Panel } from "./panels";

export type ComposeDraft = {
  draftId?: string;
  to: string;
  subject: string;
  body: string;
  attachments?: NewAttachment[];
};

export type ToastState = {
  message: string;
  undo?: () => void | Promise<void>;
};

type MailUI = {
  compose: ComposeDraft | null;
  openCompose: (draft?: Partial<ComposeDraft>) => void;
  closeCompose: () => void;
  /** The open compose window registers a "save as draft" here, so opening another one never loses it. */
  composeSaver: { current: (() => Promise<void>) | null };
  showToast: (toast: ToastState) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  panel: Panel | null;
  openPanel: (panel: Panel) => void;
  closePanel: () => void;
};

const MailUIContext = createContext<MailUI | null>(null);

export function useMailUI() {
  const context = useContext(MailUIContext);
  if (!context) throw new Error("useMailUI must be used inside <MailUIProvider>");
  return context;
}

/** True while a dialog is open; single-key shortcuts pause so they never act on mail behind it. */
export function overlayOpen() {
  return Boolean(document.querySelector('[aria-modal="true"]'));
}

export function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

export default function MailUIProvider({ children }: { children: ReactNode }) {
  const [compose, setCompose] = useState<(ComposeDraft & { key: number }) | null>(null);
  const composeSaver = useRef<(() => Promise<void>) | null>(null);
  const composeCount = useRef(0);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [panel, setPanel] = useState<Panel | null>(null);
  const openPanel = useCallback((next: Panel) => setPanel(next), []);
  const closePanel = useCallback(() => setPanel(null), []);
  const toastTimer = useRef<number | undefined>(undefined);

  const openCompose = useCallback(async (draft?: Partial<ComposeDraft>) => {
    // Save whatever is already open before replacing it.
    await composeSaver.current?.();
    composeSaver.current = null;
    setCompose({ to: "", subject: "", body: "", ...draft, key: ++composeCount.current });
  }, []);
  const closeCompose = useCallback(() => setCompose(null), []);

  const showToast = useCallback((next: ToastState) => {
    window.clearTimeout(toastTimer.current);
    setToast(next);
    toastTimer.current = window.setTimeout(() => setToast(null), 4000);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const inEditor = event.target instanceof HTMLElement && event.target.isContentEditable;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k" && !inEditor) {
        event.preventDefault();
        document.getElementById("mail-search")?.focus();
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "j") {
        event.preventDefault();
        setPanel((current) => (current?.type === "ai" ? null : { type: "ai" }));
        return;
      }
      if (event.key === "Escape") setSidebarOpen(false);
      if (isTypingTarget(event.target) || event.metaKey || event.ctrlKey || event.altKey || overlayOpen()) return;
      if (event.key === "c") {
        event.preventDefault();
        openCompose();
      } else if (event.key === "?") {
        event.preventDefault();
        setPanel({ type: "shortcuts" });
      } else if (event.key === "/") {
        event.preventDefault();
        document.getElementById("mail-search")?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openCompose]);

  const value = useMemo(
    () => ({ compose, openCompose, closeCompose, composeSaver, showToast, sidebarOpen, setSidebarOpen, panel, openPanel, closePanel }),
    [compose, openCompose, closeCompose, showToast, sidebarOpen, panel, openPanel, closePanel],
  );

  return (
    <MailUIContext.Provider value={value}>
      {children}
      <Panels panel={panel} onClose={closePanel} onOpen={openPanel} />
      {compose && <ComposeWindow key={compose.key} initial={compose} />}
      {toast && (
        <div className="toast" role="status">
          <span>
            <Icon name="check" size={15} />
          </span>
          {toast.message}
          {toast.undo && (
            <button
              onClick={async () => {
                const undo = toast.undo;
                setToast(null);
                await undo?.();
              }}
            >
              Undo
            </button>
          )}
        </div>
      )}
    </MailUIContext.Provider>
  );
}
