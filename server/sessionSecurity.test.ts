import { describe, expect, it } from "vitest";
import { sessionMetadataNeedsRefresh, sessionRequestMetadata } from "./sessionSecurity";

describe("session security metadata", () => {
  it("derives a coarse device label and an opaque IP fingerprint without retaining the raw address", () => {
    const metadata = sessionRequestMetadata({ headers: { "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1", "x-forwarded-for": "203.0.113.25, 10.0.0.1" }, ip: "10.0.0.1" } as any);
    expect(metadata.deviceLabel).toBe("Safari on iOS");
    expect(metadata.ipFingerprint).toBeTruthy();
    expect(metadata.ipFingerprint).not.toContain("203.0.113.25");
  });

  it("detects when an existing generic device record must be refreshed from the real request", () => {
    const next = sessionRequestMetadata({ headers: { "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0", "x-forwarded-for": "203.0.113.40" }, ip: "10.0.0.2" } as any);
    expect(sessionMetadataNeedsRefresh({ deviceLabel: "Unknown browser on Unknown OS", browserFamily: "Unknown browser", osFamily: "Unknown OS", ipFingerprint: null }, next)).toBe(true);
    expect(sessionMetadataNeedsRefresh(next, next)).toBe(false);
  });
});
