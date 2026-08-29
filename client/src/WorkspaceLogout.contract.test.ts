import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const read = (relativePath: string) =>
  fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf8");

describe("workspace logout affordances", () => {
  it("keeps buyer and seller logout visible in the shared header and mobile menu", () => {
    const source = read("client/src/components/MarketplaceWorkspaceShell.tsx");
    expect(source).toContain('aria-label="Log out of your account"');
    expect(source).toContain('onClick={() => void handleLogout()}');
    expect(source).toContain('disabled={isLoggingOut}');
    expect(source).toContain('isLoggingOut ? "Signing out…" : "Log out"');
    expect(source).toContain('onLogout?: () => Promise<void> | void;');
  });

  it("keeps administrator logout visible in desktop and mobile control-center bars", () => {
    const source = read("client/src/components/AdminControlCenterNav.tsx");
    expect(source).toContain('aria-label="Log out of the administrator control center"');
    expect(source).toContain('disabled={loggingOut}');
    expect(source).toContain('await logout();');
    expect(source).toContain('navigate("/");');
  });

  it("makes Security & devices data actionable and refreshable", () => {
    const page = read("client/src/pages/AccountSecurityPage.tsx");
    const router = read("server/routers.ts");
    const service = read("server/sessionSecurity.ts");
    expect(page).toContain('aria-label="Refresh security information"');
    expect(page).toContain("Active sessions <span");
    expect(page).toContain('aria-label={`Sign out ${session.deviceLabel || "this device"}`}');
    expect(page).toContain('trpc.auth.revokeSession.useMutation');
    expect(router).toContain('revokeSession: protectedProcedure.input(z.object({ sessionId: z.number().int().positive() }))');
    expect(service).toContain("revokeTrackedSessionById");
    expect(service).toContain('row.sessionHash === hashOpaqueToken(currentSessionId)');
  });
});
