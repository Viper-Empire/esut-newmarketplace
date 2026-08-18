import { useCallback } from "react";
import { trpc } from "@/lib/trpc";

/**
 * Keeps the administrator workspace consistent after a successful moderation or
 * recovery action. Server data remains authoritative; this only refreshes the
 * affected cached projections so no manual reload is required.
 */
export function useAdminWorkspaceRefresh() {
  const utils = trpc.useUtils();

  return useCallback(async (scope?: "user" | "store" | "listing" | "report" | "review" | "sellerReview") => {
    const shared = [
      utils.admin.dashboard.invalidate(),
      utils.admin.analytics.invalidate(),
      utils.admin.auditLogs.invalidate(),
      utils.admin.reversibleActions.invalidate(),
    ];

    const scoped = scope === "user" ? [utils.admin.users.invalidate(), utils.admin.sellers.invalidate()]
      : scope === "store" ? [utils.admin.stores.invalidate(), utils.admin.sellers.invalidate(), utils.admin.listings.invalidate()]
      : scope === "listing" ? [utils.admin.listings.invalidate(), utils.admin.stores.invalidate()]
      : scope === "report" ? [utils.admin.reports.invalidate()]
      : scope === "review" ? [utils.admin.reviews.invalidate()]
      : scope === "sellerReview" ? [utils.admin.applications.invalidate(), utils.admin.verifications.invalidate(), utils.admin.reviewHistory.invalidate(), utils.admin.sellers.invalidate(), utils.admin.stores.invalidate()]
      : [];

    await Promise.all([...shared, ...scoped]);
  }, [utils]);
}
