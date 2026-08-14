import { describe, expect, it } from "vitest";
import { router, adminProcedure, moderatorProcedure, sellerProcedure } from "./_core/trpc";
import type { TrpcContext } from "./_core/context";

const protectedRoutes = router({
  adminOnly: adminProcedure.query(() => ({ ok: true })),
  moderatorOnly: moderatorProcedure.query(() => ({ ok: true })),
  sellerOnly: sellerProcedure.query(() => ({ ok: true })),
});

function contextFor(role: "CUSTOMER" | "SELLER" | "MODERATOR" | "ADMIN" | "SUPER_ADMIN"): TrpcContext {
  return {
    user: { id: 7, openId: `role-${role}`, name: "Role Test", email: null, loginMethod: "test", role, isActive: true, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("marketplace role authorization", () => {
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
  });
  it("permits moderators only for scoped moderation operations", async () => {
    await expect(protectedRoutes.createCaller(contextFor("MODERATOR")).moderatorOnly()).resolves.toEqual({ ok: true });
    await expect(protectedRoutes.createCaller(contextFor("MODERATOR")).adminOnly()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(protectedRoutes.createCaller(contextFor("CUSTOMER")).moderatorOnly()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
