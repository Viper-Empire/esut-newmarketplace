import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = fs.readFileSync(path.join(process.cwd(), "client/src/components/AdminControlCenterNav.tsx"), "utf8");

describe("general administration control-center navigation", () => {
  it("groups the real management workspaces into one general control center", () => {
    expect(source).toContain('label: "Command center"');
    expect(source).toContain('label: "Marketplace management"');
    expect(source).toContain('label: "Trust & safety"');
    expect(source).toContain('label: "System control"');
    expect(source).toContain('href: "/admin/listings"');
    expect(source).toContain('href: "/admin/audit-logs"');
  });

  it("shows only for an authenticated administrator and reserves staff roles for super administrators", () => {
    expect(source).toContain('!["ADMIN", "SUPER_ADMIN"].includes(user?.role ?? "")');
    expect(source).toContain('superAdmin: true');
    expect(source).toContain('user?.role === "SUPER_ADMIN"');
    expect(source).not.toContain('href: "/cart"');
    expect(source).not.toContain('href: "/sell"');
  });
});
