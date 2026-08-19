import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ selectResults: [] as unknown[][] }));

vi.mock("./db", () => ({
  getDb: async () => ({
    select: () => {
      const query: any = {
        from: () => query,
        innerJoin: () => query,
        leftJoin: () => query,
        where: () => query,
        then: (resolve: (value: unknown[]) => unknown, reject: (reason: unknown) => unknown) => Promise.resolve(state.selectResults.shift() ?? []).then(resolve, reject),
      };
      return query;
    },
  }),
}));

import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";

function context(role: "CUSTOMER" | "ADMIN"): TrpcContext {
  return { user: { id: 77, openId: `launch-analytics-${role}`, name: "Launch Analytics Test", email: "admin@example.com", loginMethod: "password", role, isActive: true, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: null }, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

describe("administrator launch analytics", () => {
  beforeEach(() => { state.selectResults = []; });

  it("calculates launch-monitoring metrics from real administrator-visible records", async () => {
    const today = new Date();
    state.selectResults = [
      [{ id: 1 }], [{ id: 1 }, { id: 2 }], [{ id: 1 }], [{ id: 1 }], [{ id: 1 }, { id: 2 }, { id: 3 }],
      [{ id: 99 }], [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }], [{ id: 1 }, { id: 2 }],
      [{ status: "COMPLETED", totalKobo: 180000, createdAt: today }, { status: "READY_FOR_PICKUP", totalKobo: 50000, createdAt: today }],
      [{ id: 1 }], [{ id: 1 }, { id: 2 }, { id: 3 }], [{ id: 1 }, { id: 2 }], [{ stock: { quantity: 2, reservedQuantity: 0 } }, { stock: { quantity: 12, reservedQuantity: 1 } }],
    ];
    const dashboard = await appRouter.createCaller(context("ADMIN")).admin.dashboard();
    expect(dashboard).toMatchObject({ totalUserCount: 4, activeBuyerCount: 2, pendingVerifications: 1, pendingApplications: 2, openReports: 1, activeDisputes: 1, activeListings: 3, flaggedListingCount: 1, requiresAttentionCount: 6, orderTodayCount: 1, recentOrderVolume: 2, completedSalesLast7DaysKobo: 180000, readyForPickupCount: 1, newMemberCount: 3, activeSellerCount: 2, lowStockListingCount: 1 });
    expect(dashboard.last7Days).toHaveLength(7);
  });

  it("rejects non-administrator callers before launch metrics are queried", async () => {
    await expect(appRouter.createCaller(context("CUSTOMER")).admin.dashboard()).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(state.selectResults).toEqual([]);
  });
});
