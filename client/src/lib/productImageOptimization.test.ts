import { describe, expect, it } from "vitest";
import { optimizedProductImageFilename, PRODUCT_IMAGE_MAX_EDGE, shouldOptimizeProductImage } from "./productImageOptimization";

describe("product image optimization policy", () => {
  it("preserves already-efficient, normal-sized seller images without recompression", () => {
    expect(shouldOptimizeProductImage({ size: 680_000, width: 1600, height: 1200 })).toBe(false);
  });

  it("optimizes only oversized or oversized-dimension product photos without cropping", () => {
    expect(shouldOptimizeProductImage({ size: 1_250_001, width: 1600, height: 1200 })).toBe(true);
    expect(shouldOptimizeProductImage({ size: 680_000, width: PRODUCT_IMAGE_MAX_EDGE + 1, height: 1200 })).toBe(true);
  });

  it("normalizes delivery filenames to a safe WebP extension", () => {
    expect(optimizedProductImageFilename("Campus bag (new).PNG")).toBe("Campus_bag__new_.webp");
  });
});
