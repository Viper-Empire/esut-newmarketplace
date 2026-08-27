import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = fs.readFileSync(path.join(process.cwd(), "client/src/components/MainCategoryMenu.tsx"), "utf8");

describe("ESUT Main Category Menu", () => {
  it("uses the icon-led progressive-disclosure menu pattern", () => {
    expect(source).toContain('aria-label="Main category menu"');
    expect(source).toContain('aria-label={selectedParent ? `${selectedParent.name} sub-categories` : "Active marketplace categories"}');
    expect(source).toContain("selectedParent");
    expect(source).toContain("All categories");
    expect(source).toContain("View ${category.name} sub-categories");
  });

  it("filters all Coming Soon parents and children from navigation", () => {
    expect(source).toContain('category.availability !== "COMING_SOON"');
    expect(source).toContain("activeCategories(categories)");
    expect(source).toContain("activeCategories(selectedParent.children ?? [])");
    expect(source).not.toContain('label: "Food"');
    expect(source).not.toContain('label: "Books & Academic"');
    expect(source).not.toContain('label: "Hostel & Lodge"');
  });
});
