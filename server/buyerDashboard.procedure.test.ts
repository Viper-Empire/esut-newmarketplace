import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ selectResults: [] as unknown[][] }));

vi.mock("./db", () => ({
  getDb: async () => ({
    select: () => {
      const query: any = {
        from: () => query,
        innerJoin: () => query,
        where: () => query,
        orderBy: () => query,
        limit: async () => state.selectResults.shift() ?? [],
        then: (resolve: (value: unknown[]) => unknown, reject: (reason: unknown) => unknown) => Promise.resolve(state.selectResults.shift() ?? []).then(resolve, reject),
      };
      return query;
    },
  }),
}));

import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";

const context = (): TrpcContext => ({ user: { id: 73, openId: "buyer-dashboard-test", name: "Buyer Dashboard Test", email: "buyer@example.com", loginMethod: "password", role: "CUSTOMER", isActive: true, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: null }, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] });

describe("buyer dashboard procedure", () => {
  beforeEach(() => { state.selectResults = []; });

  it("returns only buyer-owned purchase, favorite, and notification summary data", async () => {
    state.selectResults = [
      [
        { order: { id: 1, publicId: "ESUT-READY", status: "READY_FOR_PICKUP", totalKobo: 125000, createdAt: new Date("2026-08-15") }, store: { name: "Campus Store", slug: "campus-store" } },
        { order: { id: 2, publicId: "ESUT-DONE", status: "COMPLETED", totalKobo: 80000, createdAt: new Date("2026-08-14") }, store: { name: "Campus Store", slug: "campus-store" } },
      ],
      [{ id: 9, title: "Order ready", message: "Collect at campus.", targetRoute: "/account/orders/ESUT-READY", createdAt: new Date(), isRead: false }],
      [{ id: 11 }, { id: 12 }],
      [{ total: 3 }],
    ];
    const summary = await appRouter.createCaller(context()).buyer.dashboard();
    expect(summary).toMatchObject({ ordersToCollect: 1, activeOrders: 1, savedListings: 2, unreadUpdates: 3 });
    expect(summary.recentOrders).toHaveLength(2);
    expect(summary.recentUpdates).toHaveLength(1);
    expect(summary.pickupReminders).toHaveLength(1);
    expect(summary.pickupReminders[0]).toMatchObject({ title: "Pickup reminder", order: { publicId: "ESUT-READY" } });
    expect(summary.recentOrders[0]?.store).toEqual({ name: "Campus Store", slug: "campus-store" });
  });
});
