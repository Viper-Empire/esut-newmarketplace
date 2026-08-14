import { describe, expect, it } from "vitest";
import { isAuthTokenUsable } from "./authTokenPolicies";

describe("authentication token lifecycle policy", () => {
  const now = new Date("2026-08-14T12:00:00.000Z");

  it("permits only unconsumed tokens that have not expired", () => {
    expect(isAuthTokenUsable({ consumedAt: null, expiresAt: new Date("2026-08-14T12:00:01.000Z") }, now)).toBe(true);
    expect(isAuthTokenUsable({ consumedAt: null, expiresAt: now }, now)).toBe(false);
    expect(isAuthTokenUsable({ consumedAt: null, expiresAt: new Date("2026-08-14T11:59:59.000Z") }, now)).toBe(false);
    expect(isAuthTokenUsable({ consumedAt: new Date("2026-08-14T11:59:00.000Z"), expiresAt: new Date("2026-08-14T12:10:00.000Z") }, now)).toBe(false);
  });
});
