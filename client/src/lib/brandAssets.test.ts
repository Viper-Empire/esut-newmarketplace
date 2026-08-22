import { describe, expect, it } from "vitest";
import { ESUT_MARKETPLACE_LOGO_PATH } from "./brandAssets";

describe("ESUT Marketplace brand assets", () => {
  it("uses the verified Cloudinary public WebP logo for every application surface", () => {
    expect(ESUT_MARKETPLACE_LOGO_PATH).toBe("https://res.cloudinary.com/duhbe5ilc/image/upload/v1787427596/esut-marketplace/public/brand/esut-marketplace-logo.webp");
    expect(ESUT_MARKETPLACE_LOGO_PATH).toContain("res.cloudinary.com/");
    expect(ESUT_MARKETPLACE_LOGO_PATH).not.toContain("esut-main-logo_0f99c6ab.png");
  });
});
