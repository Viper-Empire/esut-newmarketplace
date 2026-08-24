import { describe, expect, it } from "vitest";
import { presentCategory, storageCategorySlug } from "./routers";

describe("persistent vertical category migration contract", () => {
  it("presents the migrated Food and Accommodation rows without mutating other fields", () => {
    const accommodation = presentCategory({ id: 5, name: "Accommodation", slug: "accommodation", sortOrder: 4 });
    const food = presentCategory({ id: 6, name: "Food", slug: "food", sortOrder: 5 });
    expect(accommodation).toEqual({ id: 5, name: "Accommodation", slug: "accommodation", sortOrder: 4 });
    expect(food).toEqual({ id: 6, name: "Food", slug: "food", sortOrder: 5 });
  });

  it("normalizes only the legacy hostel slug", () => {
    expect(storageCategorySlug("accommodation")).toBe("accommodation");
    expect(storageCategorySlug("food")).toBe("food");
    expect(storageCategorySlug("hostel-home")).toBe("accommodation");
  });
});
