import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";
import { hashPassword, verifyPassword } from "./localAuth";
import { auditLogs, authTokens, orders, profiles, stores, users } from "../drizzle/schema";

const mockState = vi.hoisted(() => ({ selectResults: [] as unknown[][], insertResults: [] as unknown[], insertValues: [] as { table: unknown; value: unknown }[], cookies: [] as unknown[], updatedTables: [] as unknown[], updatedValues: [] as { table: unknown; value: unknown }[], deletedTables: [] as unknown[] }));

vi.mock("./db", () => ({
  getDb: async () => ({
    select: () => ({ from: () => ({ where: () => ({ limit: async () => (mockState.selectResults.shift() ?? []).filter((row: any) => !row?.expiresAt || (row.expiresAt > new Date() && row.consumedAt === null)) }) }) }),
    insert: (table: unknown) => ({ values: (value: unknown) => { mockState.insertValues.push({ table, value }); const result = mockState.insertResults.shift() ?? []; return Object.assign(Promise.resolve(result), { onDuplicateKeyUpdate: async () => result }); } }),
    update: (table: unknown) => { mockState.updatedTables.push(table); return { set: (value: unknown) => { mockState.updatedValues.push({ table, value }); return { where: async () => [] }; } }; },
    delete: (table: unknown) => { mockState.deletedTables.push(table); return { where: async () => [] }; },
    transaction: async (callback: (tx: any) => Promise<unknown>) => callback({
      update: (table: unknown) => {
        mockState.updatedTables.push(table);
        return { set: (value: unknown) => { mockState.updatedValues.push({ table, value }); return { where: async () => [] }; } };
      },
      delete: (table: unknown) => {
        mockState.deletedTables.push(table);
        return { where: async () => [] };
      },
      insert: (table: unknown) => ({
        values: async (value: unknown) => { mockState.insertValues.push({ table, value }); return []; },
      }),
    }),
  }),
}));
vi.mock("./_core/sdk", () => ({ sdk: { createSessionToken: vi.fn(async () => "test-session-token") } }));

import { appRouter } from "./routers";

function context(): TrpcContext {
  return { user: null, req: { protocol: "https", headers: {}, ip: "127.0.0.1" } as TrpcContext["req"], res: { cookie: (...args: unknown[]) => mockState.cookies.push(args) } as TrpcContext["res"] };
}

