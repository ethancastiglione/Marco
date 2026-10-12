"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import ComposeWindow from "./compose-window";
import Icon from "./icon";

export type ComposeDraft = {
  draftId?: string;
  to: string;
  subject: string;
  body: string;
};

export type ToastState = {
  message: string;
  undo?: () => void | Promise<void>;
};

type MailUI = {
  compose: ComposeDraft | null;
  openCompose: (draft?: Partial<ComposeDraft>) => void;
  closeCompose: () => void;
  showToast: (toast: ToastState) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
};

const MailUIContext = createContext<MailUI | null>(null);

export function useMailUI() {
  const context = useContext(MailUIContext);
  if (!context) throw new Error("useMailUI must be used inside <MailUIProvider>");
  return context;
}

export function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

export default function MailUIProvider({ children }: { children: ReactNode }) {
  const [compose, setCompose] = useState<ComposeDraft | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toastTimer = useRef<number | undefined>(undefined);

  const openCompose = useCallback((draft?: Partial<ComposeDraft>) => {
    setCompose({ to: "", subject: "", body: "", ...draft });
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
      if (event.key === "Escape") setSidebarOpen(false);
      if (isTypingTarget(event.target) || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === "c") {
        event.preventDefault();
        openCompose();
      } else if (event.key === "/") {
        event.preventDefault();
        document.getElementById("mail-search")?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openCompose]);

  const value = useMemo(
    () => ({ compose, openCompose, closeCompose, showToast, sidebarOpen, setSidebarOpen }),
    [compose, openCompose, closeCompose, showToast, sidebarOpen],
  );

  return (
    <MailUIContext.Provider value={value}>
      {children}
      {compose && <ComposeWindow key={compose.draftId ?? "new"} initial={compose} />}
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
