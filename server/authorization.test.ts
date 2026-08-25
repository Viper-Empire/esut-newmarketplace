import { describe, expect, it } from "vitest";
import { router, adminProcedure, moderatorProcedure, operationsProcedure, sellerProcedure, superAdminProcedure } from "./_core/trpc";
import type { TrpcContext } from "./_core/context";

const protectedRoutes = router({
  adminOnly: adminProcedure.query(() => ({ ok: true })),
  moderatorOnly: moderatorProcedure.query(() => ({ ok: true })),
  operationsOnly: operationsProcedure.query(() => ({ ok: true })),
  sellerOnly: sellerProcedure.query(() => ({ ok: true })),
  superAdminOnly: superAdminProcedure.query(() => ({ ok: true })),
});

function contextFor(role: "CUSTOMER" | "SELLER" | "SUPPORT" | "MODERATOR" | "ADMIN" | "SUPER_ADMIN"): TrpcContext {
  return {
    user: { id: 7, openId: `role-${role}`, name: "Role Test", email: null, loginMethod: "test", role, isActive: true, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

function anonymousContext(): TrpcContext {
  return { user: null, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

describe("marketplace role authorization", () => {
  it("rejects anonymous requests from every protected boundary", async () => {
    const caller = protectedRoutes.createCaller(anonymousContext());
    await expect(caller.adminOnly()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.moderatorOnly()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.operationsOnly()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.sellerOnly()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.superAdminOnly()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
  it("rejects customers from administrator-only operations", async () => {
    await expect(protectedRoutes.createCaller(contextFor("CUSTOMER")).adminOnly()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it("permits administrators and super administrators to access protected administration", async () => {
    await expect(protectedRoutes.createCaller(contextFor("ADMIN")).adminOnly()).resolves.toEqual({ ok: true });
    await expect(protectedRoutes.createCaller(contextFor("SUPER_ADMIN")).adminOnly()).resolves.toEqual({ ok: true });
  });
  it("rejects customers but permits sellers for seller-only operations", async () => {
    await expect(protectedRoutes.createCaller(contextFor("CUSTOMER")).sellerOnly()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(protectedRoutes.createCaller(contextFor("SELLER")).sellerOnly()).resolves.toEqual({ ok: true });
    await expect(protectedRoutes.createCaller(contextFor("ADMIN")).sellerOnly()).resolves.toEqual({ ok: true });
    await expect(protectedRoutes.createCaller(contextFor("SUPER_ADMIN")).sellerOnly()).resolves.toEqual({ ok: true });
    await expect(protectedRoutes.createCaller(contextFor("MODERATOR")).sellerOnly()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it("permits moderators only for scoped moderation operations", async () => {
    await expect(protectedRoutes.createCaller(contextFor("MODERATOR")).moderatorOnly()).resolves.toEqual({ ok: true });
    await expect(protectedRoutes.createCaller(contextFor("ADMIN")).moderatorOnly()).resolves.toEqual({ ok: true });
    await expect(protectedRoutes.createCaller(contextFor("SUPER_ADMIN")).moderatorOnly()).resolves.toEqual({ ok: true });
    await expect(protectedRoutes.createCaller(contextFor("MODERATOR")).adminOnly()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(protectedRoutes.createCaller(contextFor("CUSTOMER")).moderatorOnly()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(protectedRoutes.createCaller(contextFor("SELLER")).moderatorOnly()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it("permits operational support only through the explicitly scoped operations boundary", async () => {
    const caller = protectedRoutes.createCaller(contextFor("SUPPORT"));
    await expect(caller.operationsOnly()).resolves.toEqual({ ok: true });
    await expect(caller.moderatorOnly()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.adminOnly()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.superAdminOnly()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it("reserves staff provisioning controls for super administrators", async () => {
    await expect(protectedRoutes.createCaller(contextFor("ADMIN")).superAdminOnly()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(protectedRoutes.createCaller(contextFor("SUPER_ADMIN")).superAdminOnly()).resolves.toEqual({ ok: true });
  });
});
