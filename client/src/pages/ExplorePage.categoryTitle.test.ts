import { describe, expect, it } from "vitest";
import { formatCategoryTitle } from "./ExplorePage";

describe("category page titles", () => {
  const categories = [
    { slug: "beauty-personal-care", name: "Beauty & Personal Care" },
    { slug: "digital-books-courses", name: "Digital Books & Courses" },
  ];

  it("renders the exact server category name when available", () => {
    expect(formatCategoryTitle("beauty-personal-care", categories)).toBe("Beauty & Personal Care listings");
    expect(formatCategoryTitle("digital-books-courses", categories)).toBe("Digital Books & Courses listings");
  });

  it("keeps a readable fallback while category metadata is loading", () => {
    expect(formatCategoryTitle("digital-books-courses", undefined)).toBe("digital books courses listings");
    expect(formatCategoryTitle(undefined, categories)).toBe("Find your next campus essential");
  });
});
