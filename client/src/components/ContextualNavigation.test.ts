import { describe, expect, it } from "vitest";
import { contextFor } from "./ContextualNavigation";

describe("contextual navigation", () => {
  it("provides an in-app escape path for deep public and workspace routes", () => {
    expect(contextFor("/cart")).toMatchObject({ backHref: "/explore", backLabel: "Continue shopping" });
    expect(contextFor("/checkout")).toMatchObject({ backHref: "/cart", backLabel: "Back to cart" });
    expect(contextFor("/seller/products/15/edit")).toMatchObject({ backHref: "/seller/products", sectionHref: "/seller" });
    expect(contextFor("/admin/users/22")).toMatchObject({ backHref: "/admin/users", sectionHref: "/admin" });
    expect(contextFor("/account/orders/91")).toMatchObject({ backHref: "/account/orders", sectionHref: "/account" });
  });

  it("does not duplicate navigation on pages with an existing parent link or root shell", () => {
    expect(contextFor("/")).toBeNull();
    expect(contextFor("/explore")).toBeNull();
    expect(contextFor("/product/example")).toBeNull();
    expect(contextFor("/store/example")).toBeNull();
    expect(contextFor("/seller")).toBeNull();
    expect(contextFor("/admin")).toBeNull();
  });
});
