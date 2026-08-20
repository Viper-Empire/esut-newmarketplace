import { describe, expect, it } from "vitest";
import { descriptionDetails } from "./ProductPage";

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
});
