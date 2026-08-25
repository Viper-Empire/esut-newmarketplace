import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { ESUT_MARKETPLACE_LOGO_PATH } from "@/lib/brandAssets";
import { condition, naira } from "@/lib/marketplace";
import { trpc } from "@/lib/trpc";
import { canonicalCategoryRoute, presentCategories } from "@/lib/verticalCatalog";
import { Skeleton } from "@/components/ui/skeleton";
import { BadgeCheck, Bell, BookOpen, Heart, House, Laptop, MapPin, Menu, Package, Search, Shirt, ShoppingCart, Smartphone, UtensilsCrossed, UsersRound, Wrench, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

export const marketplaceLogoPath = ESUT_MARKETPLACE_LOGO_PATH;
const recentSearchesKey = "esut-marketplace-recent-searches";

function readRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(recentSearchesKey) ?? "[]");
    return Array.isArray(value) ? value.filter((term): term is string => typeof term === "string").slice(0, 6) : [];
  } catch {
    return [];
  }
}

export type StorefrontListingRow = {
  listing: { id: number; slug: string; title: string; priceKobo: number; compareAtPriceKobo?: number | null; condition: string; location: string };
  store: { name: string; isVerified?: boolean };
  category?: { name: string; slug: string } | null;
  image?: { url: string; altText?: string | null } | null;
  availability?: { availableUnits: number; status: "IN_STOCK" | "LOW_STOCK" | "AWAITING_STOCK" | "UNAVAILABLE" };
};

export function ProductPrice({ priceKobo, compareAtPriceKobo }: { priceKobo: number; compareAtPriceKobo?: number | null }) {
  return <div className="flex min-h-7 items-end gap-2"><strong className="text-lg leading-6 text-[#e31b23]">{naira(priceKobo)}</strong>{compareAtPriceKobo ? <span className="pb-0.5 text-xs leading-4 text-slate-400 line-through">{naira(compareAtPriceKobo)}</span> : null}</div>;
}

export function TrustBadge({ verified = true }: { verified?: boolean }) {
  return <span className={`inline-flex items-center gap-1 text-xs font-bold ${verified ? "text-[#00843d]" : "text-slate-500"}`}><BadgeCheck size={14}/>{verified ? "Verified seller" : "Seller"}</span>;
}

export function StorefrontEmptyState({ icon, children, className = "" }: { icon?: ReactNode; children: ReactNode; className?: string }) {
  return <div className={`empty-panel ${className}`}>{icon ?? <Package size={34}/>}<p>{children}</p></div>;
}

export function marketplaceLoadingSlots(count: number) {
  return Array.from({ length: Math.max(1, Math.min(12, Math.floor(count))) }, (_, index) => index);
}

