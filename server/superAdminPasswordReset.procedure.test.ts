import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";
import { accountSecurityEvents, auditLogs, authSessions, authTokens, users } from "../drizzle/schema";
import { hashPassword, verifyPassword } from "./localAuth";

const state = vi.hoisted(() => ({
  selectResults: [] as unknown[][],
  updates: [] as { table: unknown; value: Record<string, unknown> }[],
  deletes: [] as unknown[],
  inserts: [] as { table: unknown; value: unknown }[],
}));

vi.mock("./db", () => ({
  getDb: async () => ({
    transaction: async (callback: (tx: any) => Promise<unknown>) => callback({
      select: () => ({ from: () => ({ where: () => ({ limit: async () => state.selectResults.shift() ?? [] }) }) }),
      update: (table: unknown) => ({ set: (value: Record<string, unknown>) => { state.updates.push({ table, value }); return { where: async () => ({ affectedRows: table === authSessions ? 2 : 1 }) }; } }),
      delete: (table: unknown) => { state.deletes.push(table); return { where: async () => ({ affectedRows: 1 }) }; },
      insert: (table: unknown) => ({ values: async (value: unknown) => { state.inserts.push({ table, value }); return { affectedRows: 1 }; } }),
    }),
  }),
}));

import { appRouter } from "./routers";

function context(actor: NonNullable<TrpcContext["user"]>): TrpcContext {
  return { user: actor, req: { protocol: "https", headers: {}, ip: "127.0.0.1" } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

describe("SUPER_ADMIN password replacement", () => {
  it("stores a replacement hash, clears lockout, revokes target sessions, and writes privacy-safe records", async () => {
    const actorPassword = "CurrentAdminPass123!";
    const actor = { id: 700, openId: "super-admin-reset", name: "Root Admin", email: "root@example.com", loginMethod: "password", passwordHash: await hashPassword(actorPassword), role: "SUPER_ADMIN" as const, isActive: true, failedLoginCount: 0, lockedUntil: null, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };
    const target = { id: 13, openId: "target-account", name: "Micheal Uzodinma", email: "micheal@example.com", loginMethod: "password", passwordHash: await hashPassword("OldMemberPass123!"), role: "CUSTOMER" as const, isActive: true, failedLoginCount: 5, lockedUntil: new Date(Date.now() + 60_000), createdAt: new Date(), updatedAt: new Date(), lastSignedIn: null };
    state.selectResults = [[actor], [target]];
    state.updates = [];
    state.deletes = [];
    state.inserts = [];

    const result = await appRouter.createCaller(context(actor)).admin.resetUserPassword({ targetUserId: target.id, adminCurrentPassword: actorPassword, newPassword: "ReplacementPass123!", confirmPassword: "ReplacementPass123!", note: "Verified member recovery request" });

    expect(result.success).toBe(true);
    expect(result.revokedSessionCount).toBe(2);
    const userUpdate = state.updates.find(entry => entry.table === users)?.value;
    expect(userUpdate).toMatchObject({ loginMethod: "password", failedLoginCount: 0, lockedUntil: null });
    expect(typeof userUpdate?.passwordHash).toBe("string");
    expect(userUpdate?.passwordHash).not.toBe(target.passwordHash);
    expect(await verifyPassword("ReplacementPass123!", String(userUpdate?.passwordHash))).toBe(true);
    expect(state.updates.find(entry => entry.table === authSessions)?.value).toMatchObject({ status: "REVOKED", revokeReason: "SUPER_ADMIN_PASSWORD_RESET" });
    expect(state.deletes).toContain(authTokens);
    expect(state.inserts.some(entry => entry.table === accountSecurityEvents && (entry.value as { eventType?: string }).eventType === "PASSWORD_CHANGED")).toBe(true);
    const audit = state.inserts.find(entry => entry.table === auditLogs)?.value as { action?: string; metadata?: Record<string, unknown> } | undefined;
    expect(audit?.action).toBe("SUPER_ADMIN_PASSWORD_RESET");
    expect(JSON.stringify(audit)).not.toContain("ReplacementPass123!");
  });
});
