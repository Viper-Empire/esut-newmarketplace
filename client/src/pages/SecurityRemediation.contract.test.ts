import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = (relativePath: string) => readFileSync(new URL(`./${relativePath}`, import.meta.url), "utf8");
const rootSource = (relativePath: string) => readFileSync(new URL(`../../../${relativePath}`, import.meta.url), "utf8");

describe("security remediation contracts", () => {
  it("renders one store catalogue section after the duplicate fix", () => {
    const storePage = source("StorePage.tsx");
    expect(storePage.match(/STORE CATALOGUE/g)?.length).toBe(1);
    expect(storePage.match(/>Active listings</g)?.length).toBe(1);
  });

  it("keeps public legal and support routes registered", () => {
    const app = rootSource("client/src/App.tsx");
    const utilityPages = source("PublicUtilityPages.tsx");
    for (const route of ["/terms", "/privacy", "/support", "/contact"]) expect(app).toContain(`path=\"${route}\"`);
    expect(utilityPages).toContain("Last updated:");
    expect(utilityPages).toContain("Owner review required");
    expect(source("AuthPage.tsx")).toContain('href="/terms"');
    expect(source("AuthPage.tsx")).toContain('href="/privacy"');
    expect(rootSource("client/src/components/StorefrontComponents.tsx")).toContain('href="/support"');
    expect(rootSource("client/src/components/StorefrontComponents.tsx")).toContain('href="/contact"');
  });

  it("removes the stale admin moderation banner while retaining protected admin routing", () => {
    const adminPage = source("AdminPage.tsx");
    const app = rootSource("client/src/App.tsx");
    expect(adminPage).not.toContain("retained legacy evidence queue");
    expect(adminPage).not.toContain("PRODUCT MODERATION");
    expect(app).toContain('path="/admin/listings"');
  });

  it("renders unavailable product and store states without retry loops", () => {
    const product = source("ProductPage.tsx");
    const store = source("StorePage.tsx");
    expect(product).toContain("retry: false");
    expect(product).toContain('product.error?.data?.code === "NOT_FOUND"');
    expect(product).toContain("This listing is unavailable");
    expect(store).toContain("retry: false");
    expect(store).toContain('storeQuery.error?.data?.code === "NOT_FOUND"');
    expect(store).toContain("Store unavailable");
  });

  it("hydrates URL price filters and surfaces contradictory ranges", () => {
    const explore = source("ExplorePage.tsx");
    expect(explore).toContain('params.get("min") ?? ""');
    expect(explore).toContain('params.get("max") ?? ""');
    expect(explore).toContain("maxKobo < minKobo");
    expect(explore).toContain("Clear price range");
  });

  it("keeps marketplace user content on React text-rendering paths", () => {
    for (const page of ["ExplorePage.tsx", "ProductPage.tsx", "StorePage.tsx", "AccountFeaturePages.tsx", "MarketplaceMessagesPage.tsx"]) {
      expect(source(page)).not.toContain("dangerouslySetInnerHTML");
    }
    expect(rootSource("server/_core/trpc.ts")).toContain("adminProcedure");
    expect(source("NotFound.tsx")).not.toContain("dark:");
  });

  it("keeps checkout and buyer order writes scoped and idempotent", () => {
    const router = rootSource("server/routers.ts");
    expect(router).toContain('idempotencyKey: z.string().uuid()');
    expect(router).toContain("eq(cartItems.cartId, cart.id)");
    expect(router).toContain("eq(orders.buyerUserId, ctx.user.id)");
    expect(router).toContain("affectedRows(reserved)");
    expect(router).toContain("pickupCodeCiphertext: encryptPickupCode(pickupCode)");
  });

  it("keeps crawler controls limited to public routes", () => {
    const robots = rootSource("client/public/robots.txt");
    const sitemap = rootSource("client/public/sitemap.xml");
    expect(robots).toContain("Disallow: /admin");
    expect(robots).toContain("Disallow: /checkout");
    expect(sitemap).toContain("/terms</loc>");
    expect(sitemap).not.toContain("/account");
    expect(sitemap).not.toContain("/admin");
  });
});
