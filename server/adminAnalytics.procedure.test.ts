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
        orderBy: () => query,
        limit: () => query,
        offset: () => query,
        then: (resolve: (value: unknown[]) => unknown, reject: (reason: unknown) => unknown) => Promise.resolve(state.selectResults.shift() ?? []).then(resolve, reject),
      };
      return query;
    },
  }),
}));

import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";

function context(role: "CUSTOMER" | "ADMIN"): TrpcContext {
  return { user: { id: 77, openId: `admin-analytics-${role}`, name: "Analytics Test", email: "admin@example.com", loginMethod: "password", role, isActive: true, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: null }, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

describe("administrator analytics drill-down", () => {
  beforeEach(() => { state.selectResults = []; });

  it("aggregates lifecycle, pickup, seller, and trust data from live rows", async () => {
    const now = new Date();
    state.selectResults = [
      [{ order: { status: "READY_FOR_PICKUP", totalKobo: 50000, updatedAt: now }, store: { id: 8, name: "Campus Store" } }, { order: { status: "COMPLETED", totalKobo: 120000, updatedAt: now }, store: { id: 8, name: "Campus Store" } }],
      [{ store: { id: 8, name: "Campus Store" }, order: { status: "READY_FOR_PICKUP", totalKobo: 50000 } }, { store: { id: 8, name: "Campus Store" }, order: { status: "COMPLETED", totalKobo: 120000 } }],
      [{ listing: { status: "ACTIVE" }, stock: { quantity: 4, reservedQuantity: 1 }, store: { id: 8 } }],
      [{ id: 5 }, { id: 6 }], [{ id: 7 }],
      [{ id: 1 }], [{ id: 2 }], [{ id: 3 }], [{ id: 4 }],
    ];
    const result = await appRouter.createCaller(context("ADMIN")).admin.analytics();
    expect(result.totals).toMatchObject({ orderCount: 2, completedSalesKobo: 120000, readyForPickupCount: 1, activeListingCount: 1, activeUserCount: 2, newListingCount: 1 });
    expect(result.orderLifecycle.find(row => row.status === "COMPLETED")).toMatchObject({ count: 1, totalKobo: 120000 });
    expect(result.sellerPerformance[0]).toMatchObject({ storeName: "Campus Store", orderCount: 2, completedCount: 1, readyForPickupCount: 1, completionRatePercent: 50 });
    expect(result.trustSafety).toEqual({ openReports: 1, activeDisputes: 1, pendingVerifications: 1, pendingApplications: 1 });
  });

  it("rejects non-administrator callers before analytics rows are queried", async () => {
    await expect(appRouter.createCaller(context("CUSTOMER")).admin.analytics()).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(state.selectResults).toEqual([]);
  });
});