describe("paused email-verification authentication procedures", () => {
  beforeEach(() => { mockState.selectResults = []; mockState.insertResults = []; mockState.insertValues = []; mockState.cookies = []; mockState.updatedTables = []; mockState.updatedValues = []; mockState.deletedTables = []; });

  it("returns a registration response that does not require or claim verification delivery", async () => {
    const created = { id: 31, openId: "local_test", name: "Ada Student", email: "ada@example.com", loginMethod: "password", passwordHash: "hidden", role: "CUSTOMER", isActive: true, failedLoginCount: 0, lockedUntil: null, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: null };
    mockState.selectResults = [[], [], [created]];
    mockState.insertResults = [[], [{ insertId: 31 }], []];
    const result = await appRouter.createCaller(context()).auth.register({ firstName: "Ada", lastName: "Student", email: "ada@example.com", phone: "08012345678", accountType: "INDIVIDUAL", password: "CampusPass123!" });
    expect(result).toMatchObject({ requiresEmailVerification: false, verificationSent: false });
  });

  it("exposes unavailable password-recovery email before a user starts a reset request", async () => {
    await expect(appRouter.createCaller(context()).auth.passwordResetAvailability()).resolves.toEqual({ passwordResetEmailAvailable: false });
  });

  it("returns a login response that does not require verification delivery", async () => {
    const passwordHash = await hashPassword("CampusPass123!");
    const existing = { id: 41, openId: "local_login", name: "Bola Student", email: "bola@example.com", loginMethod: "password", passwordHash, role: "CUSTOMER", isActive: true, failedLoginCount: 0, lockedUntil: null, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: null };
    mockState.selectResults = [[], [existing]];
    const result = await appRouter.createCaller(context()).auth.login({ email: "bola@example.com", password: "CampusPass123!" });
    expect(result).toMatchObject({ requiresEmailVerification: false });
  });

  it("does not issue an undeliverable password-reset token while ordinary email delivery is paused", async () => {
    const existing = { id: 43, openId: "reset-paused", name: "Reset Student", email: "reset@example.com", loginMethod: "password", passwordHash: "hidden", role: "CUSTOMER", isActive: true, failedLoginCount: 0, lockedUntil: null, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: null };
    mockState.selectResults = [[], [existing]];
    const result = await appRouter.createCaller(context()).auth.requestPasswordReset({ email: "reset@example.com" });
    expect(result).toMatchObject({ success: true, passwordResetEmailAvailable: false });
    expect(mockState.insertValues.some(entry => entry.table === authTokens)).toBe(false);
  });

  it("consumes a valid verification token and rejects invalid or expired token records", async () => {
    const validToken = { id: 71, userId: 31, purpose: "EMAIL_VERIFY", tokenHash: "hidden", expiresAt: new Date(Date.now() + 60_000), consumedAt: null };
    mockState.selectResults = [[], [validToken]];
    await expect(appRouter.createCaller(context()).auth.verifyEmail({ token: "a".repeat(24) })).resolves.toEqual({ success: true });
    expect(mockState.updatedTables).toEqual([users, authTokens]);

    mockState.selectResults = [[], []];
    await expect(appRouter.createCaller(context()).auth.verifyEmail({ token: "b".repeat(24) })).rejects.toMatchObject({ code: "BAD_REQUEST" });

    const expiredToken = { ...validToken, id: 73, expiresAt: new Date(Date.now() - 60_000) };
    mockState.selectResults = [[], [expiredToken]];
    await expect(appRouter.createCaller(context()).auth.verifyEmail({ token: "e".repeat(24) })).rejects.toMatchObject({ code: "BAD_REQUEST" });

    const consumedToken = { ...validToken, id: 74, consumedAt: new Date() };
    mockState.selectResults = [[], [consumedToken]];
    await expect(appRouter.createCaller(context()).auth.verifyEmail({ token: "f".repeat(24) })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("consumes a valid reset token, then rejects an unavailable, expired, or already-consumed token", async () => {
    const validToken = { id: 72, userId: 32, purpose: "PASSWORD_RESET", tokenHash: "hidden", expiresAt: new Date(Date.now() + 60_000), consumedAt: null };
    const account = { id: 32, openId: "reset-complete", name: "Token Student", email: "token@example.com", loginMethod: "password", passwordHash: "old", role: "CUSTOMER", isActive: true, failedLoginCount: 0, lockedUntil: null, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: null };
    mockState.selectResults = [[], [validToken], [account]];
    await expect(appRouter.createCaller(context()).auth.resetPassword({ token: "c".repeat(24), password: "NewCampusPass123!" })).resolves.toMatchObject({ success: true, user: { id: 32 } });
    expect(mockState.updatedTables).toEqual([users, authTokens]);

    mockState.selectResults = [[], []];
    await expect(appRouter.createCaller(context()).auth.resetPassword({ token: "d".repeat(24), password: "NewCampusPass123!" })).rejects.toMatchObject({ code: "BAD_REQUEST" });

    const expiredToken = { ...validToken, id: 75, expiresAt: new Date(Date.now() - 60_000) };
    mockState.selectResults = [[], [expiredToken]];
    await expect(appRouter.createCaller(context()).auth.resetPassword({ token: "g".repeat(24), password: "NewCampusPass123!" })).rejects.toMatchObject({ code: "BAD_REQUEST" });

    const consumedToken = { ...validToken, id: 76, consumedAt: new Date() };
    mockState.selectResults = [[], [consumedToken]];
    await expect(appRouter.createCaller(context()).auth.resetPassword({ token: "h".repeat(24), password: "NewCampusPass123!" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("escalates a fifth failed password attempt into a persisted lockout", async () => {
    const passwordHash = await hashPassword("CampusPass123!");
    const existing = { id: 45, openId: "lockout-test", name: "Locked Student", email: "locked@example.com", loginMethod: "password", passwordHash, role: "CUSTOMER", isActive: true, failedLoginCount: 4, lockedUntil: null, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: null };
    mockState.selectResults = [[], [existing]];
    await expect(appRouter.createCaller(context()).auth.login({ email: "locked@example.com", password: "wrong-password" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(mockState.updatedTables).toEqual([users]);
  });

  it("rejects login attempts while the account lockout window remains active", async () => {
    const passwordHash = await hashPassword("CampusPass123!");
    const existing = { id: 46, openId: "active-lock", name: "Locked Student", email: "still-locked@example.com", loginMethod: "password", passwordHash, role: "CUSTOMER", isActive: true, failedLoginCount: 5, lockedUntil: new Date(Date.now() + 15 * 60 * 1000), createdAt: new Date(), updatedAt: new Date(), lastSignedIn: null };
    mockState.selectResults = [[], [existing]];
    await expect(appRouter.createCaller(context()).auth.login({ email: "still-locked@example.com", password: "CampusPass123!" })).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    expect(mockState.updatedTables).toEqual([]);
  });

  it("preserves an existing account identity and role when it claims password login", async () => {
    const existing = { id: 52, openId: "legacy-seller-open-id", name: "Legacy Seller", email: "seller@example.com", loginMethod: "oauth", passwordHash: null, role: "SELLER", isActive: true, failedLoginCount: 0, lockedUntil: null, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: null };
    const updated = { ...existing, name: "Seyi Vendor", loginMethod: "password", passwordHash: "hidden" };
    mockState.selectResults = [[], [existing], [updated]];
    mockState.insertResults = [[], []];
    const linkedMarketplaceRecords = { store: { ownerUserId: 52, id: 9 }, order: { buyerUserId: 52, id: 77 } };
    const result = await appRouter.createCaller(context()).auth.register({ firstName: "Seyi", lastName: "Vendor", email: "seller@example.com", phone: "08098765432", accountType: "BUSINESS", password: "CampusPass123!" });
    expect(result.user).toMatchObject({ id: 52, openId: "legacy-seller-open-id", role: "SELLER", loginMethod: "password" });
    expect(linkedMarketplaceRecords).toEqual({ store: { ownerUserId: 52, id: 9 }, order: { buyerUserId: 52, id: 77 } });
    expect(mockState.updatedTables).toEqual([users]);
    expect(mockState.updatedTables).not.toContain(stores);
    expect(mockState.updatedTables).not.toContain(orders);
    expect(mockState.deletedTables).toEqual([]);
  });

  it("strips attempted role changes from a profile update", async () => {
    const user = { id: 88, openId: "profile-owner", name: "Profile Owner", email: "profile@example.com", loginMethod: "password", role: "CUSTOMER" as const, isActive: true, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: null };
    await appRouter.createCaller({ ...context(), user }).profile.update({ phone: "08000000000", location: "ESUT", role: "ADMIN" } as any);
    expect(mockState.insertValues[0]).toMatchObject({ table: profiles, value: { userId: 88, phone: "08000000000", location: "ESUT" } });
    expect(mockState.insertValues[0]?.value).not.toHaveProperty("role");
  });

  it("requires the current password, renews the active session, and records a password change without exposing the password", async () => {
    const oldPasswordHash = await hashPassword("CampusPass123!");
    const account = { id: 93, openId: "password-change", name: "Security Student", email: "security@example.com", loginMethod: "password", passwordHash: oldPasswordHash, role: "CUSTOMER" as const, isActive: true, failedLoginCount: 3, lockedUntil: new Date(Date.now() + 60_000), createdAt: new Date(), updatedAt: new Date(), lastSignedIn: null };
    mockState.selectResults = [[], [account]];
    await expect(appRouter.createCaller({ ...context(), user: account }).auth.changePassword({ currentPassword: "CampusPass123!", newPassword: "ChangedCampusPass123!", confirmPassword: "ChangedCampusPass123!" })).resolves.toEqual({ success: true });
    const passwordUpdate = mockState.updatedValues.find(entry => entry.table === users)?.value as { passwordHash?: string; failedLoginCount?: number; lockedUntil?: unknown };
    expect(passwordUpdate.passwordHash).toBeDefined();
    expect(passwordUpdate.passwordHash).not.toBe(oldPasswordHash);
    await expect(verifyPassword("ChangedCampusPass123!", passwordUpdate.passwordHash)).resolves.toBe(true);
    expect(passwordUpdate).not.toHaveProperty("currentPassword");
    expect(passwordUpdate).not.toHaveProperty("newPassword");
    expect(passwordUpdate).toMatchObject({ failedLoginCount: 0, lockedUntil: null });
    expect(mockState.deletedTables).toContain(authTokens);
    expect(mockState.insertValues.some(entry => entry.table === auditLogs && (entry.value as { action?: string }).action === "PASSWORD_CHANGED")).toBe(true);
    expect(mockState.cookies).toHaveLength(1);
  });

  it("rejects an incorrect current password before changing credentials or issuing a fresh session", async () => {
    const account = { id: 94, openId: "wrong-password", name: "Security Student", email: "wrong@example.com", loginMethod: "password", passwordHash: await hashPassword("CampusPass123!"), role: "CUSTOMER" as const, isActive: true, failedLoginCount: 0, lockedUntil: null, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: null };
    mockState.selectResults = [[], [account]];
    await expect(appRouter.createCaller({ ...context(), user: account }).auth.changePassword({ currentPassword: "IncorrectPass123!", newPassword: "ChangedCampusPass123!", confirmPassword: "ChangedCampusPass123!" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(mockState.updatedTables).toEqual([]);
    expect(mockState.cookies).toEqual([]);
  });
});
