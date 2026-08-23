import { describe, expect, it } from "vitest";
import { and, asc, desc, eq, gte, inArray, like, lte, or } from "drizzle-orm";
import { getDb } from "./db";
import { categories, inventory, listingImages, listings, stores } from "../drizzle/schema";

const PAGE_SIZE = 24;

type QueryCase = {
  name: string;
  q?: string;
  categorySlug?: string;
  min?: number;
  max?: number;
  sort: "newest" | "price_asc" | "price_desc" | "popular";
};

function ordering(sort: QueryCase["sort"]) {
  return sort === "price_asc"
    ? asc(listings.priceKobo)
    : sort === "price_desc"
      ? desc(listings.priceKobo)
      : sort === "popular"
        ? desc(listings.viewCount)
        : desc(listings.publishedAt);
}

async function buildWhere(db: any, input: QueryCase) {
  const where: any[] = [eq(listings.status, "ACTIVE"), eq(stores.status, "ACTIVE")];

  if (input.q?.trim()) {
    const phrase = `%${input.q.trim()}%`;
    const matchingCategories = await db
      .select({ id: categories.id })
      .from(categories)
      .where(and(eq(categories.isActive, true), or(like(categories.name, phrase), like(categories.slug, phrase))))
      .limit(6);
    where.push(
      or(
        like(listings.title, phrase),
        like(stores.name, phrase),
        matchingCategories.length ? inArray(listings.categoryId, matchingCategories.map((category: { id: number }) => category.id)) : undefined,
      )!,
    );
  }

  if (input.categorySlug) {
    const category = (
      await db
        .select({ id: categories.id })
        .from(categories)
        .where(and(eq(categories.slug, input.categorySlug), eq(categories.isActive, true)))
        .limit(1)
    )[0];
    if (!category) return null;
    where.push(eq(listings.categoryId, category.id));
  }

  if (input.min !== undefined) where.push(gte(listings.priceKobo, input.min));
  if (input.max !== undefined) where.push(lte(listings.priceKobo, input.max));
  return and(...where);
}

async function currentQuery(db: any, input: QueryCase) {
  const where = await buildWhere(db, input);
  if (!where) return [];
  return db
    .select({ listing: listings, store: stores, category: categories, image: listingImages, inventory })
    .from(listings)
    .innerJoin(stores, eq(listings.storeId, stores.id))
    .innerJoin(categories, eq(listings.categoryId, categories.id))
    .leftJoin(listingImages, and(eq(listingImages.listingId, listings.id), eq(listingImages.isPrimary, true)))
    .leftJoin(inventory, eq(inventory.listingId, listings.id))
    .where(where)
    .orderBy(ordering(input.sort))
    .limit(PAGE_SIZE)
    .offset(0);
}

async function proposedQuery(db: any, input: QueryCase) {
  const where = await buildWhere(db, input);
  if (!where) return [];
  const rows = await db
    .select({ listing: listings, store: stores, category: categories, inventory })
    .from(listings)
    .innerJoin(stores, eq(listings.storeId, stores.id))
    .innerJoin(categories, eq(listings.categoryId, categories.id))
    .leftJoin(inventory, eq(inventory.listingId, listings.id))
    .where(where)
    .orderBy(ordering(input.sort))
    .limit(PAGE_SIZE)
    .offset(0);

  const ids = rows.map((row: { listing: { id: number } }) => row.listing.id);
  const imageRows = ids.length
    ? await db
        .select({ listingId: listingImages.listingId, url: listingImages.url, storageKey: listingImages.storageKey, sortOrder: listingImages.sortOrder })
        .from(listingImages)
        .where(inArray(listingImages.listingId, ids))
        .orderBy(asc(listingImages.sortOrder), asc(listingImages.id))
    : [];
  const primaryImageByListing = new Map<number, (typeof imageRows)[number]>();
  for (const image of imageRows) {
    if (!primaryImageByListing.has(image.listingId)) primaryImageByListing.set(image.listingId, image);
  }
  return rows.map((row: any) => ({ ...row, image: primaryImageByListing.get(row.listing.id) ?? null }));
}

describe("public marketplace query comparison (read-only)", () => {
  it("matches the current listing identity/order for default and supported filter shapes", async () => {
    const db = await getDb();
    if (!db) return;

    const activeCategory = (await db
      .select({ slug: categories.slug })
      .from(categories)
      .where(eq(categories.isActive, true))
      .orderBy(asc(categories.sortOrder))
      .limit(1))[0];

    const cases: QueryCase[] = [
      { name: "default newest", sort: "newest" },
      { name: "price ascending", sort: "price_asc" },
      { name: "price descending", sort: "price_desc" },
      { name: "popular", sort: "popular" },
      { name: "text search", q: "i", sort: "newest" },
      ...(activeCategory ? [{ name: "active category", categorySlug: activeCategory.slug, sort: "newest" as const }] : []),
    ];

    for (const input of cases) {
      const [current, proposed] = await Promise.all([currentQuery(db, input), proposedQuery(db, input)]);
      const currentIds = current.map((row: any) => row.listing.id);
      const proposedIds = proposed.map((row: any) => row.listing.id);
      expect(proposedIds, `${input.name}: listing identity/order changed`).toEqual(currentIds);
      expect(new Set(proposedIds).size, `${input.name}: proposed query duplicated listings`).toBe(proposedIds.length);
    }
  });

  it("preserves truthful primary-image coverage while isolating media selection", async () => {
    const db = await getDb();
    if (!db) return;
    const input: QueryCase = { name: "media coverage", sort: "newest" };
    const [current, proposed] = await Promise.all([currentQuery(db, input), proposedQuery(db, input)]);
    const currentMedia = new Map<number, unknown>();
    for (const row of current as any[]) if (!currentMedia.has(row.listing.id)) currentMedia.set(row.listing.id, row.image?.url ?? null);
    const proposedMedia = new Map<number, unknown>();
    for (const row of proposed as any[]) proposedMedia.set(row.listing.id, row.image?.url ?? null);
    expect([...proposedMedia.entries()]).toEqual([...currentMedia.entries()]);
  });
});
