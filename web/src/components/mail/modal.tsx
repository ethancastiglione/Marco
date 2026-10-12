"use client";

import { useEffect, useRef, type ReactNode } from "react";

import Icon from "./icon";

type Props = {
  title: string;
  /** Small line under the title. */
  description?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
};

/** The one dialog used across the app: settings, shortcuts, add account, attachment preview. */
export default function Modal({ title, description, onClose, children, footer, size = "md" }: Props) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const first = panel.current?.querySelector<HTMLElement>("input, textarea, select, [data-autofocus]");
    (first ?? panel.current)?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      previous?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div ref={panel} className={`modal modal-${size}`} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1}>
        <header className="modal-header">
          <div>
            <strong>{title}</strong>
            {description && <span>{description}</span>}
          </div>
          <button className="icon-button" aria-label="Close" onClick={onClose}>
            <Icon name="close" size={16} />
          </button>
        </header>
        <div className="modal-body">{children}</div>
        {footer && <footer className="modal-footer">{footer}</footer>}
      </div>
    </div>
  );
}
