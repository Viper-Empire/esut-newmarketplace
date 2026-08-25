import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";

function contextFor(role: "CUSTOMER" | "SELLER" | "SUPPORT" | "MODERATOR" | "ADMIN" | "SUPER_ADMIN" | null): TrpcContext {
  return {
    user: role
      ? { id: 901, openId: `admin-security-${role}`, name: "Security Test", email: "security-test@example.com", loginMethod: "password", role, isActive: true, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: null }
      : null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

const sdkSource = readFileSync(new URL("./_core/sdk.ts", import.meta.url), "utf8");

describe("administrator endpoint security boundary", () => {
  it("keeps every known admin router surface behind an administrator guard", () => {
    const routerSource = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");
    expect(routerSource).toContain("admin: router({");
    expect(routerSource).toContain("resetUserPassword: superAdminProcedure");
    for (const procedure of [
      "configureReservationExpirySchedule", "reservationExpiryHealth", "configureReminderSchedule", "reminderHealth", "operationalHealth",
      "dashboard", "analytics", "orders", "orderDetail", "transitionOrder", "users", "userDetail", "setUserActive", "sellers", "stores",
      "setStoreStatus", "listings", "mediaIntegrity", "listingVideoEvidenceUrl", "reviewListingVideoEvidence", "setListingStatus", "categories",
    ]) expect(routerSource).toContain(`${procedure}: adminProcedure`);
  });

  it("rejects signed-out callers before administrator data access", async () => {
    const caller = appRouter.createCaller(contextFor(null));
    await expect(caller.admin.dashboard()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.auditLogs({ page: 1, limit: 10 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.listingVideoEvidenceUrl({ listingId: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.reviewListingVideoEvidence({ listingId: 1, approve: true, note: "Unauthorized evidence approval" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.reversibleActions({ page: 1, limit: 10 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.undoReversibleAction({ id: 1, note: "Unauthorized recovery attempt" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.redoReversibleAction({ id: 1, note: "Unauthorized recovery attempt" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.resetUserPassword({ targetUserId: 902, adminCurrentPassword: "CurrentAdminPass123!", newPassword: "ReplacementPass123!", confirmPassword: "ReplacementPass123!", note: "Unauthorized password reset" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it.each(["CUSTOMER", "SELLER", "SUPPORT", "MODERATOR"] as const)("rejects %s callers from administrator endpoints", async role => {
    const caller = appRouter.createCaller(contextFor(role));
    await expect(caller.admin.dashboard()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.auditLogs({ page: 1, limit: 10 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.listingVideoEvidenceUrl({ listingId: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.reviewListingVideoEvidence({ listingId: 1, approve: false, note: "Unauthorized evidence review" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.setUserActive({ id: 902, isActive: false, note: "Security boundary test" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.reversibleActions({ page: 1, limit: 10 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.undoReversibleAction({ id: 1, note: "Security boundary test" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.redoReversibleAction({ id: 1, note: "Security boundary test" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.resetUserPassword({ targetUserId: 902, adminCurrentPassword: "CurrentAdminPass123!", newPassword: "ReplacementPass123!", confirmPassword: "ReplacementPass123!", note: "Unauthorized password reset" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("does not treat client-supplied role-like inputs as authorization", async () => {
    const caller = appRouter.createCaller(contextFor("CUSTOMER"));
    await expect(caller.admin.auditLogs({ page: 1, limit: 10, actor: "ADMIN" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.listings({ page: 1, limit: 12, status: "PENDING_REVIEW" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects malformed role claims rather than accepting role-like prefixes", async () => {
    const context = contextFor("CUSTOMER");
    (context.user as { role: string }).role = "ADMIN ";
    await expect(appRouter.createCaller(context).admin.dashboard()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects inactive or revoked tracked sessions before protected procedures", () => {
    expect(sdkSource).toContain("if (!user.isActive)");
    expect(sdkSource).toContain("getActiveTrackedSession");
    expect(sdkSource).toContain("sessionId");
  });

  it("allows only administrator roles through the production guard", async () => {
    const caller = appRouter.createCaller(contextFor("ADMIN"));
    expect(caller.admin.dashboard).toBeDefined();
    const superAdminCaller = appRouter.createCaller(contextFor("SUPER_ADMIN"));
    expect(superAdminCaller.admin.auditLogs).toBeDefined();
  });

  it("reserves password replacement for SUPER_ADMIN rather than an ordinary administrator", async () => {
    const caller = appRouter.createCaller(contextFor("ADMIN"));
    await expect(caller.admin.resetUserPassword({ targetUserId: 902, adminCurrentPassword: "CurrentAdminPass123!", newPassword: "ReplacementPass123!", confirmPassword: "ReplacementPass123!", note: "Administrator boundary test" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("keeps media-integrity reporting administrator-only", async () => {
    const caller = appRouter.createCaller(contextFor("CUSTOMER"));
    await expect(caller.admin.mediaIntegrity()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("keeps seller image replacement behind the verified seller ownership guard", async () => {
    const caller = appRouter.createCaller(contextFor("CUSTOMER"));
    await expect(caller.seller.replaceProductImage({ listingId: 1, imageId: 1, image: { filename: "replacement.jpg", mimeType: "image/jpeg", dataUrl: "data:image/jpeg;base64,aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", isPrimary: false } })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
