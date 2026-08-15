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
        limit: async () => state.selectResults.shift() ?? [],
        then: (resolve: (value: unknown[]) => unknown, reject: (reason: unknown) => unknown) => Promise.resolve(state.selectResults.shift() ?? []).then(resolve, reject),
      };
      return query;
    },
  }),
}));

import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";

function context(role: "CUSTOMER" | "SELLER"): TrpcContext {
  return { user: { id: 55, openId: `seller-analytics-${role}`, name: "Seller Analytics Test", email: "seller@example.com", loginMethod: "password", role, isActive: true, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: null }, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

describe("seller analytics procedure", () => {
  beforeEach(() => { state.selectResults = []; });

  it("returns only the verified seller's scoped performance metrics", async () => {
    const today = new Date();
    state.selectResults = [
      [{ verificationStatus: "APPROVED" }],
      [{ order: { status: "COMPLETED", totalKobo: 125000, createdAt: today } }, { order: { status: "READY_FOR_PICKUP", totalKobo: 60000, createdAt: today } }],
      [{ listing: { status: "ACTIVE", viewCount: 9, favoriteCount: 2 }, stock: { quantity: 3, reservedQuantity: 1 } }, { listing: { status: "DRAFT", viewCount: 0, favoriteCount: 0 }, stock: { quantity: 1, reservedQuantity: 0 } }],
      [{ id: 1 }, { id: 2 }],
    ];
    const analytics = await appRouter.createCaller(context("SELLER")).seller.analytics();
    expect(analytics).toMatchObject({ totalOrders: 2, completedOrders: 1, activeOrders: 1, readyForPickupOrders: 1, completedSalesKobo: 125000, activeListings: 1, draftListings: 1, lowStockListings: 2, availableUnits: 3, receivedOfferCount: 2, viewCount: 9, favoriteCount: 2, completionRatePercent: 50 });
    expect(analytics.last7Days).toHaveLength(7);
  });

  it("rejects a customer before any seller performance data is queried", async () => {
    await expect(appRouter.createCaller(context("CUSTOMER")).seller.analytics()).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(state.selectResults).toEqual([]);
  });
});
