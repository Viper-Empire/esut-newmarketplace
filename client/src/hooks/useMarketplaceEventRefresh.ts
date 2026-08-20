import { useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";

type WorkspaceRole = "CUSTOMER" | "SELLER" | "MODERATOR" | "ADMIN" | "SUPER_ADMIN" | null | undefined;

/**
 * Polls the caller-scoped durable marketplace event stream at a modest interval.
 * The event contains no order, customer, or seller payload: it is only a server
 * issued refresh signal. All reloaded projections remain authorization-checked.
 */
export function useMarketplaceEventRefresh(role: WorkspaceRole) {
  const utils = trpc.useUtils();
  const latest = trpc.notifications.latestEvent.useQuery(undefined, { enabled: Boolean(role), refetchInterval: 30_000, refetchIntervalInBackground: false, staleTime: 20_000 });
  const lastEventId = useRef<number | null>(null);

  useEffect(() => {
    const event = latest.data;
    if (!event) return;
    if (lastEventId.current === null) {
      lastEventId.current = event.id;
      return;
    }
    if (lastEventId.current === event.id) return;
    lastEventId.current = event.id;
    const common = [utils.notifications.list.invalidate(), utils.notifications.unreadCount.invalidate()];
    const buyer = [utils.buyer.dashboard.invalidate(), utils.orders.mine.invalidate(), utils.reminders.listMine.invalidate(), utils.support.myDisputes.invalidate(), utils.support.myReports.invalidate()];
    const seller = [utils.seller.orders.invalidate(), utils.seller.analytics.invalidate(), utils.seller.actionQueue.invalidate(), utils.seller.store.invalidate(), utils.seller.products.invalidate()];
    const admin = [utils.admin.dashboard.invalidate(), utils.admin.analytics.invalidate(), utils.admin.orders.invalidate(), utils.admin.reports.invalidate(), utils.admin.disputes.invalidate(), utils.admin.listings.invalidate(), utils.admin.auditLogs.invalidate()];
    void Promise.all([...common, ...(role === "CUSTOMER" ? buyer : []), ...(["SELLER", "ADMIN", "SUPER_ADMIN"].includes(role ?? "") ? seller : []), ...(["MODERATOR", "ADMIN", "SUPER_ADMIN"].includes(role ?? "") ? admin : [])]);
  }, [latest.data, role, utils]);

  return { isRefreshing: latest.isFetching, hasEvent: Boolean(latest.data) };
}
