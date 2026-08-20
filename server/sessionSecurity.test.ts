import { describe, expect, it } from "vitest";
import { sessionRequestMetadata } from "./sessionSecurity";

describe("session security metadata", () => {
  it("derives a coarse device label and an opaque IP fingerprint without retaining the raw address", () => {
    const metadata = sessionRequestMetadata({ headers: { "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1", "x-forwarded-for": "203.0.113.25, 10.0.0.1" }, ip: "10.0.0.1" } as any);
    expect(metadata.deviceLabel).toBe("Safari on iOS");
    expect(metadata.ipFingerprint).toBeTruthy();
    expect(metadata.ipFingerprint).not.toContain("203.0.113.25");
  });
});
