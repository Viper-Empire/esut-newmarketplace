import { describe, expect, it } from "vitest";
import { ESUT_MARKETPLACE_LOGO_PATH } from "./brandAssets";

describe("ESUT Marketplace brand assets", () => {
  it("uses the optimized managed WebP logo for every application surface", () => {
    expect(ESUT_MARKETPLACE_LOGO_PATH).toBe("/manus-storage/esut-marketplace-logo-256_3619a6d3.webp");
    expect(ESUT_MARKETPLACE_LOGO_PATH).not.toContain("esut-main-logo_0f99c6ab.png");
  });
});
