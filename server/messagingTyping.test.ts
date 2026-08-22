import { describe, expect, it } from "vitest";
import { TYPING_SIGNAL_TTL_MS, typingSignalExpiry, typingSignalIsActive } from "./messagingTyping";

describe("message typing signal policy", () => {
  it("expires a typing signal after the short allowed window", () => {
    const now = new Date("2026-08-22T09:30:00.000Z");
    const expiry = typingSignalExpiry(now);
    expect(expiry.getTime() - now.getTime()).toBe(TYPING_SIGNAL_TTL_MS);
    expect(typingSignalIsActive(expiry, new Date(now.getTime() + TYPING_SIGNAL_TTL_MS - 1))).toBe(true);
    expect(typingSignalIsActive(expiry, new Date(now.getTime() + TYPING_SIGNAL_TTL_MS))).toBe(false);
  });
});
