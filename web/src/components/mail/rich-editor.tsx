"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import Icon, { type IconName } from "./icon";

// Gmail's font list, each previewed in its own face.
const FONTS = [
  { label: "Sans Serif", value: "Inter, Arial, sans-serif" },
  { label: "Serif", value: "Georgia, 'Times New Roman', serif" },
  { label: "Fixed Width", value: "ui-monospace, 'Courier New', monospace" },
  { label: "Wide", value: "'Arial Black', Arial, sans-serif" },
  { label: "Narrow", value: "'Arial Narrow', Arial, sans-serif" },
  { label: "Comic Sans MS", value: "'Comic Sans MS', cursive" },
  { label: "Garamond", value: "Garamond, serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Tahoma", value: "Tahoma, sans-serif" },
  { label: "Trebuchet MS", value: "'Trebuchet MS', sans-serif" },
  { label: "Verdana", value: "Verdana, sans-serif" },
];

// execCommand("fontSize") takes HTML sizes 1–7.
const SIZES = [
  { label: "Small", value: "2", preview: 11 },
  { label: "Normal", value: "3", preview: 13 },
  { label: "Large", value: "5", preview: 18 },
  { label: "Huge", value: "6", preview: 24 },
];

const COLORS = [
  "#000000", "#444444", "#666666", "#999999", "#cccccc", "#eeeeee", "#f3f3f3", "#ffffff",
  "#e06666", "#f6b26b", "#ffd966", "#93c47d", "#76a5af", "#6fa8dc", "#8e7cc3", "#c27ba0",
  "#cc0000", "#e69138", "#f1c232", "#6aa84f", "#45818e", "#3d85c6", "#674ea7", "#a64d79",
];

type Menu = "font" | "size" | "color" | "align" | "more" | null;

const run = (command: string, value?: string) => document.execCommand(command, false, value);

function normalizeUrl(raw: string) {
  const url = raw.trim();
  if (!url) return "";
  if (/^(https?:|mailto:)/i.test(url)) return url;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(url)) return `mailto:${url}`;
  return `https://${url}`;
}

type ToolbarContext = {
  active: Record<string, boolean>;
  menu: Menu;
  setMenu: (menu: Menu) => void;
  saveSelection: () => void;
  exec: (command: string, value?: string) => void;
};

// Keep the editor's selection when clicking toolbar controls.
const keepSelection = (ctx: ToolbarContext) => (event: { preventDefault: () => void }) => {
  event.preventDefault();
  ctx.saveSelection();
};

function FmtButton({
  ctx,
  icon,
  label,
  command,
  value,
  onPress,
}: {
  ctx: ToolbarContext;
  icon: IconName;
  label: string;
  command?: string;
  value?: string;
  onPress?: () => void;
}) {
  const pressed = command ? Boolean(ctx.active[command]) : undefined;
  return (
    <button
      type="button"
      className={`fmt-button ${pressed ? "active" : ""}`}
      aria-label={label}
      data-tooltip={label}
      aria-pressed={pressed}
      onMouseDown={keepSelection(ctx)}
      onClick={() => (onPress ? onPress() : command && ctx.exec(command, value))}
    >
      <Icon name={icon} size={16} />
    </button>
  );
}

function FmtDropdown({
  ctx,
  id,
  trigger,
  label,
  children,
}: {
  ctx: ToolbarContext;
  id: Exclude<Menu, null>;
  trigger: ReactNode;
  label: string;
  children: ReactNode;
}) {
  const open = ctx.menu === id;
  return (
    <div className="fmt-menu-anchor">
      <button
        type="button"
        className={`fmt-button fmt-dropdown ${open ? "active" : ""}`}
        aria-label={label}
        data-tooltip={open ? undefined : label}
        aria-expanded={open}
        onMouseDown={keepSelection(ctx)}
        onClick={() => ctx.setMenu(open ? null : id)}
      >
        {trigger}
        <Icon name="arrowDown" size={10} />
      </button>
      {open && (
        <div className={`fmt-menu fmt-menu-${id}`} role="menu" onMouseDown={(event) => event.preventDefault()}>
          {children}
        </div>
      )}
    </div>
  );
}

type Props = {
  id?: string;
  /** "inline" is the compact reply box; the default fills the compose window. */
  variant?: "window" | "inline";
  initialHtml: string;
  placeholder: string;
  showToolbar: boolean;
  autoFocus?: boolean;
  onChange: (html: string, text: string) => void;
  /** Lets the parent open the link dialog from its own footer button. */
  linkRequest?: number;
};

