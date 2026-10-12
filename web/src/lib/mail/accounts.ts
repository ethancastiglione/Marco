import "server-only";

import { cookies } from "next/headers";

import { mail } from "./store";

export const ACCOUNTS_COOKIE = "aster-accounts";

/** All connected accounts, plus the ids the viewer has checked in the top bar (default: all). */
export async function getAccountFilter() {
  const [accounts, cookieStore] = await Promise.all([mail.listAccounts(), cookies()]);
  const saved = cookieStore.get(ACCOUNTS_COOKIE)?.value.split(",").filter(Boolean);
  const valid = saved?.filter((id) => accounts.some((account) => account.id === id));
  const enabled = valid?.length ? valid : accounts.map((account) => account.id);
  return { accounts, enabled };
}
