import { describe, expect, it } from "vitest";
import { getSessionCookieOptions } from "./_core/cookies";

function request(protocol: string, forwardedProto?: string) {
  return {
    protocol,
    headers: forwardedProto ? { "x-forwarded-proto": forwardedProto } : {},
  } as any;
}

describe("session security hardening", () => {
  it("requires Secure and permits cross-site cookie behavior behind HTTPS proxies", () => {
    const options = getSessionCookieOptions(request("http", "https"));
    expect(options.secure).toBe(true);
    expect(options.sameSite).toBe("none");
    expect(options.httpOnly).toBe(true);
  });

  it("uses a local-development-safe cookie policy without HTTPS", () => {
    const options = getSessionCookieOptions(request("http"));
    expect(options.secure).toBe(false);
    expect(options.sameSite).toBe("lax");
    expect(options.httpOnly).toBe(true);
  });
});
