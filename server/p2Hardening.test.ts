import { describe, expect, it } from "vitest";
import type { TrpcContext } from "./_core/context";
import { assertAllowedOrderTransition } from "./orderLifecycle";
import { appRouter } from "./routers";

function adminContext(): TrpcContext {
  return {
    user: { id: 91, openId: "p2-admin", name: "P2 Admin", email: "p2-admin@example.com", loginMethod: "password", role: "ADMIN", isActive: true, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: null },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("P2 workflow hardening", () => {
  it("keeps automatic reservation-expiry schedule creation unavailable outside production", async () => {
    const caller = appRouter.createCaller(adminContext());
    await expect(caller.admin.configureReservationExpirySchedule()).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects unsupported notification provider selections before any configuration is persisted", async () => {
    const caller = appRouter.createCaller(adminContext());
    await expect(caller.admin.updateNotificationSettings({ provider: "SMTP" as never, orderUpdates: true, sellerApplications: true, offerUpdates: true, reviews: true })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("permits only a pending reservation to enter its expiry cancellation path", () => {
    expect(() => assertAllowedOrderTransition("PENDING", "CANCELLED")).not.toThrow();
    expect(() => assertAllowedOrderTransition("CONFIRMED", "CANCELLED")).not.toThrow();
    expect(() => assertAllowedOrderTransition("COMPLETED", "CANCELLED")).toThrow(/cannot transition/i);
    expect(() => assertAllowedOrderTransition("CANCELLED", "CANCELLED")).toThrow(/cannot transition/i);
  });
});
