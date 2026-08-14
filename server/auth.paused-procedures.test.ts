import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";
import { hashPassword } from "./localAuth";

const mockState = vi.hoisted(() => ({ selectResults: [] as unknown[][], insertResults: [] as unknown[], cookies: [] as unknown[] }));

vi.mock("./db", () => ({
  getDb: async () => ({
    select: () => ({ from: () => ({ where: () => ({ limit: async () => mockState.selectResults.shift() ?? [] }) }) }),
    insert: () => ({ values: async () => mockState.insertResults.shift() ?? [] }),
    update: () => ({ set: () => ({ where: async () => [] }) }),
  }),
}));
vi.mock("./_core/sdk", () => ({ sdk: { createSessionToken: vi.fn(async () => "test-session-token") } }));

import { appRouter } from "./routers";

function context(): TrpcContext {
  return { user: null, req: { protocol: "https", headers: {}, ip: "127.0.0.1" } as TrpcContext["req"], res: { cookie: (...args: unknown[]) => mockState.cookies.push(args) } as TrpcContext["res"] };
}

describe("paused email-verification authentication procedures", () => {
  beforeEach(() => { mockState.selectResults = []; mockState.insertResults = []; mockState.cookies = []; });

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
});
