import { describe, expect, it } from "vitest";
import { canonicalCategoryRoute, legacyCategoryRoute, presentCategories, presentCategory } from "./verticalCatalog";

describe("attached vertical category presentation", () => {
  it("presents the existing category records as Food and Accommodation", () => {
    expect(presentCategory({ id: 6, name: "Food & Groceries", slug: "food" })).toMatchObject({ name: "Food", slug: "food" });
    expect(presentCategory({ id: 5, name: "Hostel & Lodge", slug: "hostel-home" })).toMatchObject({ name: "Accommodation", slug: "accommodation" });
    expect(presentCategories([{ id: 6, name: "Food & Groceries", slug: "food" }, { id: 5, name: "Hostel & Lodge", slug: "hostel-home" }]).map(category => category.name)).toEqual(["Food", "Accommodation"]);
  });

  it("routes vertical records to dedicated experiences and preserves old routes", () => {
    expect(canonicalCategoryRoute({ id: 6, slug: "food" })).toBe("/esutchop");
    expect(canonicalCategoryRoute({ id: 5, slug: "hostel-home" })).toBe("/accommodation");
    expect(legacyCategoryRoute("food")).toBe("/esutchop");
    expect(legacyCategoryRoute("hostel-home")).toBe("/accommodation");
  });
});
