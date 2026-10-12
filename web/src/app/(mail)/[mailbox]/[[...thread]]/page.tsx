import { notFound } from "next/navigation";
import { Suspense } from "react";

import MessageList, { SearchResults } from "@/components/mail/message-list";
import ReadingPane, { EmptyReadingPane } from "@/components/mail/reading-pane";
import { getAccountFilter } from "@/lib/mail/accounts";
import { dateBucket } from "@/lib/mail/search";
import { isSystemMailbox, mail } from "@/lib/mail/store";
import type { SearchHit, SortOrder, ThreadSummary } from "@/lib/mail/types";

const TITLES: Record<string, string> = {
  inbox: "Inbox",
  starred: "Starred",
  snoozed: "Snoozed",
  sent: "Sent",
  drafts: "Drafts",
  archive: "Archive",
  trash: "Trash",
};

const SORTS: SortOrder[] = ["newest", "oldest", "unread"];

export default function MailboxPage(props: PageProps<"/[mailbox]/[[...thread]]">) {
  return (
    <Suspense fallback={<div className="mail-layout" />}>
      <MailView {...props} />
    </Suspense>
  );
}

/** Strong matches first (when there are enough results to need it), then the rest by date. */
function groupResults(results: SearchHit[]) {
  const top = results.length > 4 ? results.filter((result) => result.score >= 8).slice(0, 3) : [];
  const rest = results.filter((result) => !top.includes(result)).sort((a, b) => b.lastAt.localeCompare(a.lastAt));
  const sections: { title: string; threads: SearchHit[] }[] = top.length ? [{ title: "Top results", threads: top }] : [];
  for (const result of rest) {
    const title = dateBucket(result.lastAt);
    const section = sections.find((candidate) => candidate.title === title);
    if (section) section.threads.push(result);
    else sections.push({ title, threads: [result] });
  }
  return sections;
}

async function MailView({ params, searchParams }: PageProps<"/[mailbox]/[[...thread]]">) {
  const [{ mailbox, thread: threadSegments }, search] = await Promise.all([params, searchParams]);
  if (threadSegments && threadSegments.length > 1) notFound();

  const isSearch = mailbox === "search";
  const labels = await mail.listLabels();
  const label = labels.find((candidate) => candidate.id === mailbox);
  if (!isSearch && !isSystemMailbox(mailbox) && !label) notFound();

  const q = typeof search.q === "string" ? search.q.trim() : "";
  const unreadOnly = search.filter === "unread";
  const sort = SORTS.find((candidate) => candidate === search.sort) ?? "newest";
  const { accounts, enabled } = await getAccountFilter();
  const scope =
    enabled.length === accounts.length
      ? "All inboxes"
      : accounts
          .filter((account) => enabled.includes(account.id))
          .map((account) => account.name)
          .join(" + ");

  const sections = isSearch && q ? groupResults(await mail.search(q, enabled)) : [];
  const threads: ThreadSummary[] = isSearch
    ? sections.flatMap((section) => section.threads)
    : await mail.listThreads({ mailbox, unreadOnly, sort, accounts: enabled });

  const openedId = threadSegments?.[0];
  const selectedId = openedId ?? threads[0]?.id;
  const thread = selectedId ? await mail.getThread(selectedId) : undefined;
  if (openedId && !thread) notFound();

  const qs = new URLSearchParams();
  if (isSearch && q) qs.set("q", q);
  if (!isSearch && unreadOnly) qs.set("filter", "unread");
  if (!isSearch && sort !== "newest") qs.set("sort", sort);
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
      {isSearch ? (
        <SearchResults
          query={q}
          sections={sections}
          total={threads.length}
          selectedId={selectedId}
          scope={scope}
          showAccounts={enabled.length > 1}
          hrefFor={hrefFor}
        />
      ) : (
        <MessageList
          mailbox={mailbox}
          title={label?.name ?? TITLES[mailbox]}
          threads={threads}
          selectedId={selectedId}
          unreadOnly={unreadOnly}
          unreadCount={unreadOnly ? threads.length : threads.filter((candidate) => candidate.unread).length}
          sort={sort}
          scope={scope}
          showAccounts={enabled.length > 1}
          hrefFor={hrefFor}
        />
      )}
      {thread ? (
        <ReadingPane
          key={thread.id}
          thread={thread}
          label={labels.find((candidate) => thread.labelIds.includes(candidate.id))}
          labels={labels}
          account={accounts.find((account) => account.id === thread.accountId)}
          opened={Boolean(openedId)}
          position={{ index, total: threads.length }}
          hrefs={{
            self: hrefFor(thread.id),
            list: listHref,
            prev: prev && hrefFor(prev.id),
            next: next && hrefFor(next.id),
            afterRemove: afterRemove ? hrefFor(afterRemove.id) : listHref,
          }}
        />
      ) : (
        <EmptyReadingPane search={isSearch} />
      )}
    </div>
  );
}
