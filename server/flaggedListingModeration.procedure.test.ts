import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ selectResults: [] as unknown[][], updates: 0, inserts: 0 }));

vi.mock("./db", () => ({
  getDb: async () => {
    const query: any = {
      from: () => query,
      where: () => query,
      limit: () => query,
      orderBy: () => query,
      innerJoin: () => query,
      leftJoin: () => query,
      then: (resolve: (value: unknown[]) => unknown, reject: (reason: unknown) => unknown) => Promise.resolve(state.selectResults.shift() ?? []).then(resolve, reject),
    };
    const db: any = {
      select: () => query,
      update: () => ({ set: () => { state.updates += 1; return { where: async () => ({ affectedRows: 1 }) }; } }),
      insert: () => ({ values: async () => { state.inserts += 1; return []; } }),
      transaction: async (callback: (tx: any) => Promise<unknown>) => callback(db),
    };
    return db;
  },
}));

import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";

function context(role: "CUSTOMER" | "ADMIN"): TrpcContext {
  return { user: { id: 88, openId: `flagged-moderation-${role}`, name: "Moderation Test", email: "moderation@example.com", loginMethod: "test", role, isActive: true, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: null }, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

describe("flagged listing moderation", () => {
  beforeEach(() => { state.selectResults = []; state.updates = 0; state.inserts = 0; });

  it("rejects customer attempts to moderate a flagged listing before database access", async () => {
    await expect(appRouter.createCaller(context("CUSTOMER")).admin.setListingStatus({ id: 24, status: "ACTIVE", note: "Attempt to bypass moderation" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(state.selectResults).toEqual([]);
  });

  it("allows an administrator to restore a flagged listing and records its moderation trail", async () => {
    state.selectResults = [[{ listing: { id: 24, status: "FLAGGED", publishedAt: null, updatedAt: new Date() }, store: { ownerUserId: 77 } }]];
    await expect(appRouter.createCaller(context("ADMIN")).admin.setListingStatus({ id: 24, status: "ACTIVE", note: "Validated image replacement and restored listing." })).resolves.toEqual({ success: true });
    expect(state.updates).toBe(2);
    expect(state.inserts).toBeGreaterThanOrEqual(3);
  });
});
