import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { condition, naira } from "@/lib/marketplace";
import { trpc } from "@/lib/trpc";
import { BadgeCheck, Bell, Heart, MapPin, Menu, Package, Search, ShoppingCart, UsersRound, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

const logo = "/manus-storage/esut-main-logo_0f99c6ab.png";
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
  image?: { url: string; altText?: string | null } | null;
};

export function ProductPrice({ priceKobo, compareAtPriceKobo }: { priceKobo: number; compareAtPriceKobo?: number | null }) {
  return <div className="flex items-end gap-2"><strong className="text-lg text-[#e31b23]">{naira(priceKobo)}</strong>{compareAtPriceKobo ? <span className="pb-0.5 text-xs text-slate-400 line-through">{naira(compareAtPriceKobo)}</span> : null}</div>;
}

export function TrustBadge({ verified = true }: { verified?: boolean }) {
  return <span className={`inline-flex items-center gap-1 text-xs font-bold ${verified ? "text-[#00843d]" : "text-slate-500"}`}><BadgeCheck size={14}/>{verified ? "Verified seller" : "Seller"}</span>;
}

export function StorefrontEmptyState({ icon, children, className = "" }: { icon?: ReactNode; children: ReactNode; className?: string }) {
  return <div className={`empty-panel ${className}`}>{icon ?? <Package size={34}/>}<p>{children}</p></div>;
}

export function StorefrontProductCard({ row, showActions = true, compact = false }: { row: StorefrontListingRow; showActions?: boolean; compact?: boolean }) {
  const { listing, store, image } = row; const { isAuthenticated } = useAuth(); const [, go] = useLocation();
  const add = trpc.cart.add.useMutation({ onSuccess: () => { toast.success("Added to cart"); go("/cart"); }, onError: error => toast.error(error.message) });
  const save = trpc.favorites.toggle.useMutation({ onSuccess: data => toast.success(data.favorited ? "Saved to favorites" : "Removed from favorites"), onError: () => toast.error("Sign in to save products") });
  const discount = listing.compareAtPriceKobo ? Math.round((1 - listing.priceKobo / listing.compareAtPriceKobo) * 100) : 0;
  return <article className="product-card"><Link href={`/product/${listing.slug}`}><div className={`product-visual relative ${compact ? "aspect-[1/.75]" : "aspect-[1/.8]"}`}>{image?.url ? <img src={image.url} alt={image.altText ?? listing.title} className="h-full w-full object-cover"/> : <Package size={compact ? 43 : 46} strokeWidth={1.3}/>}<span className="absolute left-3 top-3 rounded-md bg-white/95 px-2 py-1 text-[10px] font-extrabold text-[#006b32]">{condition(listing.condition as Parameters<typeof condition>[0])}</span>{discount > 0 && <span className="absolute bottom-3 left-3 rounded-md bg-[#e31b23] px-2 py-1 text-[10px] font-extrabold text-white">-{discount}%</span>}</div></Link><div className="p-4"><div className="flex justify-between gap-2"><Link href={`/product/${listing.slug}`}><h3 className="line-clamp-2 font-bold leading-5 text-[#111827] hover:text-[#00843d]">{listing.title}</h3></Link>{showActions && <button type="button" aria-label="Save product" className="shrink-0 text-slate-400 hover:text-[#e31b23]" onClick={() => isAuthenticated ? save.mutate({ listingId: listing.id }) : toast.error("Sign in to save products")}><Heart size={18}/></button>}</div><div className="mt-3"><ProductPrice priceKobo={listing.priceKobo} compareAtPriceKobo={listing.compareAtPriceKobo}/></div><p className="mt-2"><TrustBadge verified={store.isVerified ?? true}/> <span className="ml-1 text-xs text-slate-500">{store.name}</span></p><p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><MapPin size={13}/>{listing.location}</p>{showActions && <Button className="mt-4 w-full bg-[#e31b23] hover:bg-[#c9161d]" size="sm" onClick={() => isAuthenticated ? add.mutate({ listingId: listing.id, quantity: 1 }) : toast.error("Sign in to add products")}>Add to cart</Button>}</div></article>;
}

