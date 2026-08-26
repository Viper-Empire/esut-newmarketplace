import { describe, expect, it } from "vitest";
import { canonicalCategoryRoute, legacyCategoryRoute, presentCategories, presentCategory } from "./verticalCatalog";

describe("attached vertical category presentation", () => {
  it("preserves existing category labels and identifiers without client-side renaming", () => {
    expect(presentCategory({ id: 6, name: "Food & Groceries", slug: "food" })).toMatchObject({ name: "Food & Groceries", slug: "food" });
    expect(presentCategory({ id: 5, name: "Hostel & Lodge", slug: "hostel-home" })).toMatchObject({ name: "Hostel & Lodge", slug: "hostel-home" });
    expect(presentCategories([{ id: 6, name: "Food & Groceries", slug: "food" }, { id: 5, name: "Hostel & Lodge", slug: "hostel-home" }]).map(category => category.name)).toEqual(["Food & Groceries", "Hostel & Lodge"]);
  });

  it("routes vertical records to dedicated experiences and preserves old routes", () => {
    expect(canonicalCategoryRoute({ id: 6, slug: "food" })).toBe("/esutchop");
    expect(canonicalCategoryRoute({ id: 5, slug: "hostel-home" })).toBe("/accommodation");
    expect(legacyCategoryRoute("food")).toBe("/esutchop");
    expect(legacyCategoryRoute("hostel-home")).toBe("/accommodation");
  });
});
