import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { applySecurityHeaders } from "./_core/securityHeaders";

describe("security headers", () => {
  it("keeps runtime fingerprinting disabled and RPC responses uncached", () => {
    const entrypoint = readFileSync(new URL("./_core/index.ts", import.meta.url), "utf8");
    expect(entrypoint).toContain('app.disable("x-powered-by")');
    expect(entrypoint).toContain('res.setHeader("Cache-Control", "no-store")');
    expect(entrypoint).toContain('app.use("/api/oauth"');
  });
  it("sets safe baseline headers and HSTS behind forwarded HTTPS", () => {
    const headers = new Map<string, string>();
    applySecurityHeaders({ headers: { "x-forwarded-proto": "https" } }, { setHeader: (name, value) => headers.set(name, value) });

    expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(headers.get("Permissions-Policy")).toContain("camera=()");
    expect(headers.get("X-Frame-Options")).toBe("DENY");
    expect(headers.get("Content-Security-Policy")).toContain("default-src 'self'");
    expect(headers.get("Content-Security-Policy")).toContain("object-src 'none'");
    expect(headers.get("Content-Security-Policy")).toContain("base-uri 'self'");
    expect(headers.get("Content-Security-Policy")).toContain("frame-ancestors 'none'");
    expect(headers.get("Strict-Transport-Security")).toBe("max-age=31536000");
    expect(headers.get("Strict-Transport-Security")).not.toContain("includeSubDomains");
    expect(headers.has("Access-Control-Allow-Origin")).toBe(false);
  });

  it("does not advertise HSTS over an unencrypted local request", () => {
    const headers = new Map<string, string>();
    applySecurityHeaders({ headers: {} }, { setHeader: (name, value) => headers.set(name, value) });

    expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(headers.has("Strict-Transport-Security")).toBe(false);
  });
});
