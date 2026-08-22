import { describe, expect, it } from "vitest";
import { assessSellerListingDeletion } from "./listingDeletion";

describe("seller listing deletion policy", () => {
  const clean = { orders: false, reviews: false, offers: false, conversations: false };

  it("permits only clean draft or archived listings to be deleted", () => {
    expect(assessSellerListingDeletion("DRAFT", clean).allowed).toBe(true);
    expect(assessSellerListingDeletion("ARCHIVED", clean).allowed).toBe(true);
    expect(assessSellerListingDeletion("ACTIVE", clean)).toMatchObject({ allowed: false });
  });

  it("retains listings with protected marketplace activity", () => {
    expect(assessSellerListingDeletion("ARCHIVED", { ...clean, orders: true })).toMatchObject({ allowed: false });
    expect(assessSellerListingDeletion("DRAFT", { ...clean, conversations: true })).toMatchObject({ allowed: false });
  });
});
