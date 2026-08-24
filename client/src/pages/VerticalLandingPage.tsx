import { StorefrontHeader, StorefrontFooter, StorefrontEmptyState, StorefrontProductCard, MarketplaceProductGridSkeleton } from "@/components/StorefrontComponents";
import { trpc } from "@/lib/trpc";
import { presentCategories } from "@/lib/verticalCatalog";
import { ArrowRight, House, MapPin, ShieldCheck, UtensilsCrossed } from "lucide-react";
import { Link } from "wouter";

export type VerticalKind = "food" | "accommodation";

const verticals = {
  food: {
    brand: "ESUTChop",
    eyebrow: "FOOD AT ESUT",
    title: "Good food, closer to campus.",
    description: "Discover food listings from approved campus vendors, with clear availability and pickup information before you order.",
    icon: UtensilsCrossed,
    accent: "#e31b23",
    surface: "from-[#fff7f7] via-white to-[#fff3e8]",
    legacyCategorySlug: "food",
    childLabels: ["Prepared Meals", "Snacks", "Drinks", "Pastries"],
    empty: "Approved food listings will appear here as ESUTChop vendors publish their menus.",
  },
  accommodation: {
    brand: "Accommodation",
    eyebrow: "STUDENT HOUSING",
    title: "Find a place that fits campus life.",
    description: "Browse accommodation information for apartments, lodges, rooms, and shared spaces. Verify details and inspect before making any payment.",
    icon: House,
    accent: "#00843d",
    surface: "from-[#f4fbf6] via-white to-[#edf7f3]",
    legacyCategorySlug: "hostel-home",
    childLabels: ["Student Lodges", "Apartments", "Self-Contained Rooms", "Shared Rooms"],
    empty: "Verified accommodation listings will appear here when the student-housing provider workflow is enabled.",
  },
} as const;

export default function VerticalLandingPage({ kind }: { kind: VerticalKind }) {
  const vertical = verticals[kind];
  const Icon = vertical.icon;
  const categories = trpc.marketplace.categories.useQuery();
  const results = trpc.marketplace.search.useQuery({ categorySlug: vertical.legacyCategorySlug, sort: "newest", verified: true, page: 1, limit: 8 }, { enabled: kind === "food" });
  const relatedCategories = presentCategories(categories.data).filter(category => category.id !== (kind === "food" ? 5 : 6)).slice(0, 6);
  const hasQueryError = categories.isError || (kind === "food" && results.isError);
  const retry = () => { void categories.refetch(); if (kind === "food") void results.refetch(); };

  return <div className="min-h-screen bg-[#f7f9fc]"><StorefrontHeader categories={presentCategories(categories.data)}/><main>
    <section className={`bg-gradient-to-br ${vertical.surface}`}><div className="page-shell grid gap-8 py-12 lg:grid-cols-[1.1fr_.9fr] lg:items-center lg:py-20"><div><p className="eyebrow" style={{ color: vertical.accent }}><Icon size={15}/> {vertical.eyebrow}</p><h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight text-[#10263c] sm:text-6xl">{vertical.title}</h1><p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">{vertical.description}</p><div className="mt-7 flex flex-wrap gap-3"><Link href={kind === "food" ? "/esutchop#vertical-listings" : "/accommodation#vertical-listings"} className="inline-flex items-center gap-2 rounded-xl bg-[#e31b23] px-5 py-3 text-sm font-extrabold text-white transition hover:bg-[#c9161d]">Browse {kind === "food" ? "ESUTChop" : "Accommodation"} <ArrowRight size={17}/></Link><Link href="/" className="inline-flex items-center rounded-xl border border-[#00843d] px-5 py-3 text-sm font-extrabold text-[#006b32] transition hover:bg-[#eaf7ef]">Back to marketplace</Link></div></div><div className="rounded-[2rem] border border-white/80 bg-white/80 p-6 shadow-xl backdrop-blur"><div className="flex h-16 w-16 items-center justify-center rounded-2xl text-white" style={{ backgroundColor: vertical.accent }}><Icon size={30}/></div><h2 className="mt-6 text-2xl font-black text-[#10263c]">Explore by type</h2><div className="mt-5 grid gap-3 sm:grid-cols-2">{vertical.childLabels.map(label => <div key={label} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700">{label}</div>)}</div><p className="mt-5 flex items-start gap-2 text-xs leading-5 text-slate-500"><ShieldCheck className="mt-0.5 shrink-0 text-[#00843d]" size={16}/> Use verified information, keep conversations in your account, and report anything that looks unsafe.</p></div></div></section>
    <section id="vertical-listings" className="page-shell py-10"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow" style={{ color: vertical.accent }}>{kind === "food" ? "ESUTCHOP MENU" : "HOUSING DISCOVERY"}</p><h2 className="mt-2 text-3xl font-black text-[#10263c]">{kind === "food" ? "Available food listings" : "Accommodation information"}</h2></div>{kind === "food" ? <Link href="/explore" className="view-link">View marketplace <ArrowRight size={16}/></Link> : null}</div>{hasQueryError ? <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-800" role="alert"><h3 className="font-extrabold">We could not load this {kind === "food" ? "food menu" : "accommodation directory"}.</h3><p className="mt-2 text-sm">Try again to retrieve the latest real marketplace information.</p><button type="button" className="mt-4 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-bold" onClick={retry}>Try again</button></div> : kind === "food" && results.isLoading ? <MarketplaceProductGridSkeleton compact count={4} className="mt-6"/> : kind === "food" && results.data?.items.length ? <div className="product-grid mt-6">{results.data.items.map(row => <StorefrontProductCard key={row.listing.id} row={row} compact showActions={false}/>)}</div> : <div className="mt-6"><StorefrontEmptyState icon={<Icon size={34}/>}><span className="block">{vertical.empty}</span><span className="mt-2 block text-xs text-slate-500">No placeholder listings are shown.</span></StorefrontEmptyState></div>}</section>
    <section className="page-shell pb-12"><div className="rounded-2xl border border-[#00843d]/15 bg-white p-6 shadow-sm"><p className="flex items-center gap-2 text-sm font-extrabold text-[#006b32]"><MapPin size={17}/> Built for ESUT community discovery</p><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">This attached experience shares ESUT Marketplace accounts, trust controls, notifications, reporting, and safe in-app navigation. Domain-specific provider workflows will be added only when their real verification and availability rules are ready.</p><div className="mt-4 flex flex-wrap gap-3">{relatedCategories.map(category => <Link key={category.id} href={`/category/${category.slug}`} className="text-sm font-bold text-[#00843d] hover:underline">Explore {category.name}</Link>)}</div></div></section>
  </main><StorefrontFooter/></div>;
}
