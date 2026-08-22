import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const routerSource = readFileSync(fileURLToPath(new URL("./routers.ts", import.meta.url)), "utf8");
const panelSource = readFileSync(fileURLToPath(new URL("../client/src/components/AdminPasswordResetPanel.tsx", import.meta.url)), "utf8");

describe("super-administrator password replacement contract", () => {
  it("uses a SUPER_ADMIN-only mutation with fresh administrator credential confirmation", () => {
    expect(routerSource).toContain("resetUserPassword: superAdminProcedure.input");
    expect(routerSource).toContain("adminCurrentPassword");
    expect(routerSource).toContain("verifyPassword(input.adminCurrentPassword, actor.passwordHash)");
    expect(routerSource).toContain("New-password confirmation does not match.");
  });

  it("replaces only the stored hash, clears durable lockout state, and revokes target sessions", () => {
    expect(routerSource).toContain("const newPasswordHash = await hashPassword(input.newPassword)");
    expect(routerSource).toContain("failedLoginCount: 0, lockedUntil: null");
    expect(routerSource).toContain("status: \"REVOKED\"");
    expect(routerSource).toContain("revokeReason: \"SUPER_ADMIN_PASSWORD_RESET\"");
    expect(routerSource).toContain("clearSecurityLimit({ scope: \"login:account\", identifier: result.email })");
  });

  it("retains a privacy-safe target security record and immutable administrator audit record without password fields", () => {
    expect(routerSource).toContain("eventType: \"PASSWORD_CHANGED\"");
    expect(routerSource).toContain("action: \"SUPER_ADMIN_PASSWORD_RESET\"");
    expect(routerSource).toContain("initiatedBySuperAdmin: true");
    expect(routerSource).not.toContain("password: input.newPassword");
  });

  it("keeps the browser control SUPER_ADMIN-only and warns that the old password is never revealed", () => {
    expect(panelSource).toContain('user?.role !== "SUPER_ADMIN"');
    expect(panelSource).toContain("it never reveals the existing password");
    expect(panelSource).toContain("Replace password & revoke sessions");
  });
});
