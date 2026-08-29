import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(
  path.resolve(process.cwd(), "client/src/components/StorefrontComponents.tsx"),
  "utf8",
);

describe("public mobile header menu removal", () => {
  it("removes the problematic hamburger trigger and drawer without removing essential mobile navigation", () => {
    expect(source).not.toContain('aria-label="Open navigation"');
    expect(source).not.toContain("mobileOpen");
    expect(source).not.toContain("<Menu");
    expect(source).not.toContain("<X");
    expect(source).toContain('aria-label="Open cart"');
    expect(source).toContain("<MainCategoryMenu categories={categories}/>");
    expect(source).toContain('href="/explore"');
  });
});
