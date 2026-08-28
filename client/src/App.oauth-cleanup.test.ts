import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const appSource = readFileSync(resolve(process.cwd(), "client/src/App.tsx"), "utf8");

describe("OAuth callback URL cleanup", () => {
  it("removes callback parameters from non-callback SPA routes with history replacement", () => {
    expect(appSource).toContain("useLayoutEffect");
    expect(appSource).toContain('const callbackKeys = ["code", "state", "error", "error_description", "error_uri", "iss"]');
    expect(appSource).toContain("window.history.replaceState");
    expect(appSource).toContain('url.pathname.startsWith("/api/oauth/")');
  });

  it("does not replace the server callback contract", () => {
    const oauthSource = readFileSync(resolve(process.cwd(), "server/_core/oauth.ts"), "utf8");
    expect(oauthSource).toContain('app.get("/api/oauth/callback"');
    expect(oauthSource).toContain("decodeOAuthState(state)");
    expect(oauthSource).toContain("sdk.exchangeCodeForToken(code, state)");
    expect(oauthSource).toContain('res.redirect(302, "/")');
  });
});