export function StorefrontHeader({ categories }: { categories: { id: number; name: string; slug: string }[] }) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(readRecentSearches);
  const [, go] = useLocation();
  const { isAuthenticated, user } = useAuth();
  useEffect(() => { const root = document.documentElement; root.classList.remove("dark"); root.dataset.theme = "light"; }, []);
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
        <Link href="/" className="flex shrink-0 items-center"><img src={logo} alt="ESUT Marketplace" className="h-14 w-14 object-contain"/><span className="hidden text-base font-black leading-4 text-[#111827] sm:block">ESUT<br/><em className="not-italic text-[#00843d]">Marketplace</em></span></Link>
        <div className="relative hidden flex-1 md:block">
          <form onSubmit={event => { event.preventDefault(); submitSearch(); }}><label className="searchbox"><Search size={19}/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search products, stores or categories" autoComplete="off"/><button type="submit">Search</button></label></form>
          {debouncedQuery.length >= 2 ? <div className="absolute left-0 right-0 top-[calc(100%+0.45rem)] z-40 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">{suggestions.isFetching ? <p className="px-4 py-3 text-sm text-slate-500">Searching marketplace…</p> : hasSuggestions ? <div className="divide-y divide-slate-100"><button type="button" onClick={() => submitSearch()} className="block w-full px-4 py-3 text-left text-sm font-bold text-[#00843d] hover:bg-[#eaf7ef]">Search marketplace for “{debouncedQuery}”</button>{suggestions.data?.products.map(product => <Link key={`product-${product.slug}`} href={`/product/${product.slug}`} onClick={() => setQuery("")} className="block px-4 py-3 text-sm hover:bg-slate-50"><span className="font-bold">{product.title}</span><span className="ml-2 text-xs text-slate-500">Product · {product.storeName}</span></Link>)}{suggestions.data?.stores.map(store => <Link key={`store-${store.slug}`} href={`/store/${store.slug}`} onClick={() => setQuery("")} className="block px-4 py-3 text-sm hover:bg-slate-50"><span className="font-bold">{store.name}</span><span className="ml-2 text-xs text-slate-500">Marketplace store</span></Link>)}{suggestions.data?.categories.map(category => <Link key={`category-${category.slug}`} href={`/category/${category.slug}`} onClick={() => setQuery("")} className="block px-4 py-3 text-sm hover:bg-slate-50"><span className="font-bold">{category.name}</span><span className="ml-2 text-xs text-slate-500">Category</span></Link>)}</div> : <p className="px-4 py-3 text-sm text-slate-500">No matching products, stores, or categories yet.</p>}</div> : recentSearches.length ? <div className="absolute left-0 right-0 top-[calc(100%+0.45rem)] z-40">{recentSearchPanel}</div> : null}
        </div>
        <nav className="ml-auto hidden items-center gap-4 lg:flex">
          {isAuthenticated && <><Link href="/account/favorites" className="nav-icon"><Heart size={20}/><span>Favorites</span></Link><Link href="/account/notifications" className="nav-icon relative"><Bell size={20}/><span>Updates</span>{unread.data?.count ? <b className="absolute -right-2 -top-2 min-w-5 rounded-full bg-[#e31b23] px-1 text-center text-[10px] leading-5 text-white">{unread.data.count > 9 ? "9+" : unread.data.count}</b> : null}</Link></>}
          <Link href="/cart" className="nav-icon"><ShoppingCart size={20}/><span>Cart</span></Link><Link href={isAuthenticated ? "/account" : "/login"} className="nav-icon"><UsersRound size={20}/><span>{isAuthenticated ? user?.name?.split(" ")[0] ?? "Account" : "Login"}</span></Link><Link href="/sell"><Button className="bg-[#00843d] hover:bg-[#006b32]">Buy / Sell</Button></Link>
        </nav>
        <Link href="/cart" className="ml-auto lg:hidden"><ShoppingCart size={22}/></Link><button type="button" aria-label="Open navigation" className="lg:hidden" onClick={() => setMobileOpen(value => !value)}>{mobileOpen ? <X size={23}/> : <Menu size={23}/>}</button>
      </div>
      {mobileOpen && <div className="border-t bg-white lg:hidden"><div className="page-shell grid gap-2 py-4"><form onSubmit={event => { event.preventDefault(); submitSearch(); }} className="mb-2 flex overflow-hidden rounded-xl border border-slate-300"><label className="flex min-w-0 flex-1 items-center gap-2 px-3"><Search size={17} className="text-slate-400"/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search marketplace" className="min-w-0 flex-1 py-2 text-sm outline-none" autoComplete="off"/></label><button type="submit" className="bg-[#e31b23] px-4 text-sm font-bold text-white">Search</button></form>{!query.trim() && recentSearches.length ? <div className="mb-2">{recentSearchPanel}</div> : null}{mobileLink("/explore", "Browse marketplace")}{isAuthenticated && <>{mobileLink("/account/favorites", "Favorites")}{mobileLink("/account/notifications", `Notifications${unread.data?.count ? ` (${unread.data.count})` : ""}`)}{mobileLink("/account/messages", "Messages")}</>}{mobileLink(isAuthenticated ? "/account" : "/login", isAuthenticated ? "My account" : "Login")}{mobileLink("/sell", "Buy / Sell", true)}</div></div>}
      <div className="border-t border-slate-100 bg-white"><div className="page-shell flex h-12 items-center gap-6 overflow-x-auto whitespace-nowrap text-sm font-semibold text-slate-600">{categories.map(category => <Link key={category.id} href={`/category/${category.slug}`} className="hover:text-[#00843d]">{category.name}</Link>)}<Link href="/explore" className="text-[#00843d]">More</Link></div></div>
    </header>
  </>;
}

export function StorefrontFooter() {
  return <footer className="footer"><div className="page-shell grid gap-8 py-12 md:grid-cols-[1.5fr_1fr_1fr_1fr]"><div><div className="flex items-center gap-2"><img src={logo} alt="" className="h-12 w-12"/><strong className="text-lg">ESUT Marketplace</strong></div><p className="mt-4 max-w-xs text-sm leading-6 text-emerald-100/75">Built for the ESUT community. Open to customers everywhere.</p></div><div><b>Marketplace</b><Link href="/explore">Browse products</Link><Link href="/sell">Buy / Sell</Link></div><div><b>Buyers</b><Link href="/account/orders">Orders</Link><Link href="/account/favorites">Favorites</Link></div><div><b>Trust & safety</b><Link href="/account/verification">Verification</Link><Link href="/sell">Seller requirements</Link></div></div><div className="border-t border-white/10"><div className="page-shell py-5 text-xs text-emerald-100/60">© 2026 ESUT Marketplace. Buy. Sell. Connect. Right from ESUT.</div></div></footer>;
}
