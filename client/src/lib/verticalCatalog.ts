export type CatalogCategory = { id: number; name: string; slug: string; description?: string | null; icon?: string | null; parentId?: number | null; isActive?: boolean };

export const VERTICAL_CATEGORY_IDS = { accommodation: 5, food: 6 } as const;

export const verticalCategoryPresentation = {
  [VERTICAL_CATEGORY_IDS.accommodation]: { name: "Accommodation", slug: "accommodation", legacySlug: "hostel-home", route: "/accommodation", brand: "Accommodation" },
  [VERTICAL_CATEGORY_IDS.food]: { name: "Food", slug: "food", legacySlug: "food", route: "/esutchop", brand: "ESUTChop" },
} as const;

export function presentCategory<T extends CatalogCategory>(category: T): T {
  const presentation = verticalCategoryPresentation[category.id as keyof typeof verticalCategoryPresentation];
  return presentation ? { ...category, name: presentation.name, slug: presentation.slug } : category;
}

export function presentCategories<T extends CatalogCategory>(categories: readonly T[] | undefined): T[] {
  return (categories ?? []).map(presentCategory);
}

export function canonicalCategoryRoute(category: Pick<CatalogCategory, "id" | "slug">) {
  const presentation = verticalCategoryPresentation[category.id as keyof typeof verticalCategoryPresentation];
  return presentation?.route ?? `/category/${category.slug}`;
}

export function legacyCategoryRoute(slug: string) {
  if (slug === "food") return "/esutchop";
  if (slug === "hostel-home") return "/accommodation";
  return `/category/${slug}`;
}
