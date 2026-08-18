import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ selectResults: [] as unknown[][], updatedTables: [] as unknown[], insertedTables: [] as unknown[] }));

vi.mock("./db", () => ({
  getDb: async () => {
    const makeQuery = () => {
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
    };
    const database: any = {
      select: () => makeQuery(),
      update: (table: unknown) => { state.updatedTables.push(table); return { set: () => ({ where: async () => ({ affectedRows: 1 }) }) }; },
      insert: (table: unknown) => { state.insertedTables.push(table); return { values: async () => [] }; },
      transaction: async (callback: (tx: any) => Promise<unknown>) => callback(database),
    };
    return database;
  },
}));

import type { TrpcContext } from "./_core/context";
import { orders, orderStatusHistory } from "../drizzle/schema";
import { encryptPickupCode } from "./pickupCode";
import { appRouter } from "./routers";

function context(role: "CUSTOMER" | "SELLER"): TrpcContext {
  return { user: { id: 55, openId: `seller-orders-${role}`, name: "Seller Orders Test", email: "seller@example.com", loginMethod: "password", role, isActive: true, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: null }, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

const row = (publicId: string, status: "PENDING" | "CONFIRMED") => ({ order: { id: Number(publicId.slice(-1)), publicId, status, buyerUserId: 21, storeId: 8, paymentStatus: "UNPAID", totalKobo: 50000, reservationExpiresAt: null }, store: { id: 8, ownerUserId: 55 } });

describe("seller order operations", () => {
  beforeEach(() => { state.selectResults = []; state.updatedTables = []; state.insertedTables = []; });

  it("returns seller-owned filtered orders and does not query for customers", async () => {
    state.selectResults = [[{ verificationStatus: "APPROVED" }], [{ order: { publicId: "ESUT-0001", status: "READY_FOR_PICKUP" }, store: { ownerUserId: 55 } }]];
    const result = await appRouter.createCaller(context("SELLER")).seller.orders({ page: 1, limit: 12, status: "READY_FOR_PICKUP" });
    expect(result).toHaveLength(1);
    await expect(appRouter.createCaller(context("CUSTOMER")).seller.orders({ page: 1, limit: 12 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

	it("rejects duplicate selections before a batch mutation can run", async () => {
		state.selectResults = [[{ verificationStatus: "APPROVED" }]];
		await expect(appRouter.createCaller(context("SELLER")).seller.bulkTransitionOrders({ publicIds: ["ESUT-0001", "ESUT-0001"], status: "CONFIRMED" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
		expect(state.updatedTables).toEqual([]);
	});

	it("refuses bulk completion because every physical handoff requires an individual buyer code", async () => {
		state.selectResults = [[{ verificationStatus: "APPROVED" }]];
		await expect(appRouter.createCaller(context("SELLER")).seller.bulkTransitionOrders({ publicIds: ["ESUT-0001"], status: "COMPLETED" as never })).rejects.toMatchObject({ code: "BAD_REQUEST" });
		expect(state.updatedTables).toEqual([]);
	});

	it("validates all selected lifecycle transitions before applying a batch", async () => {
    state.selectResults = [[{ verificationStatus: "APPROVED" }], [row("ESUT-0001", "PENDING"), row("ESUT-0002", "CONFIRMED")]];
    await expect(appRouter.createCaller(context("SELLER")).seller.bulkTransitionOrders({ publicIds: ["ESUT-0001", "ESUT-0002"], status: "CONFIRMED" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(state.updatedTables).toEqual([]);
  });

  it("confirms a ready pickup only with the buyer code and records completion effects", async () => {
    state.selectResults = [[{ verificationStatus: "APPROVED" }], [{ order: { id: 9, publicId: "ESUT-READY9", status: "READY_FOR_PICKUP", buyerUserId: 21, storeId: 8, paymentStatus: "UNPAID", pickupCodeCiphertext: encryptPickupCode("123456"), pickupCodeVerifiedAt: null, pickupCodeFailedAttempts: 0 }, store: { id: 8, ownerUserId: 55 } }], [], [{ id: 8, ownerUserId: 55 }]];
    const result = await appRouter.createCaller(context("SELLER")).seller.confirmPickup({ publicId: "ESUT-READY9", code: "123456" });
    expect(result).toEqual({ success: true });
    expect(state.updatedTables).toContain(orders);
    expect(state.insertedTables).toContain(orderStatusHistory);
  });

  it("rejects an incorrect pickup code without completing the order", async () => {
    state.selectResults = [[{ verificationStatus: "APPROVED" }], [{ order: { id: 9, publicId: "ESUT-READY9", status: "READY_FOR_PICKUP", buyerUserId: 21, storeId: 8, paymentStatus: "UNPAID", pickupCodeCiphertext: encryptPickupCode("123456"), pickupCodeVerifiedAt: null, pickupCodeFailedAttempts: 0 }, store: { id: 8, ownerUserId: 55 } }]];
    await expect(appRouter.createCaller(context("SELLER")).seller.confirmPickup({ publicId: "ESUT-READY9", code: "654321" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(state.insertedTables).toEqual([]);
  });

  it("applies a valid seller-owned batch inside one transaction and records order effects", async () => {
    state.selectResults = [[{ verificationStatus: "APPROVED" }], [row("ESUT-0001", "PENDING"), row("ESUT-0002", "PENDING")], [], [{ id: 8, ownerUserId: 55 }], [], [{ id: 8, ownerUserId: 55 }]];
    const result = await appRouter.createCaller(context("SELLER")).seller.bulkTransitionOrders({ publicIds: ["ESUT-0001", "ESUT-0002"], status: "CONFIRMED" });
    expect(result).toEqual({ success: true, updatedCount: 2 });
    expect(state.updatedTables).toContain(orders);
    expect(state.insertedTables).toContain(orderStatusHistory);
  });
});
