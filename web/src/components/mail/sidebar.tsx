import { mail, me } from "@/lib/mail/store";
import { workspace } from "@/lib/mail/seed";
import { initials } from "@/lib/mail/format";

import Icon from "./icon";
import { AddLabel, ComposeButton, NavLink, SidebarFrame } from "./sidebar-client";

const navItems = [
  { href: "/inbox", icon: "inbox", label: "Inbox", count: "inbox" },
  { href: "/starred", icon: "star", label: "Starred" },
  { href: "/snoozed", icon: "clock", label: "Snoozed", count: "snoozed" },
  { href: "/sent", icon: "send", label: "Sent" },
  { href: "/drafts", icon: "mail", label: "Drafts", count: "drafts" },
  { href: "/archive", icon: "archive", label: "Archive" },
  { href: "/trash", icon: "trash", label: "Trash" },
] as const;

export default async function Sidebar() {
  const [counts, labels] = await Promise.all([mail.counts(), mail.listLabels()]);

  return (
    <SidebarFrame>
      <div className="workspace-row">
        <button className="app-mark" aria-label="Aster home">
          {workspace.name[0]}
        </button>
        <div>
          <strong>{workspace.name}</strong>
          <span className="eyebrow">{workspace.kind}</span>
        </div>
        <button className="icon-button subtle" aria-label="Workspace options">
          <Icon name="dots" size={17} />
        </button>
      </div>

      <ComposeButton />

      <nav className="side-nav" aria-label="Mailbox">
        {navItems.map((item) => {
          const count = "count" in item ? counts[item.count] : 0;
          return (
            <NavLink className="nav-item" href={item.href} key={item.href}>
              <Icon name={item.icon} size={17} />
              <span>{item.label}</span>
              {count > 0 && <span className="nav-count">{count}</span>}
            </NavLink>
          );
        })}
      </nav>

      <div className="nav-divider" />
      <AddLabel>
        <div className="labels">
          {labels.map((label) => (
            <NavLink className="label-link" href={`/${label.id}`} key={label.id}>
              <span className={`label-dot dot-${label.color}`} />
              {label.name}
            </NavLink>
          ))}
        </div>
      </AddLabel>

      <div className="sidebar-spacer" />
      <div className="storage-card">
        <div className="storage-icon">
          <Icon name="sparkle" size={16} />
        </div>
        <div>
          <strong>Ask Aster AI</strong>
          <span>Search, summarize, write</span>
        </div>
        <kbd>⌘ J</kbd>
      </div>
      <button className="account-row">
        <span className="profile-avatar">
          {initials(me.name)}
          <span className="presence-dot" />
        </span>
        <span>
          <strong>{me.name}</strong>
          <small>{me.email}</small>
        </span>
        <Icon name="dots" size={16} />
      </button>
    </SidebarFrame>
  );
}
