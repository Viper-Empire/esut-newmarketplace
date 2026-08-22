import { describe, expect, it } from "vitest";
import { listingImageFallbackPresentation, marketplaceLoadingSlots, marketplaceLogoPath } from "./StorefrontComponents";

describe("storefront managed visual assets", () => {
  it("uses the verified Cloudinary public WebP logo rather than the oversized legacy PNG", () => {
    expect(marketplaceLogoPath).toBe("https://res.cloudinary.com/duhbe5ilc/image/upload/v1787427596/esut-marketplace/public/brand/esut-marketplace-logo.webp");
    expect(marketplaceLogoPath).toContain("res.cloudinary.com/");
    expect(marketplaceLogoPath).not.toContain("esut-main-logo_0f99c6ab.png");
  });

  it("uses factual category metadata to distinguish missing-image presentation", () => {
    expect(listingImageFallbackPresentation({ name: "Books", slug: "books" }).label).toBe("Campus books");
    expect(listingImageFallbackPresentation({ name: "Fashion", slug: "fashion" }).label).toBe("Campus fashion");
    expect(listingImageFallbackPresentation(undefined).label).toBe("Campus listing");
  });

  it("caps marketplace loading placeholders to a practical accessible grid size", () => {
    expect(marketplaceLoadingSlots(8)).toHaveLength(8);
    expect(marketplaceLoadingSlots(0)).toHaveLength(1);
    expect(marketplaceLoadingSlots(99)).toHaveLength(12);
  });
});
