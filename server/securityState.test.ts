import { afterEach, describe, expect, it } from "vitest";
import { clearSecurityLimit, consumeSecurityLimit, getSecurityLockout, securityIdentifier, securityStateKeys, securityStateStatus } from "./securityState";

const scope = "vitest-security";
const identifier = `case-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const liveRedisTest = process.env.REDIS_SECURITY_TEST === "1" ? it : it.skip;

afterEach(async () => {
  if (process.env.REDIS_SECURITY_TEST === "1") await clearSecurityLimit({ scope, identifier });
});

describe("Redis security state", () => {
  it("uses deterministic HMAC-derived namespaced keys that do not contain raw identifiers", () => {
    const first = securityIdentifier(scope, "person@example.com");
    expect(first).toBe(securityIdentifier(scope, "person@example.com"));
    expect(first).not.toContain("person@example.com");
    expect(securityStateKeys(scope, "person@example.com").attempts).toMatch(/^esut-marketplace:v1:security:/);
  });

  liveRedisTest("atomically locks an identifier and publishes a temporary retry time", async () => {
    const first = await consumeSecurityLimit({ scope, identifier, limit: 2, windowSeconds: 60, lockSeconds: 60 });
    const second = await consumeSecurityLimit({ scope, identifier, limit: 2, windowSeconds: 60, lockSeconds: 60 });
    const third = await consumeSecurityLimit({ scope, identifier, limit: 2, windowSeconds: 60, lockSeconds: 60 });
    expect(first, `Redis adapter failure class: ${securityStateStatus().failureClass ?? "none"}`).toMatchObject({ limited: false, source: "redis" });
    expect(second).toMatchObject({ limited: false, source: "redis" });
    expect(third?.limited).toBe(true);
    expect(third?.retryAt).toBeInstanceOf(Date);
    await expect(getSecurityLockout({ scope, identifier })).resolves.toBeInstanceOf(Date);
  });

  it("uses a conservative fallback signal when Redis is not configured", async () => {
    const existing = process.env.REDIS_URL;
    delete process.env.REDIS_URL;
    await expect(consumeSecurityLimit({ scope, identifier: "no-redis", limit: 1, windowSeconds: 60, lockSeconds: 60 })).resolves.toBeNull();
    process.env.REDIS_URL = existing;
  });
});
