export type CategoryAvailability = "ACTIVE" | "COMING_SOON";

export type CategoryAvailabilityInput = {
  id?: number | null;
  slug?: string | null;
};

export type ComingSoonCategory = {
  id: number;
  canonicalSlug: string;
  legacySlugs: readonly string[];
  publicRoute: string;
  verticalName: string;
  detail: string;
};

const COMING_SOON_CATEGORIES: readonly ComingSoonCategory[] = [
  {
    id: 6,
    canonicalSlug: "food",
    legacySlugs: ["food-groceries"],
    publicRoute: "/esutchop",
    verticalName: "ESUT Chop",
    detail: "Food discovery will open when the ESUT Chop experience is ready for the community.",
  },
  {
    id: 30001,
    canonicalSlug: "digital-books-courses",
    legacySlugs: ["books", "books-academic"],
    publicRoute: "/category/digital-books-courses",
    verticalName: "Digital Academic Resources",
    detail: "Digital academic resources will open when the course-material experience is ready for the community.",
  },
  {
    id: 5,
    canonicalSlug: "accommodation",
    legacySlugs: ["hostel-home", "hostel-lodge"],
    publicRoute: "/accommodation",
    verticalName: "ESUT Accommodation",
    detail: "Accommodation discovery will open when the ESUT housing experience is ready for the community.",
  },
] as const;

const normalizedSlug = (slug: string | null | undefined) => slug?.trim().toLowerCase() ?? "";

export const getComingSoonCategory = (category: CategoryAvailabilityInput): ComingSoonCategory | null => {
  const slug = normalizedSlug(category.slug);
  return COMING_SOON_CATEGORIES.find(candidate => candidate.id === category.id || candidate.canonicalSlug === slug || candidate.legacySlugs.includes(slug)) ?? null;
};

export const getCategoryAvailability = (category: CategoryAvailabilityInput): CategoryAvailability => getComingSoonCategory(category) ? "COMING_SOON" : "ACTIVE";

export const isPubliclyDiscoverableCategory = (category: CategoryAvailabilityInput) => getCategoryAvailability(category) === "ACTIVE";

export const isComingSoonCategorySlug = (slug: string | null | undefined) => Boolean(getComingSoonCategory({ slug }));

export const canonicalCategorySlug = (slug: string | null | undefined) => getComingSoonCategory({ slug })?.canonicalSlug ?? normalizedSlug(slug);

export const comingSoonCategories = () => COMING_SOON_CATEGORIES;