export default function RichEditor({ id, variant = "window", initialHtml, placeholder, showToolbar, autoFocus, onChange, linkRequest }: Props) {
  const editor = useRef<HTMLDivElement>(null);
  const savedRange = useRef<Range | null>(null);
  const [menu, setMenu] = useState<Menu>(null);
  const [active, setActive] = useState<Record<string, boolean>>({});
  const [font, setFont] = useState(FONTS[0].label);
  const [link, setLink] = useState<{ text: string; url: string } | null>(null);

  useEffect(() => {
    const element = editor.current;
    if (!element) return;
    element.innerHTML = initialHtml;
    if (autoFocus) {
      element.focus();
      // Put the caret at the end, like Gmail does when reopening a draft.
      const range = document.createRange();
      range.selectNodeContents(element);
      range.collapse(false);
      window.getSelection()?.removeAllRanges();
      window.getSelection()?.addRange(range);
    }
    // Only seed once; after that the DOM is the source of truth.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const emit = useCallback(() => {
    const element = editor.current;
    if (!element) return;
    // Chrome leaves a stray <br> behind when everything is deleted; clear it so the placeholder shows.
    if (!element.innerText.trim() && !element.querySelector("li, blockquote")) element.innerHTML = "";
    onChange(element.innerHTML, element.innerText);
  }, [onChange]);

  // Reflect the formatting under the caret in the toolbar.
  useEffect(() => {
    const update = () => {
      const selection = window.getSelection();
      if (!selection?.anchorNode || !editor.current?.contains(selection.anchorNode)) return;
      setActive({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
        strikeThrough: document.queryCommandState("strikeThrough"),
        insertOrderedList: document.queryCommandState("insertOrderedList"),
        insertUnorderedList: document.queryCommandState("insertUnorderedList"),
      });
      const face = document.queryCommandValue("fontName").replace(/["']/g, "").split(",")[0].trim();
      const match = FONTS.find((option) => option.value.replace(/["']/g, "").split(",")[0].trim() === face);
      setFont(match?.label ?? FONTS[0].label);
    };
    document.addEventListener("selectionchange", update);
    return () => document.removeEventListener("selectionchange", update);
  }, []);

  const saveSelection = () => {
    const selection = window.getSelection();
    if (selection?.rangeCount && editor.current?.contains(selection.anchorNode)) {
      savedRange.current = selection.getRangeAt(0).cloneRange();
    }
  };

  const restoreSelection = () => {
    editor.current?.focus();
    if (!savedRange.current) return;
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(savedRange.current);
  };

  const exec = (command: string, value?: string) => {
    restoreSelection();
    run(command, value);
    setMenu(null);
    emit();
  };

  const openLinkDialog = useCallback(() => {
    saveSelection();
    const selection = window.getSelection();
    const anchor = selection?.anchorNode?.parentElement?.closest("a");
    setMenu(null);
    setLink({ text: selection?.toString() || anchor?.textContent || "", url: anchor?.getAttribute("href") ?? "" });
  }, []);

  useEffect(() => {
    if (linkRequest) openLinkDialog();
  }, [linkRequest, openLinkDialog]);

  const applyLink = () => {
    if (!link) return;
    const href = normalizeUrl(link.url);
    restoreSelection();
    if (href) {
      const text = link.text.trim() || link.url.trim();
      const selected = window.getSelection()?.toString() ?? "";
      if (selected && selected === text) run("createLink", href);
      else run("insertHTML", `<a href="${href.replace(/"/g, "&quot;")}">${text.replace(/</g, "&lt;")}</a>&nbsp;`);
    }
    setLink(null);
    emit();
  };

  const ctx: ToolbarContext = { active, menu, setMenu, saveSelection, exec };

  return (
    <div className={`rich-editor rich-editor-${variant}`}>
      <div
        ref={editor}
        id={id}
        className="compose-editor"
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Message body"
        data-placeholder={placeholder}
        onInput={emit}
        onBlur={saveSelection}
        onKeyDown={(event) => {
          if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
            event.preventDefault();
            openLinkDialog();
          }
        }}
        onClick={() => setMenu(null)}
      />

      {link && (
        <div
          className="link-dialog"
          role="dialog"
          aria-label="Edit link"
          onKeyDown={(event) => {
            // Keep Enter/Escape inside the dialog so they never send or close the message.
            event.stopPropagation();
            if (event.key === "Enter") {
              event.preventDefault();
              applyLink();
            }
            if (event.key === "Escape") setLink(null);
          }}
        >
          <strong>Edit link</strong>
          <label>
            <span>Text to display</span>
            <input value={link.text} onChange={(event) => setLink({ ...link, text: event.target.value })} />
          </label>
          <label>
            <span>Link to</span>
            <input
              autoFocus
              placeholder="Web address or email"
              value={link.url}
              onChange={(event) => setLink({ ...link, url: event.target.value })}
            />
          </label>
          <div className="link-dialog-footer">
            {link.url.trim() && (
              <a href={normalizeUrl(link.url)} target="_blank" rel="noopener noreferrer">
                Test this link
              </a>
            )}
            <button type="button" className="link-cancel" onClick={() => setLink(null)}>
              Cancel
            </button>
            <button type="button" className="link-ok" onClick={applyLink} disabled={!link.url.trim()}>
              OK
            </button>
          </div>
        </div>
      )}

      {showToolbar && (
        <div className="format-toolbar" role="toolbar" aria-label="Formatting options">
          <FmtButton ctx={ctx} icon="undo" label="Undo (⌘Z)" onPress={() => exec("undo")} />
          <FmtButton ctx={ctx} icon="redo" label="Redo (⌘Y)" onPress={() => exec("redo")} />
          <span className="fmt-divider" />
          <FmtDropdown ctx={ctx} id="font" label="Font" trigger={<span className="fmt-font-label">{font}</span>}>
            {FONTS.map((option) => (
              <button
                type="button"
                role="menuitemradio"
                aria-checked={font === option.label}
                key={option.label}
                style={{ fontFamily: option.value }}
                onClick={() => exec("fontName", option.value)}
              >
                {font === option.label && <Icon name="check" size={13} />}
                {option.label}
              </button>
            ))}
          </FmtDropdown>
          <span className="fmt-divider" />
          <FmtDropdown ctx={ctx} id="size" label="Size" trigger={<Icon name="format" size={17} />}>
            {SIZES.map((option) => (
              <button type="button" role="menuitem" key={option.value} style={{ fontSize: option.preview }} onClick={() => exec("fontSize", option.value)}>
                {option.label}
              </button>
            ))}
          </FmtDropdown>
          <span className="fmt-divider" />
          <FmtButton ctx={ctx} icon="bold" label="Bold (⌘B)" command="bold" />
          <FmtButton ctx={ctx} icon="italic" label="Italic (⌘I)" command="italic" />
          <FmtButton ctx={ctx} icon="underline" label="Underline (⌘U)" command="underline" />
          <FmtDropdown ctx={ctx} id="color" label="Text color" trigger={<Icon name="textColor" size={16} />}>
            <div className="color-columns">
              <div>
                <span className="color-heading">Background color</span>
                <div className="color-grid">
                  {COLORS.map((color) => (
                    <button
                      type="button"
                      key={color}
                      aria-label={`Highlight ${color}`}
                      style={{ background: color }}
                      onClick={() => {
                        run("styleWithCSS", "true");
                        exec("hiliteColor", color);
                        run("styleWithCSS", "false");
                      }}
                    />
                  ))}
                </div>
              </div>
              <div>
                <span className="color-heading">Text color</span>
                <div className="color-grid">
                  {COLORS.map((color) => (
                    <button type="button" key={color} aria-label={`Text ${color}`} style={{ background: color }} onClick={() => exec("foreColor", color)} />
                  ))}
                </div>
              </div>
            </div>
          </FmtDropdown>
          <span className="fmt-divider" />
          <FmtDropdown ctx={ctx} id="align" label="Align" trigger={<Icon name="alignLeft" size={16} />}>
            <div className="align-row">
              <FmtButton ctx={ctx} icon="alignLeft" label="Align left" command="justifyLeft" />
              <FmtButton ctx={ctx} icon="alignCenter" label="Align center" command="justifyCenter" />
              <FmtButton ctx={ctx} icon="alignRight" label="Align right" command="justifyRight" />
            </div>
          </FmtDropdown>
          <FmtButton ctx={ctx} icon="listOl" label="Numbered list" command="insertOrderedList" />
          <FmtButton ctx={ctx} icon="listUl" label="Bulleted list" command="insertUnorderedList" />
          <FmtDropdown ctx={ctx} id="more" label="More formatting options" trigger={<Icon name="dots" size={16} />}>
            <div className="align-row">
              <FmtButton ctx={ctx} icon="outdent" label="Indent less" command="outdent" />
              <FmtButton ctx={ctx} icon="indent" label="Indent more" command="indent" />
              <FmtButton ctx={ctx} icon="quote" label="Quote" command="formatBlock" value="blockquote" />
              <FmtButton ctx={ctx} icon="strike" label="Strikethrough" command="strikeThrough" />
              <FmtButton ctx={ctx} icon="clearFormat" label="Remove formatting" command="removeFormat" />
            </div>
          </FmtDropdown>
        </div>
      )}
      {menu && <div className="menu-dismiss" onClick={() => setMenu(null)} />}
    </div>
  );
}
