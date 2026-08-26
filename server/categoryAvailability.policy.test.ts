import { describe, expect, it } from "vitest";
import { canonicalCategorySlug, getCategoryAvailability, getComingSoonCategory, isPubliclyDiscoverableCategory } from "../shared/categoryAvailability";

describe("final marketplace category availability policy", () => {
  it("keeps the six approved marketplace categories active", () => {
    for (const category of [
      { id: 1, slug: "electronics" },
      { id: 3, slug: "phones" },
      { id: 8, slug: "computing" },
      { id: 2, slug: "fashion" },
      { id: 4, slug: "beauty-personal-care" },
      { id: 7, slug: "services" },
    ]) {
      expect(getCategoryAvailability(category)).toBe("ACTIVE");
      expect(isPubliclyDiscoverableCategory(category)).toBe(true);
    }
  });

  it("marks Food, digital academic resources, and accommodation coming soon by stable identifier and compatible slug", () => {
    expect(getCategoryAvailability({ id: 6, slug: "food" })).toBe("COMING_SOON");
    expect(getCategoryAvailability({ id: 30001, slug: "digital-books-courses" })).toBe("COMING_SOON");
    expect(getCategoryAvailability({ id: 5, slug: "accommodation" })).toBe("COMING_SOON");
    expect(getComingSoonCategory({ slug: "books-academic" })?.id).toBe(30001);
    expect(canonicalCategorySlug("hostel-home")).toBe("accommodation");
    expect(isPubliclyDiscoverableCategory({ id: 30001 })).toBe(false);
  });

  it("inherits the parent availability for approved child categories", () => {
    expect(getCategoryAvailability({ id: 9001, parentId: 6, slug: "esut-chop" })).toBe("COMING_SOON");
    expect(getCategoryAvailability({ id: 9002, parentId: 30001, slug: "digital-academic-resources" })).toBe("COMING_SOON");
    expect(getCategoryAvailability({ id: 9003, parentId: 5, slug: "esut-accommodation" })).toBe("COMING_SOON");
    expect(isPubliclyDiscoverableCategory({ id: 9010, parentId: 3, slug: "smartphones" })).toBe(true);
  });
});
