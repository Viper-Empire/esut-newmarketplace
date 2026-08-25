import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { MarketplaceProductGridSkeleton, StorefrontEmptyState, StorefrontProductCard } from "@/components/StorefrontComponents";
import { trpc } from "@/lib/trpc";
import { BellRing, LoaderCircle, Search, SearchX, SlidersHorizontal, Sparkles } from "lucide-react";
import { Link, useLocation, useRoute } from "wouter";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type Condition = "" | "NEW" | "LIKE_NEW" | "USED_GOOD" | "USED_FAIR" | "REFURBISHED";

type CategoryLabel = { slug: string; name: string };
export const parseNairaToKobo = (value: string, allowZero = false) => {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const numeric = Number(trimmed);
  if (!Number.isFinite(numeric) || numeric < 0 || (!allowZero && numeric === 0)) return undefined;
  return Math.round(numeric * 100);
};
export const formatCategoryTitle = (categorySlug: string | undefined, categories: ReadonlyArray<CategoryLabel> | undefined) => {
  if (!categorySlug) return "Find your next campus essential";
  const categoryName = categories?.find(category => category.slug === categorySlug)?.name;
  return `${categoryName ?? categorySlug.replaceAll("-", " ")} listings`;
};

export default function ExplorePage() {
  const [location] = useLocation();
  const { isAuthenticated } = useAuth();
  const [, categoryParams] = useRoute("/category/:slug");
  const start = useMemo(() => { const queryString = typeof window !== "undefined" ? window.location.search : location.split("?")[1] ?? ""; return new URLSearchParams(queryString).get("q") ?? ""; }, [location]);
  const [q, setQ] = useState(start);
  useEffect(() => { setQ(start); setPage(1); }, [start]);
  const [sort, setSort] = useState<"newest" | "price_asc" | "price_desc" | "popular">("newest");
  const [verified, setVerified] = useState(false);
  const [conditionFilter, setConditionFilter] = useState<Condition>("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [page, setPage] = useState(1);
  const categorySlug = categoryParams?.slug;
  const minKobo = parseNairaToKobo(min, true);
  const maxKobo = parseNairaToKobo(max);
  const hasInvalidPriceInput = (min.trim().length > 0 && minKobo === undefined) || (max.trim().length > 0 && maxKobo === undefined);
  const priceRangeError = hasInvalidPriceInput ? "Enter a valid Naira amount greater than zero, or leave the price field empty." : minKobo !== undefined && maxKobo !== undefined && maxKobo < minKobo ? "The maximum price must be greater than or equal to the minimum price." : null;
  const reset = (update: () => void) => { update(); setPage(1); };
  const results = trpc.marketplace.search.useQuery({ q: q.trim() || undefined, categorySlug, min: minKobo, max: maxKobo, condition: conditionFilter || undefined, sort, verified, page, limit: 24 }, { enabled: !priceRangeError });
  const categories = trpc.marketplace.categories.useQuery();
  const suggestions = trpc.marketplace.suggestions.useQuery({ q: q.trim() }, { enabled: !priceRangeError && q.trim().length >= 2 && !results.isLoading && results.data?.items.length === 0 });
  const title = formatCategoryTitle(categorySlug, categories.data);
  const clearFilters = () => { setQ(""); setSort("newest"); setVerified(false); setConditionFilter(""); setMin(""); setMax(""); setPage(1); };
  const activeFilterCount = [q.trim(), categorySlug, conditionFilter, verified ? "verified" : "", min, max, sort !== "newest" ? sort : ""].filter(Boolean).length;
  const suggestionLinks = q.trim().length >= 2 && suggestions.data ? [
    ...suggestions.data.products.slice(0, 4).map(product => ({ href: `/product/${product.slug}`, label: product.title, detail: `Product · ${product.storeName}` })),
    ...suggestions.data.stores.slice(0, 3).map(store => ({ href: `/store/${store.slug}`, label: store.name, detail: "Marketplace store" })),
    ...suggestions.data.categories.slice(0, 3).map(category => ({ href: `/category/${category.slug}`, label: category.name, detail: "Category" })),
  ] : [];
  const fallbackCategories = categories.data?.slice(0, 6) ?? [];
  const notifyMe = trpc.searchAlerts.create.useMutation({ onSuccess: () => toast.success("We’ll notify you when a matching listing is published."), onError: error => toast.error(error.message) });
  const saveSearchAlert = () => { if (!q.trim()) { toast.error("Enter a search term before enabling alerts."); return; } if (!isAuthenticated) { toast.error("Sign in to receive marketplace alerts."); return; } notifyMe.mutate({ query: q.trim(), categorySlug, minKobo, maxKobo, condition: conditionFilter || undefined, verified }); };

  return <main className="page-shell py-8">
    <p className="eyebrow text-[#00843d]">{categorySlug ? "CATEGORY BROWSE" : "MARKETPLACE CATALOGUE"}</p>
    <h1 className="mt-2 text-3xl font-extrabold capitalize">{title}</h1>
    <form className="mt-6 flex max-w-3xl gap-2" onSubmit={event => { event.preventDefault(); setPage(1); }}>
      <div className="searchbox flex-1"><Search size={18}/><input value={q} onChange={event => reset(() => setQ(event.target.value))} placeholder="Search listings"/></div>
      <Button className="bg-[#e31b23]">Search</Button>
    </form>
    <div className="mt-6 flex flex-wrap items-center gap-3">
      <label className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm font-semibold"><SlidersHorizontal size={15}/><span className="sr-only">Sort listings</span><select aria-label="Sort listings" value={sort} onChange={event => reset(() => setSort(event.target.value as typeof sort))} className="border-0 bg-transparent outline-none"><option value="newest">Newest First</option><option value="popular">Popular</option><option value="price_asc">Price: Low to High</option><option value="price_desc">Price: High to Low</option></select></label>
      <label className="rounded-xl border bg-white px-3 py-2 text-sm font-semibold">Condition <select aria-label="Filter by condition" value={conditionFilter} onChange={event => reset(() => setConditionFilter(event.target.value as Condition))} className="ml-1 border-0 bg-transparent outline-none"><option value="">Any</option><option value="NEW">New</option><option value="LIKE_NEW">Like new</option><option value="USED_GOOD">Used — good</option><option value="USED_FAIR">Used — fair</option><option value="REFURBISHED">Refurbished</option></select></label>
      <label className="rounded-xl border bg-white px-3 py-2 text-sm font-semibold">Min ₦<input aria-label="Minimum price in Naira" value={min} inputMode="decimal" onChange={event => reset(() => setMin(event.target.value))} className="ml-1 w-20 border-0 bg-transparent outline-none" placeholder="0"/></label>
      <label className="rounded-xl border bg-white px-3 py-2 text-sm font-semibold">Max ₦<input aria-label="Maximum price in Naira" value={max} inputMode="decimal" onChange={event => reset(() => setMax(event.target.value))} className="ml-1 w-20 border-0 bg-transparent outline-none" placeholder="Any"/></label>
      <label className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm font-semibold"><input type="checkbox" aria-label="Verified sellers only" checked={verified} onChange={event => reset(() => setVerified(event.target.checked))}/>Verified sellers only</label>
    </div>
    {priceRangeError ? <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800" role="alert"><span>{priceRangeError} Adjust the price range to continue.</span><button type="button" className="rounded-lg bg-white px-3 py-1.5 text-xs font-extrabold text-[#b91c1c] ring-1 ring-red-200 hover:bg-red-100" onClick={() => { setMin(""); setMax(""); setPage(1); }}>Clear price range</button></div> : null}
    {activeFilterCount > 0 ? <section aria-label="Active marketplace filters" className="mt-4 rounded-2xl border border-[#c9e8d3] bg-[#f4fbf6] px-4 py-3"><div className="flex flex-wrap items-center gap-2"><span className="mr-1 text-xs font-black uppercase tracking-[.12em] text-[#006b32]">{activeFilterCount} active {activeFilterCount === 1 ? "filter" : "filters"}</span>{q.trim() ? <button type="button" className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-700 ring-1 ring-[#b9dec6]" onClick={() => reset(() => setQ(""))}>Search: “{q.trim()}” ×</button> : null}{categorySlug ? <Link href="/explore" className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-700 ring-1 ring-[#b9dec6]">Category: {title.replace(/ listings$/, "")} ×</Link> : null}{conditionFilter ? <button type="button" className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-700 ring-1 ring-[#b9dec6]" onClick={() => reset(() => setConditionFilter(""))}>Condition: {conditionFilter.replaceAll("_", " ")} ×</button> : null}{min || max ? <button type="button" className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-700 ring-1 ring-[#b9dec6]" onClick={() => { setMin(""); setMax(""); setPage(1); }}>Price range ×</button> : null}{verified ? <button type="button" className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-700 ring-1 ring-[#b9dec6]" onClick={() => reset(() => setVerified(false))}>Verified sellers ×</button> : null}{sort !== "newest" ? <button type="button" className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-700 ring-1 ring-[#b9dec6]" onClick={() => reset(() => setSort("newest"))}>Sort: {sort === "price_asc" ? "Price low to high" : sort === "price_desc" ? "Price high to low" : "Popular"} ×</button> : null}<button type="button" className="ml-auto text-xs font-extrabold text-[#e31b23] underline-offset-4 hover:underline" onClick={clearFilters}>Clear all</button></div></section> : null}
    <section aria-label="Browse marketplace categories" className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[.14em] text-[#00843d]">QUICK CATEGORY FILTER</p><p className="mt-1 text-sm text-slate-500">Choose a category to focus the real marketplace results.</p></div>{categorySlug ? <Link href="/explore" className="text-sm font-extrabold text-[#e31b23]">Clear category</Link> : null}</div><div className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:flex-wrap lg:overflow-visible"><Link href="/explore" aria-current={!categorySlug ? "page" : undefined} className={`shrink-0 rounded-full px-4 py-2 text-sm font-extrabold transition ${!categorySlug ? "bg-[#08243b] text-white" : "bg-slate-50 text-slate-700 ring-1 ring-slate-200 hover:ring-[#00843d]/40"}`}>All items</Link>{categories.isLoading ? Array.from({ length: 5 }, (_, index) => <span key={index} aria-hidden="true" className="h-9 w-24 shrink-0 animate-pulse rounded-full bg-slate-200 motion-reduce:animate-none"/>) : categories.data?.map(category => <Link key={category.id} href={`/category/${category.slug}`} aria-current={categorySlug === category.slug ? "page" : undefined} className={`shrink-0 rounded-full px-4 py-2 text-sm font-extrabold transition ${categorySlug === category.slug ? "bg-[#00843d] text-white" : "bg-slate-50 text-slate-700 ring-1 ring-slate-200 hover:ring-[#00843d]/40"}`}>{category.name}</Link>)}</div></section>
    {results.isFetching && !results.isLoading ? <div className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-[#c9e8d3] bg-[#f4fbf6] px-4 py-3 text-sm font-bold text-[#006b32]" role="status" aria-live="polite"><LoaderCircle size={17} className="animate-spin motion-reduce:animate-none"/>Updating marketplace results…</div> : null}
    {!priceRangeError && (results.isLoading ? <MarketplaceProductGridSkeleton compact count={12} className="mt-7" /> : results.isError ? <div className="py-12" role="alert"><div className="rounded-2xl bg-[#fff3f3] p-8 text-center text-[#b91c1c] ring-1 ring-[#fecaca]"><h2 className="text-xl font-extrabold">We could not load marketplace listings</h2><p className="mt-2 text-sm">Try again to retrieve the latest results for these real filters.</p><Button variant="outline" className="mt-4" onClick={() => results.refetch()}>Try again</Button></div></div> : results.data?.items.length ? <><section className="mt-7" aria-label="Marketplace results" aria-busy={results.isFetching}><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-semibold text-slate-600">Showing {results.data.items.length}{results.data.hasMore ? "+" : ""} real listing{results.data.items.length === 1 ? "" : "s"}{q.trim() ? <> for <strong className="text-slate-800">“{q.trim()}”</strong></> : null}</p>{results.isFetching ? <span className="text-xs font-bold text-[#006b32]">Refreshing results…</span> : null}</div><div className="product-grid">{results.data.items.map(row => <StorefrontProductCard key={row.listing.id} row={row} compact showActions={false}/>)}</div></section><nav aria-label="Catalogue pages" className="mt-8 flex items-center justify-center gap-3"><Button variant="outline" disabled={page === 1} onClick={() => setPage(current => Math.max(1, current - 1))}>Previous</Button><span className="text-sm font-bold text-slate-600">Page {page}</span><Button variant="outline" disabled={!results.data?.hasMore} onClick={() => setPage(current => current + 1)}>Next</Button></nav></> : <section className="mt-7 rounded-3xl border border-[#d7eadf] bg-gradient-to-br from-white via-[#f4fbf6] to-[#fff7f7] p-6 shadow-sm sm:p-10" aria-live="polite"><div className="mx-auto max-w-2xl text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e8f7ee] text-[#00843d] ring-1 ring-[#c9e8d3]"><SearchX size={28}/></div><h2 className="mt-4 text-2xl font-extrabold text-[#111827]">No results found</h2><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">{q.trim() ? <>We could not find a listing for <strong className="text-slate-800">“{q.trim()}”</strong> with the current filters. Try a broader search or explore one of these real marketplace suggestions.</> : "No listings match the filters you selected. Try clearing a filter or browse another campus category."}</p><div className="mt-5 flex flex-wrap justify-center gap-2">{suggestionLinks.map(suggestion => <Link key={`${suggestion.href}-${suggestion.label}`} href={suggestion.href} className="rounded-full bg-white px-3.5 py-2 text-sm font-bold text-[#006b32] ring-1 ring-[#b9dec6] transition hover:bg-[#e8f7ee]"><Sparkles size={14} className="mr-1 inline"/>{suggestion.label}<span className="ml-1 text-xs font-semibold text-slate-500">{suggestion.detail}</span></Link>)}{!suggestionLinks.length ? fallbackCategories.map(category => <Link key={category.id} href={`/category/${category.slug}`} className="rounded-full bg-white px-3.5 py-2 text-sm font-bold text-[#006b32] ring-1 ring-[#b9dec6] transition hover:bg-[#e8f7ee]"><Sparkles size={14} className="mr-1 inline"/>{category.name}</Link>) : null}</div><div className="mt-6 flex flex-wrap justify-center gap-3"><div className="flex flex-wrap justify-center gap-3"><Button className="bg-[#e31b23] hover:bg-[#c9161d]" onClick={clearFilters}>Clear filters</Button><Button variant="outline" disabled={notifyMe.isPending || !q.trim()} onClick={saveSearchAlert}><BellRing size={16} className="mr-2"/>{notifyMe.isPending ? "Saving alert…" : "Notify me"}</Button></div><Link href="/explore" className="inline-flex items-center rounded-md border border-[#00843d] px-4 py-2 text-sm font-bold text-[#006b32] transition hover:bg-[#e8f7ee]">Browse all listings</Link></div></div></section>)}

  </main>;
}
