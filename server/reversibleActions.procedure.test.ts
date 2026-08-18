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
      offset: () => query,
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

function context(id = 9, role: "ADMIN" | "SUPER_ADMIN" = "ADMIN"): TrpcContext {
  return { user: { id, openId: `recovery-${id}`, name: "Recovery Admin", email: "recovery@example.com", loginMethod: "password", role, isActive: true, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: null }, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

const activeUserAction = (actorUserId = 9) => ({ id: 1, actionType: "USER_ACTIVE", targetType: "USER", targetId: "22", actorUserId, beforeState: { isActive: true }, afterState: { isActive: false }, status: "ACTIVE", revision: 0, createdAt: new Date(), undoneAt: null, redoneAt: null });

describe("administrator reversible moderation actions", () => {
  beforeEach(() => { state.selectResults = []; state.updates = 0; state.inserts = 0; });

  it("undoes a matching eligible action and records a new audit event", async () => {
    state.selectResults = [[activeUserAction()], [{ id: 22, isActive: false }]];
    await expect(appRouter.createCaller(context()).admin.undoReversibleAction({ id: 1, note: "Correct accidental deactivation" })).resolves.toEqual({ success: true });
    expect(state.updates).toBe(2);
    expect(state.inserts).toBe(1);
  });

  it("rejects a stale target rather than overwriting a later administrator decision", async () => {
    state.selectResults = [[activeUserAction()], [{ id: 22, isActive: true }]];
    await expect(appRouter.createCaller(context()).admin.undoReversibleAction({ id: 1, note: "Attempt stale recovery" })).rejects.toMatchObject({ code: "CONFLICT" });
    expect(state.updates).toBe(0);
  });

  it("prevents an ADMIN from reversing another administrator's action", async () => {
    state.selectResults = [[activeUserAction(44)]];
    await expect(appRouter.createCaller(context()).admin.undoReversibleAction({ id: 1, note: "Attempt another admin recovery" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(state.updates).toBe(0);
  });
});
