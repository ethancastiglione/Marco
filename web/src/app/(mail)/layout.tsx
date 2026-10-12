import { Suspense } from "react";

import AccountSwitcher from "@/components/mail/account-switcher";
import MailUIProvider from "@/components/mail/mail-ui";
import Sidebar from "@/components/mail/sidebar";
import Topbar, { TopbarFallback } from "@/components/mail/topbar";
import { getAccountFilter } from "@/lib/mail/accounts";

export default function MailLayout({ children }: LayoutProps<"/">) {
  return (
    <MailUIProvider>
      <main className="app-shell">
        <Suspense fallback={<aside className="sidebar" />}>
          <Sidebar />
        </Suspense>
        <section className="mailbox">
          <Suspense fallback={<TopbarFallback />}>
            <Topbar
              accounts={
                <Suspense fallback={<div className="account-switcher" />}>
                  <Accounts />
                </Suspense>
              }
            />
          </Suspense>
          {children}
        </section>
      </main>
    </MailUIProvider>
  );
}

async function Accounts() {
  const { accounts, enabled } = await getAccountFilter();
  return <AccountSwitcher accounts={accounts} enabled={enabled} />;
}
