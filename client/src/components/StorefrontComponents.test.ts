import { readFileSync } from "node:fs";
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

  it("keeps administrator storefront navigation control-only", () => {
    const componentSource = readFileSync(new URL("./StorefrontComponents.tsx", import.meta.url), "utf8");
    expect(componentSource).toContain('const isControlPlane = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";');
    expect(componentSource).toContain('Control center');
    expect(componentSource).toContain('{!isControlPlane && <Link href="/cart"');
    expect(componentSource).toContain('{!isControlPlane && <Link href="/sell"');
    expect(componentSource).toContain('aria-label="Open cart"');
    expect(componentSource).not.toContain('aria-label="Open navigation"');
  });

  it("keeps product-card content on a stable vertical rhythm", () => {
    const componentSource = readFileSync(new URL("./StorefrontComponents.tsx", import.meta.url), "utf8");
    const stylesheetSource = readFileSync(new URL("../index.css", import.meta.url), "utf8");
    expect(componentSource).toContain('min-h-7 items-end');
    expect(componentSource).toContain('h-10 line-clamp-2');
    expect(componentSource).toContain('min-h-5 items-center');
    expect(componentSource).toContain('mt-auto w-full');
    expect(stylesheetSource).toContain('.product-card{display:flex;min-width:0;height:100%;flex-direction:column;');
  });
});
