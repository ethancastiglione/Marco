"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

import Icon, { type IconName } from "./icon";

export type MenuItem =
  | { type: "heading"; label: string }
  | { type: "divider" }
  | {
      type?: "item";
      label: string;
      icon?: IconName;
      /** Leading swatch instead of an icon (labels, accounts). */
      swatch?: string;
      hint?: string;
      checked?: boolean;
      danger?: boolean;
      disabled?: boolean;
      /** Keep the menu open after selecting (checkbox lists). */
      keepOpen?: boolean;
      onSelect: () => void;
    };

type Props = {
  label: string;
  items: MenuItem[];
  /** Icon for the default icon-button trigger. */
  icon?: IconName;
  /** Custom trigger content; rendered inside a button with `triggerClassName`. */
  trigger?: ReactNode;
  triggerClassName?: string;
  align?: "start" | "end";
  placement?: "below" | "above";
  disabled?: boolean;
};

/** The one dropdown used across the app: toolbar overflow, sorting, snooze, labels, account menus. */
export default function Menu({
  label,
  items,
  icon = "dots",
  trigger,
  triggerClassName = "icon-button",
  align = "start",
  placement = "below",
  disabled,
}: Props) {
  const [open, setOpen] = useState(false);
  const list = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    list.current?.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        setOpen(false);
      }
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const buttons = [...(list.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? [])];
        const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
        const next = event.key === "ArrowDown" ? (index + 1) % buttons.length : (index - 1 + buttons.length) % buttons.length;
        buttons[next]?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [open]);

  return (
    <div className="menu-anchor">
      <button
        className={`${triggerClassName} ${open ? "is-open" : ""}`}
        aria-label={label}
        data-tooltip={open ? undefined : label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        disabled={disabled}
        onClick={() => setOpen((value) => !value)}
      >
        {trigger ?? <Icon name={icon} size={icon === "dots" ? 19 : 17} />}
      </button>
      {open && (
        <>
          <div className="menu-dismiss" onClick={() => setOpen(false)} />
          <div ref={list} id={id} className={`menu menu-${align} menu-${placement}`} role="menu" aria-label={label}>
            {items.map((item, index) => {
              if (item.type === "heading") return <span className="menu-title" key={index}>{item.label}</span>;
              if (item.type === "divider") return <span className="menu-divider" key={index} />;
              const role = item.checked === undefined ? "menuitem" : "menuitemcheckbox";
              return (
                <button
                  key={index}
                  role={role}
                  aria-checked={item.checked}
                  className={item.danger ? "danger" : undefined}
                  disabled={item.disabled}
                  onClick={() => {
                    item.onSelect();
                    if (!item.keepOpen) setOpen(false);
                  }}
                >
                  <span className="menu-lead">
                    {item.checked !== undefined ? (
                      <span className={`menu-check ${item.checked ? "on" : ""}`}>{item.checked && <Icon name="check" size={11} />}</span>
                    ) : item.swatch ? (
                      <span className="menu-swatch" style={{ background: item.swatch }} />
                    ) : item.icon ? (
                      <Icon name={item.icon} size={15} />
                    ) : null}
                  </span>
                  <span className="menu-label">{item.label}</span>
                  {item.hint && <small>{item.hint}</small>}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
