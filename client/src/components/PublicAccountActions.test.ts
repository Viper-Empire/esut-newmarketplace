import { describe, expect, it } from "vitest";
import { shouldShowPublicAccountActions } from "./PublicAccountActions";

describe("public account actions", () => {
  it("shows account actions to signed-out users on storefront routes", () => {
    expect(shouldShowPublicAccountActions("/", false, false)).toBe(true);
    expect(shouldShowPublicAccountActions("/explore", false, false)).toBe(true);
    expect(shouldShowPublicAccountActions("/product/wireless-study-headphones", false, false)).toBe(true);
  });
  it("hides account actions during loading, for signed-in users, and on private routes", () => {
    expect(shouldShowPublicAccountActions("/", true, false)).toBe(false);
    expect(shouldShowPublicAccountActions("/", false, true)).toBe(false);
    expect(shouldShowPublicAccountActions("/account", false, false)).toBe(false);
  });
});
