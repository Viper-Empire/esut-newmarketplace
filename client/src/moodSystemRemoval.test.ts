import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("mood-system removal", () => {
  it("keeps the original ESUT appearance without preference controls or dark-mode runtime state", () => {
    const app = source("client/src/App.tsx");
    const workspace = source("client/src/components/MarketplaceWorkspaceShell.tsx");
    const adminSuite = source("client/src/pages/AdminSuitePages.tsx");
    const storefront = source("client/src/components/StorefrontComponents.tsx");
    const styles = source("client/src/index.css");
    const toaster = source("client/src/components/ui/sonner.tsx");

    expect(app).not.toContain("DarkModeProvider");
    expect(app).toContain('window.localStorage.removeItem("esut-marketplace-theme")');
    expect(workspace).not.toContain("DarkModeToggle");
    expect(adminSuite).not.toContain("DarkModeToggle");
    expect(storefront).not.toContain("DarkModeToggle");
    expect(styles).not.toContain("html.dark");
    expect(styles).not.toContain("dark-mode-toggle");
    expect(toaster).toContain('theme="light"');
    expect(existsSync(resolve(process.cwd(), "client/src/contexts/ThemeContext.tsx"))).toBe(false);
    expect(existsSync(resolve(process.cwd(), "client/src/contexts/DarkModeContext.tsx"))).toBe(false);
    expect(existsSync(resolve(process.cwd(), "client/src/components/DarkModeToggle.tsx"))).toBe(false);
  });
});
