import { describe, expect, it } from "vitest";
import { marketplaceLogoPath } from "./StorefrontComponents";

describe("storefront managed visual assets", () => {
  it("uses the lightweight managed WebP logo rather than the oversized legacy PNG", () => {
    expect(marketplaceLogoPath).toBe("/manus-storage/esut-marketplace-logo-256_3619a6d3.webp");
    expect(marketplaceLogoPath).not.toContain("esut-main-logo_0f99c6ab.png");
  });
});
