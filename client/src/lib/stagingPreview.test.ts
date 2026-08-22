import { describe, expect, it } from "vitest";
import { isCloudflareStagingPreview } from "./stagingPreview";

describe("Cloudflare staging preview detection", () => {
  it("matches both the stable alias and unique staging previews without matching production hosts", () => {
    expect(isCloudflareStagingPreview("staging.esut-marketplace-staging.pages.dev")).toBe(true);
    expect(isCloudflareStagingPreview("dc45f5b7.esut-marketplace-staging.pages.dev")).toBe(true);
    expect(isCloudflareStagingPreview("esutshop-59wzg8bs.manus.space")).toBe(false);
  });
});
