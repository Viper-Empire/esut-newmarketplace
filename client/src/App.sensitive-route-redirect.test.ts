import { describe, expect, it } from "vitest";
import { isSensitiveRoute, unauthenticatedSensitiveRedirect } from "./App";

describe("sensitive route classification", () => {
  it("classifies protected workspace prefixes without matching public lookalikes", () => {
    expect(isSensitiveRoute("/account")).toBe(true);
    expect(isSensitiveRoute("/account/security")).toBe(true);
    expect(isSensitiveRoute("/checkout")).toBe(true);
    expect(isSensitiveRoute("/seller/products")).toBe(true);
    expect(isSensitiveRoute("/moderator")).toBe(true);
    expect(isSensitiveRoute("/admin/users")).toBe(true);
    expect(isSensitiveRoute("/")).toBe(false);
    expect(isSensitiveRoute("/explore")).toBe(false);
    expect(isSensitiveRoute("/administrator")).toBe(false);
    expect(isSensitiveRoute("/seller-public")).toBe(false);
  });

  it("routes account and checkout attempts to login while keeping other sensitive routes on the homepage", () => {
    expect(unauthenticatedSensitiveRedirect("/account")).toBe("/login");
    expect(unauthenticatedSensitiveRedirect("/account/security?tab=sessions")).toBe("/login");
    expect(unauthenticatedSensitiveRedirect("/checkout")).toBe("/login");
    expect(unauthenticatedSensitiveRedirect("/checkout/confirm")).toBe("/login");
    expect(unauthenticatedSensitiveRedirect("/admin")).toBe("/");
    expect(unauthenticatedSensitiveRedirect("/seller/products")).toBe("/");
    expect(unauthenticatedSensitiveRedirect("/explore")).toBeNull();
  });
});
