import { getAccountFilter } from "@/lib/mail/accounts";
import { mail, me } from "@/lib/mail/store";
import { workspace } from "@/lib/mail/seed";
import { initials } from "@/lib/mail/format";

import Icon from "./icon";
import Link from "next/link";

import { AccountMenu, AddLabel, AskAsterButton, ComposeButton, NavLink, SidebarFrame, WorkspaceMenu } from "./sidebar-client";

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
  const { enabled } = await getAccountFilter();
  const [counts, labels] = await Promise.all([mail.counts(enabled), mail.listLabels()]);

  return (
    <SidebarFrame>
      <div className="workspace-row">
        <Link className="app-mark" aria-label="Aster home" href="/inbox">
          {workspace.name[0]}
        </Link>
        <div className="workspace-name">
          <strong>{workspace.name}</strong>
          <span className="eyebrow">{workspace.kind}</span>
        </div>
        <WorkspaceMenu />
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
      <AskAsterButton />
      <AccountMenu name={me.name} email={me.email} initials={initials(me.name)} />
    </SidebarFrame>
  );
}
