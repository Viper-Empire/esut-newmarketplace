import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ selectResults: [] as unknown[][], insertedTables: [] as unknown[], updatedTables: [] as unknown[] }));

vi.mock("./db", () => {
  const nextResult = () => state.selectResults.shift() ?? [];
  const selectQuery = () => {
    const query: any = {
      from: () => query,
      innerJoin: () => query,
      leftJoin: () => query,
      where: () => query,
      orderBy: () => query,
      limit: async () => nextResult(),
      then: (resolve: (value: unknown[]) => unknown, reject?: (reason: unknown) => unknown) => Promise.resolve(nextResult()).then(resolve, reject),
    };
    return query;
  };
  const database: any = {
    select: () => selectQuery(),
    insert: (table: unknown) => ({ values: () => { state.insertedTables.push(table); const result = table === orders ? [{ insertId: 901 }] : []; return { onDuplicateKeyUpdate: async () => result, then: (resolve: (value: unknown[]) => unknown, reject?: (reason: unknown) => unknown) => Promise.resolve(result).then(resolve, reject) }; } }),
    update: (table: unknown) => { state.updatedTables.push(table); return { set: () => ({ where: async () => [{ affectedRows: 0 }] }) }; },
    delete: () => ({ where: async () => [] }),
    transaction: async (callback: (tx: any) => Promise<unknown>) => callback(database),
  };
  return { getDb: async () => database };
});

import type { TrpcContext } from "./_core/context";
import { inventory, orderBatches, orders } from "../drizzle/schema";
import { appRouter } from "./routers";

function context(): TrpcContext {
  return { user: { id: 19, openId: "checkout-buyer", name: "Checkout Buyer", email: "buyer@example.com", loginMethod: "password", role: "CUSTOMER", isActive: true, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: null }, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

const cart = { id: 8, userId: 19 };
const line = { item: { id: 12, cartId: 8, listingId: 65, quantity: 2, savedForLater: false }, listing: { id: 65, storeId: 77, status: "ACTIVE", title: "Campus calculator", priceKobo: 980_000 }, store: { id: 77, status: "ACTIVE" }, stock: { listingId: 65, quantity: 2, reservedQuantity: 0 }, image: null };

describe("checkout.place procedure", () => {
  beforeEach(() => { state.selectResults = []; state.insertedTables = []; state.updatedTables = []; });

  it("returns the original order outcome for a duplicate idempotency key without inserting another order", async () => {
    state.selectResults = [[cart], [line], [{ id: 42, publicId: "ESUT-BATCH-EXIST" }], [{ publicId: "ESUT-ORDER-EXIST" }]];
    const result = await appRouter.createCaller(context()).checkout.place({ idempotencyKey: "11111111-1111-4111-8111-111111111111" });
    expect(result).toEqual({ orderIds: ["ESUT-ORDER-EXIST"], orderBatchId: "ESUT-BATCH-EXIST", paymentMethod: "CASH_ON_PICKUP" });
    expect(state.insertedTables).toContain(orderBatches);
    expect(state.insertedTables).not.toContain(orders);
  });

  it("rejects checkout when the atomic inventory reservation update cannot reserve the requested quantity", async () => {
    state.selectResults = [[cart], [line], [{ id: 43, publicId: "ESUT-BATCH-NEW" }], []];
    await expect(appRouter.createCaller(context()).checkout.place({ idempotencyKey: "22222222-2222-4222-8222-222222222222" })).rejects.toMatchObject({ code: "CONFLICT" });
    expect(state.insertedTables).toContain(orders);
    expect(state.updatedTables).toContain(inventory);
  });

  it("rejects a cart-quantity update for an item outside the caller’s cart scope", async () => {
    state.selectResults = [[cart], []];
    await expect(appRouter.createCaller(context()).cart.setQuantity({ itemId: 999, quantity: 1 })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(state.updatedTables).toEqual([]);
  });
});
