import { notFound } from "next/navigation";
import { Suspense } from "react";

import MessageList from "@/components/mail/message-list";
import ReadingPane, { EmptyReadingPane } from "@/components/mail/reading-pane";
import { getAccountFilter } from "@/lib/mail/accounts";
import { isSystemMailbox, mail } from "@/lib/mail/store";

const TITLES: Record<string, string> = {
  inbox: "Inbox",
  starred: "Starred",
  snoozed: "Snoozed",
  sent: "Sent",
  drafts: "Drafts",
  archive: "Archive",
  trash: "Trash",
};

export default function MailboxPage(props: PageProps<"/[mailbox]/[[...thread]]">) {
  return (
    <Suspense fallback={<div className="mail-layout" />}>
      <MailView {...props} />
    </Suspense>
  );
}

async function MailView({ params, searchParams }: PageProps<"/[mailbox]/[[...thread]]">) {
  const [{ mailbox, thread: threadSegments }, search] = await Promise.all([params, searchParams]);
  if (threadSegments && threadSegments.length > 1) notFound();

  const labels = await mail.listLabels();
  const label = labels.find((candidate) => candidate.id === mailbox);
  if (!isSystemMailbox(mailbox) && !label) notFound();

  const q = typeof search.q === "string" ? search.q : undefined;
  const unreadOnly = search.filter === "unread";
  const { accounts, enabled } = await getAccountFilter();
  const threads = await mail.listThreads({ mailbox, q, unreadOnly, accounts: enabled });
  const scope =
    enabled.length === accounts.length
      ? "All inboxes"
      : accounts
          .filter((account) => enabled.includes(account.id))
          .map((account) => account.name)
          .join(" + ");

  const openedId = threadSegments?.[0];
  const selectedId = openedId ?? threads[0]?.id;
  const thread = selectedId ? await mail.getThread(selectedId) : undefined;
  if (openedId && !thread) notFound();

  const qs = new URLSearchParams();
  if (q) qs.set("q", q);
  if (unreadOnly) qs.set("filter", "unread");
  const suffix = qs.size ? `?${qs}` : "";
  const hrefFor = (id: string) => `/${mailbox}/${id}${suffix}`;
  const listHref = `/${mailbox}${suffix}`;

  const index = threads.findIndex((candidate) => candidate.id === selectedId);
  const prev = index > 0 ? threads[index - 1] : undefined;
  const next = index >= 0 ? threads[index + 1] : undefined;
  // After archiving/deleting, move to the next message like Superhuman does, else back up the list.
  const afterRemove = next ?? prev;

  return (
    <div className={`mail-layout ${openedId ? "has-thread" : ""}`}>
      <MessageList
        mailbox={mailbox}
        title={label?.name ?? TITLES[mailbox]}
        threads={threads}
        selectedId={selectedId}
        unreadOnly={unreadOnly}
        query={q}
        scope={scope}
        showAccounts={enabled.length > 1}
        hrefFor={hrefFor}
      />
      {thread ? (
        <ReadingPane
          key={thread.id}
          thread={thread}
          label={labels.find((candidate) => thread.labelIds.includes(candidate.id))}
          account={accounts.find((account) => account.id === thread.accountId)}
          opened={Boolean(openedId)}
          position={{ index, total: threads.length }}
          hrefs={{
            list: listHref,
            prev: prev && hrefFor(prev.id),
            next: next && hrefFor(next.id),
            afterRemove: afterRemove ? hrefFor(afterRemove.id) : listHref,
          }}
        />
      ) : (
        <EmptyReadingPane />
      )}
    </div>
  );
}
