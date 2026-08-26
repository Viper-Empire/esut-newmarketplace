import { getComingSoonCategory } from "@shared/categoryAvailability";

export type CatalogCategory = { id: number; name: string; slug: string; description?: string | null; icon?: string | null; parentId?: number | null; isActive?: boolean; availability?: "ACTIVE" | "COMING_SOON" };

export function presentCategory<T extends CatalogCategory>(category: T): T {
  return category;
}

export function presentCategories<T extends CatalogCategory>(categories: readonly T[] | undefined): T[] {
  return (categories ?? []).map(presentCategory);
}

export function canonicalCategoryRoute(category: Pick<CatalogCategory, "id" | "slug">) {
  return getComingSoonCategory(category)?.publicRoute ?? `/category/${category.slug}`;
}

export function legacyCategoryRoute(slug: string) {
  return getComingSoonCategory({ slug })?.publicRoute ?? `/category/${slug}`;
}
