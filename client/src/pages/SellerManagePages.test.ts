import { describe, expect, it } from "vitest";
import { filterSellerListings } from "./SellerManagePages";

const rows = [
  { listing: { status: "ACTIVE" } },
  { listing: { status: "DRAFT" } },
  { listing: { status: "PAUSED" } },
  { listing: { status: "FLAGGED" } },
  { listing: { status: "ARCHIVED" } },
];

describe("seller listing manager filters", () => {
  it("groups seller-owned listing lifecycle states for useful dashboard actions", () => {
    expect(filterSellerListings(rows, "ALL")).toHaveLength(5);
    expect(filterSellerListings(rows, "LIVE")).toHaveLength(1);
    expect(filterSellerListings(rows, "DRAFTS")).toHaveLength(2);
    expect(filterSellerListings(rows, "ATTENTION")).toHaveLength(1);
    expect(filterSellerListings(rows, "ARCHIVED")).toHaveLength(1);
  });
});
