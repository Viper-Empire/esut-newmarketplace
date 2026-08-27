import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { buyerInitials, descriptionDetails, formatReviewDate } from "./ProductPage";

describe("product detail description parsing", () => {
  it("keeps seller-authored introductory text and separates recognised labelled details", () => {
    expect(descriptionDetails("Clean phone. BATTERY HEALTH: 98% STORAGE: 256GB COLOUR: Black")).toEqual({
      intro: "Clean phone.",
      details: [
        { label: "Battery Health", value: "98%" },
        { label: "Storage", value: "256GB" },
        { label: "Colour", value: "Black" },
      ],
    });
  });

  it("retains ordinary descriptions without inventing structure", () => {
    expect(descriptionDetails("A durable backpack for lectures and hostel life.")).toEqual({ intro: "A durable backpack for lectures and hostel life.", details: [] });
  });

  it("keeps markup-looking seller text as plain description data", () => {
    const payload = '<img src=x onerror=alert(1)> campus bag';
    expect(descriptionDetails(payload)).toEqual({ intro: payload, details: [] });
  });
});

describe("verified-purchase review presentation", () => {
  it("keeps the modern review card grounded in real review and seller-response fields", () => {
    const source = readFileSync(new URL("./ProductPage.tsx", import.meta.url), "utf8");
    expect(source).toContain("Verified purchase");
    expect(source).toContain("review.comment");
    expect(source).toContain("review.sellerResponse");
    expect(source).toContain("aria-label={`${review.rating} out of 5 stars`}");
    expect(source).not.toContain("DeepCode T.");
    expect(source).not.toContain("thanks friend");
  });

  it("uses a truthful empty state when no eligible reviews exist", () => {
    const source = readFileSync(new URL("./ProductPage.tsx", import.meta.url), "utf8");
    expect(source).toContain("No verified purchase reviews yet.");
    expect(source).toContain("Reviews appear after an eligible buyer completes a purchase.");
  });
});

describe("compact review row helpers", () => {
  it("derives readable initials from the real buyer name", () => {
    expect(buyerInitials("Jude T.")).toBe("JT");
    expect(buyerInitials("Marketplace member")).toBe("MM");
    expect(buyerInitials(null)).toBe("MM");
  });

  it("formats a real review timestamp for display", () => {
    expect(formatReviewDate("2026-08-20T12:00:00.000Z")).toMatch(/Aug 20, 2026/);
  });
});
