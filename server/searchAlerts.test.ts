import { describe, expect, it } from "vitest";
import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";

function contextFor(role: "CUSTOMER" | null): TrpcContext {
  return {
    user: role
      ? { id: 907, openId: "search-alert-test", name: "Search Alert Test", email: "search-alert-test@example.com", loginMethod: "password", role, isActive: true, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: null }
      : null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("saved marketplace search alerts", () => {
  it("requires authentication before creating or cancelling an alert", async () => {
    const caller = appRouter.createCaller(contextFor(null));
    await expect(caller.searchAlerts.create({ query: "engineering book", verified: false })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.searchAlerts.cancel({ id: 1 })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejects an invalid price range before database access", async () => {
    const caller = appRouter.createCaller(contextFor("CUSTOMER"));
    await expect(caller.searchAlerts.create({ query: "calculator", minKobo: 90_000, maxKobo: 10_000, verified: false })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
