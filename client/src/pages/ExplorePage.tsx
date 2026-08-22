import { Button } from "@/components/ui/button";
import { MarketplaceProductGridSkeleton, StorefrontEmptyState, StorefrontProductCard } from "@/components/StorefrontComponents";
import { trpc } from "@/lib/trpc";
import { Search, SlidersHorizontal } from "lucide-react";
import { Link, useLocation, useRoute } from "wouter";
import { useMemo, useState } from "react";

type Condition = "" | "NEW" | "LIKE_NEW" | "USED_GOOD" | "USED_FAIR" | "REFURBISHED";

export default function ExplorePage() {
  const [location] = useLocation();
  const [, categoryParams] = useRoute("/category/:slug");
  const start = useMemo(() => new URLSearchParams(location.split("?")[1] ?? "").get("q") ?? "", [location]);
  const [q, setQ] = useState(start);
  const [sort, setSort] = useState<"newest" | "price_asc" | "price_desc" | "popular">("newest");
  const [verified, setVerified] = useState(false);
  const [conditionFilter, setConditionFilter] = useState<Condition>("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [page, setPage] = useState(1);
  const categorySlug = categoryParams?.slug;
  const minKobo = min && Number(min) >= 0 ? Math.round(Number(min) * 100) : undefined;
  const maxKobo = max && Number(max) > 0 ? Math.round(Number(max) * 100) : undefined;
  const reset = (update: () => void) => { update(); setPage(1); };
  const results = trpc.marketplace.search.useQuery({ q: q || undefined, categorySlug, min: minKobo, max: maxKobo, condition: conditionFilter || undefined, sort, verified, page, limit: 24 });
  const categories = trpc.marketplace.categories.useQuery();
  const title = categorySlug ? `${categorySlug.replaceAll("-", " ")} listings` : "Find your next campus essential";

  return <main className="page-shell py-8">
    <p className="eyebrow text-[#00843d]">{categorySlug ? "CATEGORY BROWSE" : "MARKETPLACE CATALOGUE"}</p>
    <h1 className="mt-2 text-3xl font-extrabold capitalize">{title}</h1>
    <form className="mt-6 flex max-w-3xl gap-2" onSubmit={event => { event.preventDefault(); setPage(1); }}>
      <div className="searchbox flex-1"><Search size={18}/><input value={q} onChange={event => reset(() => setQ(event.target.value))} placeholder="Search listings"/></div>
      <Button className="bg-[#e31b23]">Search</Button>
    </form>
    <div className="mt-6 flex flex-wrap items-center gap-3">
      <label className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm font-semibold"><SlidersHorizontal size={15}/><select value={sort} onChange={event => reset(() => setSort(event.target.value as typeof sort))} className="border-0 bg-transparent outline-none"><option value="newest">Newest</option><option value="popular">Popular</option><option value="price_asc">Price: Low to High</option><option value="price_desc">Price: High to Low</option></select></label>
      <label className="rounded-xl border bg-white px-3 py-2 text-sm font-semibold">Condition <select value={conditionFilter} onChange={event => reset(() => setConditionFilter(event.target.value as Condition))} className="ml-1 border-0 bg-transparent outline-none"><option value="">Any</option><option value="NEW">New</option><option value="LIKE_NEW">Like new</option><option value="USED_GOOD">Used — good</option><option value="USED_FAIR">Used — fair</option><option value="REFURBISHED">Refurbished</option></select></label>
      <label className="rounded-xl border bg-white px-3 py-2 text-sm font-semibold">Min ₦<input value={min} inputMode="decimal" onChange={event => reset(() => setMin(event.target.value))} className="ml-1 w-20 border-0 bg-transparent outline-none" placeholder="0"/></label>
      <label className="rounded-xl border bg-white px-3 py-2 text-sm font-semibold">Max ₦<input value={max} inputMode="decimal" onChange={event => reset(() => setMax(event.target.value))} className="ml-1 w-20 border-0 bg-transparent outline-none" placeholder="Any"/></label>
      <label className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm font-semibold"><input type="checkbox" checked={verified} onChange={event => reset(() => setVerified(event.target.checked))}/>Verified sellers only</label>
    </div>
    <section aria-label="Browse marketplace categories" className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[.14em] text-[#00843d]">QUICK CATEGORY FILTER</p><p className="mt-1 text-sm text-slate-500">Choose a category to focus the real marketplace results.</p></div>{categorySlug ? <Link href="/explore" className="text-sm font-extrabold text-[#e31b23]">Clear category</Link> : null}</div><div className="mt-4 flex gap-2 overflow-x-auto pb-1"><Link href="/explore" aria-current={!categorySlug ? "page" : undefined} className={`shrink-0 rounded-full px-4 py-2 text-sm font-extrabold transition ${!categorySlug ? "bg-[#08243b] text-white" : "bg-slate-50 text-slate-700 ring-1 ring-slate-200 hover:ring-[#00843d]/40"}`}>All items</Link>{categories.isLoading ? Array.from({ length: 5 }, (_, index) => <span key={index} aria-hidden="true" className="h-9 w-24 shrink-0 animate-pulse rounded-full bg-slate-200 motion-reduce:animate-none"/>) : categories.data?.map(category => <Link key={category.id} href={`/category/${category.slug}`} aria-current={categorySlug === category.slug ? "page" : undefined} className={`shrink-0 rounded-full px-4 py-2 text-sm font-extrabold transition ${categorySlug === category.slug ? "bg-[#00843d] text-white" : "bg-slate-50 text-slate-700 ring-1 ring-slate-200 hover:ring-[#00843d]/40"}`}>{category.name}</Link>)}</div></section>
    {results.isLoading ? <MarketplaceProductGridSkeleton compact count={12} className="mt-7" /> : results.isError ? <div className="py-12" role="alert"><div className="rounded-2xl bg-[#fff3f3] p-8 text-center text-[#b91c1c] ring-1 ring-[#fecaca]"><h2 className="text-xl font-extrabold">We could not load marketplace listings</h2><p className="mt-2 text-sm">Try again to retrieve the latest results for these real filters.</p><Button variant="outline" className="mt-4" onClick={() => results.refetch()}>Try again</Button></div></div> : results.data?.items.length ? <><div className="mt-7 product-grid">{results.data.items.map(row => <StorefrontProductCard key={row.listing.id} row={row} compact showActions={false}/>)}</div><nav aria-label="Catalogue pages" className="mt-8 flex items-center justify-center gap-3"><Button variant="outline" disabled={page === 1} onClick={() => setPage(current => Math.max(1, current - 1))}>Previous</Button><span className="text-sm font-bold text-slate-600">Page {page}</span><Button variant="outline" disabled={!results.data?.hasMore} onClick={() => setPage(current => current + 1)}>Next</Button></nav></> : <StorefrontEmptyState className="mt-7">No listings match those filters.</StorefrontEmptyState>}
  </main>;
}
