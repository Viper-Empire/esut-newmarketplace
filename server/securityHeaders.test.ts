import { describe, expect, it } from "vitest";
import { applySecurityHeaders } from "./_core/securityHeaders";

describe("security headers", () => {
  it("sets safe baseline headers and HSTS behind forwarded HTTPS", () => {
    const headers = new Map<string, string>();
    applySecurityHeaders({ headers: { "x-forwarded-proto": "https" } }, { setHeader: (name, value) => headers.set(name, value) });

    expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(headers.get("Permissions-Policy")).toContain("camera=()");
    expect(headers.get("Content-Security-Policy")).toBe("frame-ancestors 'none'");
    expect(headers.get("Strict-Transport-Security")).toContain("max-age=15552000");
    expect(headers.has("Access-Control-Allow-Origin")).toBe(false);
  });

  it("does not advertise HSTS over an unencrypted local request", () => {
    const headers = new Map<string, string>();
    applySecurityHeaders({ headers: {} }, { setHeader: (name, value) => headers.set(name, value) });

    expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(headers.has("Strict-Transport-Security")).toBe(false);
  });
});
