import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";
import { hashPassword } from "./localAuth";
import { orders, stores, users } from "../drizzle/schema";

const mockState = vi.hoisted(() => ({ selectResults: [] as unknown[][], insertResults: [] as unknown[], cookies: [] as unknown[], updatedTables: [] as unknown[], deletedTables: [] as unknown[] }));

vi.mock("./db", () => ({
  getDb: async () => ({
    select: () => ({ from: () => ({ where: () => ({ limit: async () => mockState.selectResults.shift() ?? [] }) }) }),
    insert: () => ({ values: () => { const result = mockState.insertResults.shift() ?? []; return Object.assign(Promise.resolve(result), { onDuplicateKeyUpdate: async () => result }); } }),
    update: (table: unknown) => { mockState.updatedTables.push(table); return { set: () => ({ where: async () => [] }) }; },
    delete: (table: unknown) => { mockState.deletedTables.push(table); return { where: async () => [] }; },
  }),
}));
vi.mock("./_core/sdk", () => ({ sdk: { createSessionToken: vi.fn(async () => "test-session-token") } }));

import { appRouter } from "./routers";

function context(): TrpcContext {
  return { user: null, req: { protocol: "https", headers: {}, ip: "127.0.0.1" } as TrpcContext["req"], res: { cookie: (...args: unknown[]) => mockState.cookies.push(args) } as TrpcContext["res"] };
}

describe("paused email-verification authentication procedures", () => {
  beforeEach(() => { mockState.selectResults = []; mockState.insertResults = []; mockState.cookies = []; mockState.updatedTables = []; mockState.deletedTables = []; });

  it("returns a registration response that does not require or claim verification delivery", async () => {
    const created = { id: 31, openId: "local_test", name: "Ada Student", email: "ada@example.com", loginMethod: "password", passwordHash: "hidden", role: "CUSTOMER", isActive: true, failedLoginCount: 0, lockedUntil: null, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: null };
    mockState.selectResults = [[], [], [created]];
    mockState.insertResults = [[], [{ insertId: 31 }], []];
    const result = await appRouter.createCaller(context()).auth.register({ firstName: "Ada", lastName: "Student", email: "ada@example.com", phone: "08012345678", accountType: "INDIVIDUAL", password: "CampusPass123!" });
    expect(result).toMatchObject({ requiresEmailVerification: false, verificationSent: false });
  });

  it("returns a login response that does not require verification delivery", async () => {
    const passwordHash = await hashPassword("CampusPass123!");
    const existing = { id: 41, openId: "local_login", name: "Bola Student", email: "bola@example.com", loginMethod: "password", passwordHash, role: "CUSTOMER", isActive: true, failedLoginCount: 0, lockedUntil: null, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: null };
    mockState.selectResults = [[], [existing]];
    const result = await appRouter.createCaller(context()).auth.login({ email: "bola@example.com", password: "CampusPass123!" });
    expect(result).toMatchObject({ requiresEmailVerification: false });
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
});
