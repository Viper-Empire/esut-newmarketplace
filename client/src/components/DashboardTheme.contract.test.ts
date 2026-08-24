import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const workspaceSource = fs.readFileSync(path.join(process.cwd(), "client/src/components/MarketplaceWorkspaceShell.tsx"), "utf8");
const adminSuiteSource = fs.readFileSync(path.join(process.cwd(), "client/src/pages/AdminSuitePages.tsx"), "utf8");
const adminOverviewSource = fs.readFileSync(path.join(process.cwd(), "client/src/pages/AdminPage.tsx"), "utf8");
const stylesheetSource = fs.readFileSync(path.join(process.cwd(), "client/src/index.css"), "utf8");

describe("ESUT dashboard visual system", () => {
  it("applies the green workspace shell with ESUT red active navigation", () => {
    expect(workspaceSource).toContain("dashboard-surface");
    expect(workspaceSource).toContain("dashboard-sidebar");
    expect(workspaceSource).toContain('active ? "bg-[#e31b23] text-white shadow-sm"');
    expect(workspaceSource).toContain('bg-[#006b32] p-3 shadow-2xl');
  });

  it("applies the same scoped surface to administrator overview and subpages", () => {
    expect(adminOverviewSource).toContain("dashboard-admin-surface");
    expect(adminSuiteSource).toContain("dashboard-admin-surface");
    expect(adminSuiteSource).toContain('location === href ? "bg-[#00843d] text-white shadow-sm"');
  });

  it("keeps dashboard styling scoped and uses the controlled dark-mode hook", () => {
    expect(stylesheetSource).toContain(".dashboard-surface");
    expect(stylesheetSource).toContain(".dashboard-admin-surface");
    expect(stylesheetSource).toContain("html.dark .dashboard-surface");
    expect(stylesheetSource).toContain(".dark-mode-toggle");
    expect(workspaceSource).toContain("DarkModeToggle");
    expect(adminSuiteSource).toContain("DarkModeToggle");
    expect(stylesheetSource).not.toContain("ThemePreferenceSelect");
  });
});
