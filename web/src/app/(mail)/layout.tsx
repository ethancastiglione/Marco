import { Suspense } from "react";

import MailUIProvider from "@/components/mail/mail-ui";
import Sidebar from "@/components/mail/sidebar";
import Topbar, { TopbarFallback } from "@/components/mail/topbar";

export default function MailLayout({ children }: LayoutProps<"/">) {
  return (
    <MailUIProvider>
      <main className="app-shell">
        <Suspense fallback={<aside className="sidebar" />}>
          <Sidebar />
        </Suspense>
        <section className="mailbox">
          <Suspense fallback={<TopbarFallback />}>
            <Topbar />
          </Suspense>
          {children}
        </section>
      </main>
    </MailUIProvider>
  );
}
