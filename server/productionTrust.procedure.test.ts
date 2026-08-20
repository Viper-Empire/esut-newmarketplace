import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ selectResults: [] as unknown[][], updates: 0, whereCalls: [] as unknown[][] }));

vi.mock("./db", () => {
  const next = () => state.selectResults.shift() ?? [];
  const select = () => {
    const query: any = {
      from: () => query,
      innerJoin: () => query,
      leftJoin: () => query,
      orderBy: () => query,
      where: (...args: unknown[]) => { state.whereCalls.push(args); return query; },
      limit: async () => next(),
      then: (resolve: (value: unknown[]) => unknown, reject?: (reason: unknown) => unknown) => Promise.resolve(next()).then(resolve, reject),
    };
    return query;
  };
  const database: any = {
    select: () => select(),
    update: () => { state.updates += 1; return { set: () => ({ where: async () => [{ affectedRows: 1 }] }) }; },
    insert: () => ({ values: async () => [{ insertId: 1 }] }),
    transaction: async (callback: (tx: any) => Promise<unknown>) => callback(database),
  };
  return { getDb: async () => database };
});

import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";
import { getActiveTrackedSession } from "./sessionSecurity";

function context(role: "CUSTOMER" | "SELLER" | "ADMIN", id = 55): TrpcContext {
  return { user: { id, openId: `production-trust-${role}-${id}`, name: "Production Trust Tester", email: "tester@example.com", loginMethod: "password", role, isActive: true, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: null }, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

describe("production-trust procedure boundaries", () => {
  beforeEach(() => { state.selectResults = []; state.updates = 0; state.whereCalls = []; });

  it("denies a non-participant access to dispute evidence before any signed URL can be returned", async () => {
    state.selectResults = [[{ id: 12, submittedByUserId: 99, disputeId: 44, reportId: null, storageKey: "private/case-evidence", mimeType: "image/jpeg" }], []];
    await expect(appRouter.createCaller(context("CUSTOMER", 55)).support.caseEvidenceUrl({ evidenceId: 12 })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("rejects seller storefront markup before persistence, including administrator-role callers", async () => {
    await expect(appRouter.createCaller(context("ADMIN")).seller.updateStorefrontConfig({ announcement: "<script>alert(1)</script>", accentColor: "ESUT_GREEN", featuredProductIds: [] })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(state.updates).toBe(0);
  });

  it("rejects a seller attempt to feature a foreign or inactive listing", async () => {
    state.selectResults = [[{ verificationStatus: "APPROVED" }], [{ id: 7, ownerUserId: 55 }], []];
    await expect(appRouter.createCaller(context("SELLER")).seller.updateStorefrontConfig({ announcement: "Original campus goods", accentColor: "ESUT_GREEN", featuredProductIds: [999] })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(state.updates).toBe(0);
  });

  it("does not treat a missing opaque session identifier as an active server-tracked session", async () => {
    await expect(getActiveTrackedSession({ userId: 55, sessionId: undefined })).resolves.toBeNull();
    expect(state.whereCalls).toEqual([]);
  });

  it("rejects an unsupported avatar MIME type before file storage can be reached", async () => {
    await expect(appRouter.createCaller(context("CUSTOMER")).media.uploadAvatar({ filename: "avatar.svg", mimeType: "image/svg+xml" as never, dataUrl: "data:image/svg+xml;base64,PHN2Zz4=", makePublic: false })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("returns only the newest caller-scoped event projection for active workspace refresh", async () => {
    const event = { id: 9, eventType: "ORDER_STATUS_UPDATED", aggregateKey: "order:22", targetRoute: "/account/orders/ESUT-22", createdAt: new Date() };
    state.selectResults = [[event]];
    await expect(appRouter.createCaller(context("CUSTOMER", 55)).notifications.latestEvent()).resolves.toEqual(event);
  });
});
