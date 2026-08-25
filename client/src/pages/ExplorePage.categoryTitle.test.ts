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


describe("marketplace price filters", () => {
  it("converts valid Naira input to integer kobo without accepting empty values", async () => {
    const { parseNairaToKobo } = await import("./ExplorePage");
    expect(parseNairaToKobo("1,200")).toBeUndefined();
    expect(parseNairaToKobo("1200.50")).toBe(120050);
    expect(parseNairaToKobo("0", true)).toBe(0);
    expect(parseNairaToKobo("", true)).toBeUndefined();
  });

  it("rejects non-finite or negative price input", async () => {
    const { parseNairaToKobo } = await import("./ExplorePage");
    expect(parseNairaToKobo("abc", true)).toBeUndefined();
    expect(parseNairaToKobo("-5", true)).toBeUndefined();
    expect(parseNairaToKobo("0")).toBeUndefined();
  });
});


describe("marketplace price-input safety", () => {
  it("treats invalid non-empty values as invalid instead of silently omitting them", async () => {
    const { parseNairaToKobo } = await import("./ExplorePage");
    expect(parseNairaToKobo("not-a-price", true)).toBeUndefined();
    expect(parseNairaToKobo("0")).toBeUndefined();
    expect(parseNairaToKobo("2500", true)).toBe(250000);
  });
});
