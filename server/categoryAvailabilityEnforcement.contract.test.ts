import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");
const routerSource = readFileSync(resolve(root, "server/routers.ts"), "utf8");
const exploreSource = readFileSync(resolve(root, "client/src/pages/ExplorePage.tsx"), "utf8");
const sellerSource = readFileSync(resolve(root, "client/src/pages/SellerManagePages.tsx"), "utf8");

describe("coming soon category enforcement contract", () => {
  it("short-circuits a requested coming soon category before public marketplace search builds its inventory query", () => {
    const searchStart = routerSource.indexOf("search: publicProcedure");
    const searchEnd = routerSource.indexOf("suggestions: publicProcedure");
    const search = routerSource.slice(searchStart, searchEnd);
    expect(search).toContain("getComingSoonCategory({ slug: input.categorySlug })");
    expect(search.indexOf("getComingSoonCategory({ slug: input.categorySlug })")).toBeLessThan(search.indexOf("const db = await ensureDb()"));
    expect(search).toContain("comingSoon: requestedComingSoonCategory");
    expect(search).toContain("publicListingCategoryCondition()");
  });

  it("applies the public active-category invariant to discovery, product, storefront, alerts, offers, and carts", () => {
    expect(routerSource.match(/publicListingCategoryCondition\(\)/g)?.length).toBeGreaterThanOrEqual(8);
    expect(routerSource).toContain("const publicListingCategoryCondition = (withCategoryJoin = true)");
    expect(routerSource).toContain("publicListingCategoryCondition(false), eq(listings.categoryId, rows[0].listing.categoryId)");
    expect(routerSource).toContain("innerJoin(categories, eq(listings.categoryId, categories.id)).where(and(eq(listings.status, \"ACTIVE\"), eq(stores.status, \"ACTIVE\"), publicListingCategoryCondition(), or(like(listings.title, phrase)");
    expect(routerSource).toContain("!isPubliclyDiscoverableCategory(row.category)");
    expect(routerSource).toContain("This category is coming soon and is not currently available for marketplace listings.");
  });

  it("keeps the dedicated Coming Soon view distinct from no-results and disables seller category selection", () => {
    expect(exploreSource).toContain("Coming Soon");
    expect(exploreSource).toContain("Browse available categories");
    expect(exploreSource).toContain("enabled: !priceRangeError && !comingSoon");
    expect(sellerSource).toContain('disabled={category.availability === "COMING_SOON"}');
    expect(sellerSource).toContain("not open for new listing publication");
  });
});
