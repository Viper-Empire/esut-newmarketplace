import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ selectResults: [] as unknown[][], updated: 0 }));

vi.mock("./db", () => ({
  getDb: async () => ({
    select: () => { const query: any = { from: () => query, innerJoin: () => query, leftJoin: () => query, where: () => query, limit: async () => state.selectResults.shift() ?? [] }; return query; },
    update: () => { state.updated += 1; return { set: () => ({ where: async () => [] }) }; },
  }),
}));

import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";

function context(role: "CUSTOMER" | "SELLER"): TrpcContext {
  return { user: { id: 55, openId: `seller-idor-${role}`, name: "Seller IDOR Test", email: "seller@example.com", loginMethod: "password", role, isActive: true, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: null }, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

describe("seller inventory ownership procedure", () => {
  beforeEach(() => { state.selectResults = []; state.updated = 0; });

  it("does not update a listing that is not returned from the authenticated seller’s ownership scope", async () => {
    state.selectResults = [[{ verificationStatus: "APPROVED" }], []];
    await expect(appRouter.createCaller(context("SELLER")).seller.setInventory({ listingId: 999, quantity: 5 })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(state.updated).toBe(0);
  });

  it("rejects non-seller callers before any seller inventory query can run", async () => {
    await expect(appRouter.createCaller(context("CUSTOMER")).seller.setInventory({ listingId: 999, quantity: 5 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(state.selectResults).toEqual([]);
  });
});
