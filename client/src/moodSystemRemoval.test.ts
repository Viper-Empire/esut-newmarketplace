import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("controlled dark-mode system", () => {
  it("uses one explicit readable preference instead of the former multi-option mood controls", () => {
    const app = source("client/src/App.tsx");
    const workspace = source("client/src/components/MarketplaceWorkspaceShell.tsx");
    const storefront = source("client/src/components/StorefrontComponents.tsx");
    const toggle = source("client/src/components/DarkModeToggle.tsx");
    const context = source("client/src/contexts/DarkModeContext.tsx");
    const styles = source("client/src/index.css");
    const toaster = source("client/src/components/ui/sonner.tsx");

    expect(app).toContain("DarkModeProvider");
    expect(workspace).toContain("DarkModeToggle");
    expect(storefront).toContain("DarkModeToggle");
    expect(toggle).toContain("Switch to dark mode");
    expect(toggle).toContain("Switch to light mode");
    expect(context).toContain('"esut-marketplace-theme"');
    expect(styles).toContain("html.dark body");
    expect(styles).toContain("--dark-bg:#21160f");
    expect(styles).toContain("--dark-orange:#c45b29");
    expect(styles).toContain("--dark-gold:#b89235");
    expect(styles).toContain("html.dark .hero-art{background:linear-gradient(145deg,#a9471d 0%,#86461f 48%,#5f571f 100%)}");
    expect(styles).toContain("dark-mode-toggle");
    expect(toaster).toContain('theme={isDark ? "dark" : "light"}');
    expect(existsSync(resolve(process.cwd(), "client/src/contexts/ThemeContext.tsx"))).toBe(false);
    expect(existsSync(resolve(process.cwd(), "client/src/components/ThemePreferenceSelect.tsx"))).toBe(false);
  });
});
