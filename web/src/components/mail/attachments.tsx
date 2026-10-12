"use client";

import { useRef, useState } from "react";

import type { NewAttachment } from "@/lib/mail/types";

import Icon from "./icon";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function kindOf(file: File): NewAttachment["kind"] {
  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) return "pdf";
  if (file.type.startsWith("image/")) return "image";
  return "doc";
}

/** File picking for compose and reply. Only metadata is kept: this demo never uploads files. */
export function useAttachments(initial: NewAttachment[] = []) {
  const input = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<NewAttachment[]>(initial);

  const picker = (
    <input
      ref={input}
      type="file"
      multiple
      hidden
      onChange={(event) => {
        const picked = [...(event.target.files ?? [])].map((file) => ({ name: file.name, size: formatSize(file.size), kind: kindOf(file) }));
        setFiles((current) => [...current, ...picked]);
        event.target.value = "";
      }}
    />
  );

  return {
    files,
    picker,
    pick: () => input.current?.click(),
    remove: (index: number) => setFiles((current) => current.filter((_, i) => i !== index)),
    clear: () => setFiles([]),
    set: setFiles,
  };
}

export function FileChips({ files, onRemove }: { files: NewAttachment[]; onRemove: (index: number) => void }) {
  if (!files.length) return null;
  return (
    <div className="file-chips">
      {files.map((file, index) => (
        <span className="file-chip" key={`${file.name}-${index}`}>
          <span className={`file-kind file-${file.kind}`}>{file.kind === "image" ? "IMG" : file.kind.toUpperCase()}</span>
          <span className="file-name">{file.name}</span>
          <small>{file.size}</small>
          <button type="button" aria-label={`Remove ${file.name}`} onClick={() => onRemove(index)}>
            <Icon name="close" size={11} />
          </button>
        </span>
      ))}
    </div>
  );
}