export function MarketplaceProductGridSkeleton({ count = 8, compact = false, className = "" }: { count?: number; compact?: boolean; className?: string }) {
  return <div aria-busy="true" aria-label="Loading marketplace listings" className={`product-grid ${className}`}>{marketplaceLoadingSlots(count).map(index => <article key={index} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200"><Skeleton className={`${compact ? "aspect-[1/.75]" : "aspect-[1/.8]"} w-full rounded-none bg-slate-200 motion-reduce:animate-none`} /><div className="space-y-3 p-4"><Skeleton className="h-5 w-4/5 bg-slate-200 motion-reduce:animate-none" /><Skeleton className="h-4 w-2/5 bg-slate-200 motion-reduce:animate-none" /><Skeleton className="h-3 w-3/5 bg-slate-200 motion-reduce:animate-none" /><Skeleton className="mt-4 h-8 w-full bg-slate-200 motion-reduce:animate-none" /></div></article>)}</div>;
}

export function listingImageFallbackPresentation(category?: StorefrontListingRow["category"]) {
  const identity = `${category?.name ?? ""} ${category?.slug ?? ""}`.toLowerCase();
  return identity.includes("phone") || identity.includes("elect") ? { icon: Smartphone, label: "Campus tech", tone: "from-sky-50 via-cyan-50 to-slate-100 text-sky-800" } : identity.includes("comput") ? { icon: Laptop, label: "Campus computing", tone: "from-indigo-50 via-blue-50 to-slate-100 text-indigo-800" } : identity.includes("book") ? { icon: BookOpen, label: "Campus books", tone: "from-amber-50 via-yellow-50 to-slate-100 text-amber-900" } : identity.includes("fashion") ? { icon: Shirt, label: "Campus fashion", tone: "from-rose-50 via-pink-50 to-slate-100 text-rose-800" } : identity.includes("food") || identity.includes("grocery") ? { icon: UtensilsCrossed, label: "Campus food", tone: "from-orange-50 via-amber-50 to-slate-100 text-orange-900" } : identity.includes("hostel") || identity.includes("home") ? { icon: House, label: "Campus living", tone: "from-emerald-50 via-teal-50 to-slate-100 text-emerald-900" } : identity.includes("service") ? { icon: Wrench, label: "Campus service", tone: "from-violet-50 via-purple-50 to-slate-100 text-violet-900" } : { icon: Package, label: "Campus listing", tone: "from-[#eaf7ef] to-slate-100 text-[#006b32]" };
}

function ListingImageFallback({ category }: { category?: StorefrontListingRow["category"] }) {
  const presentation = listingImageFallbackPresentation(category);
  const Icon = presentation.icon;
  return <div className={`flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br text-center ${presentation.tone}`}><Icon size={46} strokeWidth={1.35}/><span className="max-w-[11rem] px-3 text-[10px] font-black uppercase tracking-[.1em]">{presentation.label}</span><span className="px-3 text-[10px] font-semibold opacity-75">Seller photo unavailable</span></div>;
}

function MarketplaceLogo({ className = "" }: { className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <span aria-label="ESUT Marketplace" className={`flex items-center justify-center rounded-xl bg-[#00843d] font-black text-white ${className}`}>E</span>;
  return <img src={marketplaceLogoPath} alt="ESUT Marketplace" className={`object-contain ${className}`} onError={() => setFailed(true)} />;
}

export function StorefrontProductCard({ row, showActions = true, compact = false }: { row: StorefrontListingRow; showActions?: boolean; compact?: boolean }) {
  const { listing, store, category, image, availability } = row; const { isAuthenticated } = useAuth(); const [, go] = useLocation(); const availabilityText = availability?.status === "UNAVAILABLE" ? "Unavailable" : availability?.status === "AWAITING_STOCK" ? "Awaiting stock" : availability?.status === "LOW_STOCK" ? `${availability.availableUnits} left` : availability ? "In stock" : "Check availability"; const awaitingStock = availability?.status === "AWAITING_STOCK" || availability?.status === "UNAVAILABLE";
  const [imageFailed, setImageFailed] = useState(false);
  const add = trpc.cart.add.useMutation({ onSuccess: () => { toast.success("Added to cart"); go("/cart"); }, onError: error => toast.error(error.message) });
  const save = trpc.favorites.toggle.useMutation({ onSuccess: data => toast.success(data.favorited ? "Saved to favorites" : "Removed from favorites"), onError: () => toast.error("Sign in to save products") });
  const discount = listing.compareAtPriceKobo ? Math.round((1 - listing.priceKobo / listing.compareAtPriceKobo) * 100) : 0;
  return <article className="product-card"><Link href={`/product/${listing.slug}`}><div className={`product-visual relative ${compact ? "aspect-[1/.75]" : "aspect-[1/.8]"}`}>{image?.url && !imageFailed ? <img src={image.url} alt={image.altText ?? listing.title} className="h-full w-full object-cover" onError={() => setImageFailed(true)}/> : <ListingImageFallback category={category}/>}<span className="absolute left-3 top-3 rounded-md bg-white/95 px-2 py-1 text-[10px] font-extrabold text-[#006b32]">{condition(listing.condition as Parameters<typeof condition>[0])}</span><span className={`absolute right-3 top-3 rounded-md px-2 py-1 text-[10px] font-extrabold ${awaitingStock ? "bg-slate-900/90 text-white" : availability?.status === "LOW_STOCK" ? "bg-[#fff3c4] text-[#7a5700]" : "bg-[#e8f7ee]/95 text-[#006b32]"}`}>{availabilityText}</span>{discount > 0 && <span className="absolute bottom-3 left-3 rounded-md bg-[#e31b23] px-2 py-1 text-[10px] font-extrabold text-white">-{discount}%</span>}</div></Link><div className="flex h-full flex-col p-4"><div className="flex min-h-10 items-start justify-between gap-2"><Link href={`/product/${listing.slug}`}><h3 className="h-10 line-clamp-2 font-bold leading-5 text-[#111827] hover:text-[#00843d]">{listing.title}</h3></Link>{showActions && <button type="button" aria-label="Save product" className="shrink-0 text-slate-400 hover:text-[#e31b23]" onClick={() => isAuthenticated ? save.mutate({ listingId: listing.id }) : toast.error("Sign in to save products")}><Heart size={18}/></button>}</div><div className="mt-3"><ProductPrice priceKobo={listing.priceKobo} compareAtPriceKobo={listing.compareAtPriceKobo}/></div><p className="mt-2 flex min-h-5 items-center gap-1 overflow-hidden"><TrustBadge verified={store.isVerified ?? true}/> <span className="min-w-0 truncate text-xs text-slate-500">{store.name}</span></p><p className="mt-1 flex min-h-5 items-center gap-1 overflow-hidden text-xs text-slate-500"><MapPin className="shrink-0" size={13}/><span className="truncate">{listing.location}</span></p>{showActions && <Button className="mt-auto w-full bg-[#e31b23] hover:bg-[#c9161d] disabled:bg-slate-300" size="sm" disabled={awaitingStock || add.isPending} onClick={() => isAuthenticated ? add.mutate({ listingId: listing.id, quantity: 1 }) : toast.error("Sign in to add products")}>{awaitingStock ? "Awaiting restock" : "Add to cart"}</Button>}</div></article>;
}

export function StorefrontHeader({ categories }: { categories: { id: number; name: string; slug: string }[] }) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(readRecentSearches);
  const [, go] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const suggestions = trpc.marketplace.suggestions.useQuery({ q: debouncedQuery }, { enabled: debouncedQuery.length >= 2 });
  const unread = trpc.notifications.unreadCount.useQuery(undefined, { enabled: isAuthenticated });
  useEffect(() => { const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 220); return () => window.clearTimeout(timer); }, [query]);
  const hasSuggestions = Boolean(suggestions.data && (suggestions.data.products.length || suggestions.data.stores.length || suggestions.data.categories.length));
  const submitSearch = (term = query) => { const normalized = term.trim(); if (!normalized) return; const next = [normalized, ...recentSearches.filter(item => item.toLocaleLowerCase() !== normalized.toLocaleLowerCase())].slice(0, 6); setRecentSearches(next); try { window.localStorage.setItem(recentSearchesKey, JSON.stringify(next)); } catch { /* Browser storage can be unavailable without preventing marketplace search. */ } setMobileOpen(false); go(`/explore?q=${encodeURIComponent(normalized)}`); };
  const clearRecentSearches = () => { setRecentSearches([]); try { window.localStorage.removeItem(recentSearchesKey); } catch { /* Ignore storage unavailability. */ } };
  const recentSearchPanel = <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xl"><div className="flex items-center justify-between gap-3 px-1 pb-2"><p className="text-xs font-extrabold uppercase tracking-[.12em] text-slate-500">Recent searches</p><button type="button" onClick={clearRecentSearches} className="text-xs font-bold text-[#00843d] hover:underline">Clear</button></div><div className="flex flex-wrap gap-2">{recentSearches.map(term => <button key={term} type="button" onClick={() => submitSearch(term)} className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-[#eaf7ef] hover:text-[#006b32]">{term}</button>)}</div></div>;
  const mobileLink = (href: string, label: string, accent = false) => <Link href={href} onClick={() => setMobileOpen(false)} className={`rounded-lg px-3 py-2 font-bold hover:bg-slate-50 ${accent ? "text-[#00843d] hover:bg-[#eaf7ef]" : ""}`}>{label}</Link>;

  return <>
    <div className="announcement">Shop from verified ESUT sellers <span>•</span> Campus pickup available</div>
    <header className="market-header">
      <div className="page-shell flex h-[76px] items-center gap-4">
        <Link href="/" className="flex shrink-0 items-center" aria-label="ESUT Marketplace home"><MarketplaceLogo className="h-12 w-12 sm:h-14 sm:w-14"/><span className="text-[11px] font-black leading-3 text-[#111827] sm:text-base sm:leading-4">ESUT<br/><em className="not-italic text-[#00843d]">Marketplace</em></span></Link>
        <div className="relative hidden flex-1 md:block">
          <form onSubmit={event => { event.preventDefault(); submitSearch(); }}><label className="searchbox"><Search size={19}/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search products, stores or categories" autoComplete="off"/><button type="submit">Search</button></label></form>
          {debouncedQuery.length >= 2 ? <div className="absolute left-0 right-0 top-[calc(100%+0.45rem)] z-40 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">{suggestions.isFetching ? <p className="px-4 py-3 text-sm text-slate-500">Searching marketplace…</p> : hasSuggestions ? <div className="divide-y divide-slate-100"><button type="button" onClick={() => submitSearch()} className="block w-full px-4 py-3 text-left text-sm font-bold text-[#00843d] hover:bg-[#eaf7ef]">Search marketplace for “{debouncedQuery}”</button>{suggestions.data?.products.map(product => <Link key={`product-${product.slug}`} href={`/product/${product.slug}`} onClick={() => setQuery("")} className="block px-4 py-3 text-sm hover:bg-slate-50"><span className="font-bold">{product.title}</span><span className="ml-2 text-xs text-slate-500">Product · {product.storeName}</span></Link>)}{suggestions.data?.stores.map(store => <Link key={`store-${store.slug}`} href={`/store/${store.slug}`} onClick={() => setQuery("")} className="block px-4 py-3 text-sm hover:bg-slate-50"><span className="font-bold">{store.name}</span><span className="ml-2 text-xs text-slate-500">Marketplace store</span></Link>)}{suggestions.data?.categories.map(category => <Link key={`category-${category.slug}`} href={`/category/${category.slug}`} onClick={() => setQuery("")} className="block px-4 py-3 text-sm hover:bg-slate-50"><span className="font-bold">{category.name}</span><span className="ml-2 text-xs text-slate-500">Category</span></Link>)}</div> : <p className="px-4 py-3 text-sm text-slate-500">No matching products, stores, or categories yet.</p>}</div> : recentSearches.length ? <div className="absolute left-0 right-0 top-[calc(100%+0.45rem)] z-40">{recentSearchPanel}</div> : null}
        </div>
        <nav className="ml-auto hidden items-center gap-4 lg:flex">
          {isAuthenticated && <><Link href="/account/favorites" className="nav-icon"><Heart size={20}/><span>Favorites</span></Link><Link href="/account/notifications" className="nav-icon relative"><Bell size={20}/><span>Updates</span>{unread.data?.count ? <b className="absolute -right-2 -top-2 min-w-5 rounded-full bg-[#e31b23] px-1 text-center text-[10px] leading-5 text-white">{unread.data.count > 9 ? "9+" : unread.data.count}</b> : null}</Link></>}
          <Link href="/cart" className="nav-icon"><ShoppingCart size={20}/><span>Cart</span></Link><Link href={isAuthenticated ? "/account" : "/login"} className="nav-icon"><UsersRound size={20}/><span>{isAuthenticated ? user?.name?.split(" ")[0] ?? "Account" : "Login"}</span></Link><Link href="/sell"><Button className="bg-[#00843d] hover:bg-[#006b32]">Buy / Sell</Button></Link>
        </nav>
        <div className="ml-auto flex items-center gap-2 lg:hidden"><Link href="/cart"><ShoppingCart size={22}/></Link><button type="button" aria-label="Open navigation" className="rounded-lg p-2" onClick={() => setMobileOpen(value => !value)}>{mobileOpen ? <X size={23}/> : <Menu size={23}/>}</button></div>
      </div>
      {mobileOpen && <div className="border-t bg-white lg:hidden"><div className="page-shell grid gap-2 py-4"><form onSubmit={event => { event.preventDefault(); submitSearch(); }} className="mb-2 flex overflow-hidden rounded-xl border border-slate-300"><label className="flex min-w-0 flex-1 items-center gap-2 px-3"><Search size={17} className="text-slate-400"/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search marketplace" className="min-w-0 flex-1 py-2 text-sm outline-none" autoComplete="off"/></label><button type="submit" className="bg-[#e31b23] px-4 text-sm font-bold text-white">Search</button></form>{!query.trim() && recentSearches.length ? <div className="mb-2">{recentSearchPanel}</div> : null}{mobileLink("/explore", "Browse marketplace")}{isAuthenticated && <>{mobileLink("/account/favorites", "Favorites")}{mobileLink("/account/notifications", `Notifications${unread.data?.count ? ` (${unread.data.count})` : ""}`)}{mobileLink("/account/messages", "Messages")}</>}{mobileLink(isAuthenticated ? "/account" : "/login", isAuthenticated ? "My account" : "Login")}{mobileLink("/sell", "Buy / Sell", true)}</div></div>}
      <div className="border-t border-slate-100 bg-white"><div className="page-shell flex h-12 items-center gap-6 overflow-x-auto whitespace-nowrap text-sm font-semibold text-slate-600">{presentCategories(categories).map(category => <Link key={category.id} href={canonicalCategoryRoute(category)} className="hover:text-[#00843d]">{category.name}</Link>)}<Link href="/explore" className="text-[#00843d]">More</Link></div></div>
    </header>
  </>;
}

export function StorefrontFooter() {
  return <footer className="footer"><div className="page-shell grid gap-8 py-12 md:grid-cols-[1.5fr_1fr_1fr_1fr]"><div><div className="flex items-center gap-2"><MarketplaceLogo className="h-12 w-12"/><strong className="text-lg">ESUT Marketplace</strong></div><p className="mt-4 max-w-xs text-sm leading-6 text-emerald-100/75">Built for the ESUT community. Open to customers everywhere.</p></div><div><b>Marketplace</b><Link href="/explore">Browse products</Link><Link href="/sell">Buy / Sell</Link></div><div><b>Buyers</b><Link href="/account/orders">Orders</Link><Link href="/account/favorites">Favorites</Link></div><div><b>Trust & safety</b><Link href="/account/verification">Verification</Link><Link href="/sell">Seller requirements</Link><Link href="/support">Support</Link><Link href="/contact">Contact</Link><Link href="/terms">Terms</Link><Link href="/privacy">Privacy</Link></div></div><div className="border-t border-white/10"><div className="page-shell py-5 text-xs text-emerald-100/60">© 2026 ESUT Marketplace. Buy. Sell. Connect. Right from ESUT.</div></div></footer>;
}
