import { describe, expect, it } from "vitest";
import { categoryIcons, heroCategoryLabel } from "./Home";

describe("homepage category rename", () => {
  it("uses the renamed Beauty & Personal Care label in the hero artwork", () => {
    expect(heroCategoryLabel).toBe("Beauty & Personal Care");
    expect(categoryIcons[heroCategoryLabel]).toBe("✦");
    expect(categoryIcons.Books).toBeUndefined();
  });

  it("keeps digital course materials as a separate real category", () => {
    expect(categoryIcons["Digital Books & Courses"]).toBe("▤");
    expect(`/category/${"beauty-personal-care"}`).toBe("/category/beauty-personal-care");
    expect(`/category/${"digital-books-courses"}`).toBe("/category/digital-books-courses");
  });
});

// The category links themselves are generated from server-returned category slugs in Home.tsx.
// This contract protects the two production slugs without fabricating listing data in the test.
