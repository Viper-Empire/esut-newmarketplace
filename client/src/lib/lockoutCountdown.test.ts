import { describe, expect, it } from "vitest";
import { formatRetryCountdown, retryAtFromError, secondsUntilRetry } from "./lockoutCountdown";

describe("login lockout countdown helpers", () => {
  it("rounds up remaining time and never produces a negative countdown", () => {
    expect(secondsUntilRetry(10_001, 0)).toBe(11);
    expect(secondsUntilRetry(0, 10_000)).toBe(0);
    expect(secondsUntilRetry(null, 10_000)).toBe(0);
  });

  it("formats an accessible minute and second display", () => {
    expect(formatRetryCountdown(0)).toBe("0:00");
    expect(formatRetryCountdown(65)).toBe("1:05");
    expect(formatRetryCountdown(900)).toBe("15:00");
  });

  it("accepts only a future retry timestamp from structured server error data", () => {
    const future = new Date(Date.now() + 60_000).toISOString();
    expect(retryAtFromError({ data: { retryAt: future } })).toBe(Date.parse(future));
    expect(retryAtFromError({ data: { retryAt: "not-a-date" } })).toBeNull();
    expect(retryAtFromError({ data: { retryAt: new Date(Date.now() - 60_000).toISOString() } })).toBeNull();
  });
});
