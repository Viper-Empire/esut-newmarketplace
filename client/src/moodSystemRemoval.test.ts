import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("mood-system removal", () => {
  it("keeps the original ESUT appearance without preference controls or dark-mode runtime state", () => {
    const app = source("client/src/App.tsx");
    const workspace = source("client/src/components/MarketplaceWorkspaceShell.tsx");
    const settings = source("client/src/pages/AccountFeaturePages.tsx");
    const styles = source("client/src/index.css");
    const toaster = source("client/src/components/ui/sonner.tsx");

    expect(app).not.toContain("ThemeProvider");
    expect(app).toContain('window.localStorage.removeItem("esut-marketplace-theme")');
    expect(workspace).not.toContain("ThemePreferenceSelect");
    expect(settings).not.toContain("ThemePreferenceSelect");
    expect(styles).not.toContain(".dark{");
    expect(toaster).toContain('theme="light"');
    expect(existsSync(resolve(process.cwd(), "client/src/contexts/ThemeContext.tsx"))).toBe(false);
    expect(existsSync(resolve(process.cwd(), "client/src/components/ThemePreferenceSelect.tsx"))).toBe(false);
  });
});
