import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { naira } from "@/lib/marketplace";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Flag, MapPin, Package, ShieldCheck, Store } from "lucide-react";
import { useState } from "react";
import { Link, useRoute } from "wouter";
import { toast } from "sonner";

type ReviewSort = "RECENT" | "RATING";

function ReviewSortControls({ value, onChange }: { value: ReviewSort; onChange: (value: ReviewSort) => void }) {
  return <div role="group" aria-label="Sort buyer reviews" className="mt-4 flex flex-wrap gap-2">
    <button type="button" aria-pressed={value === "RECENT"} onClick={() => onChange("RECENT")} className={`rounded-full px-3 py-2 text-sm font-extrabold transition focus:outline-none focus:ring-2 focus:ring-[#00843d]/30 ${value === "RECENT" ? "bg-[#08243b] text-white" : "bg-white text-slate-700 ring-1 ring-slate-200 hover:ring-[#00843d]/40"}`}>Most recent</button>
    <button type="button" aria-pressed={value === "RATING"} onClick={() => onChange("RATING")} className={`rounded-full px-3 py-2 text-sm font-extrabold transition focus:outline-none focus:ring-2 focus:ring-[#00843d]/30 ${value === "RATING" ? "bg-[#08243b] text-white" : "bg-white text-slate-700 ring-1 ring-slate-200 hover:ring-[#00843d]/40"}`}>Highest rated</button>
  </div>;
}

export default function StorePage() {
  const [, params] = useRoute("/store/:slug");
  const { isAuthenticated } = useAuth();
  const [reviewSort, setReviewSort] = useState<ReviewSort>("RECENT");
  const storeQuery = trpc.marketplace.store.useQuery({ slug: params?.slug ?? "", reviewSort }, { enabled: Boolean(params?.slug) });
  const report = trpc.support.report.useMutation({ onSuccess: () => toast.success("Report submitted for administrator review."), onError: error => toast.error(error.message) });
  const reminder = trpc.reminders.create.useMutation({ onSuccess: () => toast.success("Reminder set for tomorrow. It does not reserve this product."), onError: error => toast.error(error.message) });
  const reportItem = (targetType: "STORE" | "REVIEW", targetId: number) => {
    if (!isAuthenticated) { toast.error("Sign in to submit a report."); return; }
    const reason = window.prompt("Brief reason for this report:");
    const details = window.prompt("Describe the concern (at least 10 characters):");
    if (reason?.trim() && details?.trim()) report.mutate({ targetType, targetId, reason: reason.trim(), details: details.trim() });
  };

  if (storeQuery.isLoading) return <main className="page-shell py-16">Loading store…</main>;
  if (storeQuery.isError) return <main className="page-shell py-20 text-center" role="alert"><Store className="mx-auto text-slate-400" size={42}/><h1 className="mt-4 text-3xl font-extrabold">We could not load this store</h1><p className="mx-auto mt-2 max-w-md text-slate-600">The seller page could not be retrieved right now. Try again or browse the marketplace.</p><div className="mt-6 flex justify-center gap-3"><Button variant="outline" onClick={() => storeQuery.refetch()}>Try again</Button><Link href="/explore"><Button className="bg-[#e31b23]">Browse marketplace</Button></Link></div></main>;
  if (!storeQuery.data) return <main className="page-shell py-20 text-center"><Store className="mx-auto text-slate-400" size={42}/><h1 className="mt-4 text-3xl font-extrabold">Store unavailable</h1><Link href="/explore"><Button className="mt-6 bg-[#e31b23]">Browse marketplace</Button></Link></main>;

  const { store, products, reviews } = storeQuery.data;
  return <main className="min-h-screen bg-[#f7f9fc]"><div className="page-shell py-8">
    <Link href="/explore" className="inline-flex items-center gap-2 text-sm font-bold text-[#00843d]"><ArrowLeft size={16}/>Marketplace</Link>
    <section className="mt-5 rounded-3xl bg-[#111827] p-7 text-white sm:p-10"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div className="flex gap-4"><span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#00843d]"><Store size={28}/></span><div><p className="flex items-center gap-1 text-sm font-bold text-[#f5b700]">{store.isVerified && <ShieldCheck size={16}/>}VERIFIED ESUT SELLER</p><h1 className="mt-2 text-3xl font-extrabold">{store.name}</h1><p className="mt-2 flex items-center gap-1 text-sm text-slate-300"><MapPin size={15}/>{store.location}</p></div></div><Button variant="outline" className="border-white/30 text-white hover:bg-white hover:text-[#111827]" onClick={() => reportItem("STORE", store.id)}><Flag size={16}/>Report store</Button></div>{store.description && <p className="mt-6 max-w-3xl leading-7 text-slate-200">{store.description}</p>}</section>
    <section className="mt-8"><div className="flex items-end justify-between"><div><p className="eyebrow text-[#00843d]">STORE CATALOGUE</p><h2 className="mt-2 text-2xl font-extrabold">Active listings</h2></div><span className="text-sm text-slate-500">{products.length} available</span></div>{products.length ? <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{products.map(({ listing, image }) => <Link key={listing.id} href={`/product/${listing.slug}`} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 hover:-translate-y-0.5"><div className="product-visual aspect-[1/.75]">{image?.url ? <img src={image.url} alt={listing.title} className="h-full w-full object-cover"/> : <Package size={38}/>}</div><div className="p-4"><h3 className="line-clamp-2 font-extrabold">{listing.title}</h3><p className="mt-3 text-lg font-extrabold text-[#e31b23]">{naira(listing.priceKobo)}</p></div></Link>)}</div> : <div className="mt-5 rounded-2xl bg-white p-8 text-center text-slate-500 shadow-sm ring-1 ring-slate-200">This verified seller has no active listings at the moment.</div>}</section>
    <section className="mt-10 max-w-3xl"><p className="eyebrow text-[#e31b23]">VERIFIED PURCHASES</p><div className="mt-2 flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><h2 className="text-2xl font-extrabold">Buyer reviews</h2><p className="mt-1 text-sm text-slate-600">Published reviews from verified completed purchases.</p></div><p className="text-sm text-slate-500">{reviews.length} shown</p></div><ReviewSortControls value={reviewSort} onChange={setReviewSort}/>{reviews.length ? <div className="mt-5 space-y-4">{reviews.map(({ review, buyer, listing, image, availability }) => <article key={review.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><div className="flex items-start justify-between gap-3"><div><p className="font-extrabold">{listing.title} · {"★".repeat(review.rating)}</p><p className="mt-1 text-sm text-slate-500">Verified purchase · Reviewed by {buyer.name ?? "Verified buyer"}</p></div><button type="button" className="text-xs font-bold text-slate-500 hover:text-[#e31b23]" onClick={() => reportItem("REVIEW", review.id)}>Report review</button></div>{review.title && <p className="mt-3 font-semibold text-slate-800">{review.title}</p>}<p className="mt-3 text-sm text-slate-700">{review.comment ?? "No written comment."}</p>{review.sellerResponse && <p className="mt-3 rounded-xl bg-[#eaf7ef] p-3 text-sm"><b>Seller response:</b> {review.sellerResponse}</p>}<div className="mt-4 flex items-center gap-3 rounded-xl bg-slate-50 p-3">{image?.url ? <img src={image.url} alt="" className="h-12 w-12 rounded-lg object-cover"/> : <Package className="h-12 w-12 rounded-lg bg-white p-3 text-[#00843d]"/>}<div className="min-w-0 flex-1"><p className="text-xs font-black uppercase tracking-[.1em] text-[#00843d]">Purchased product</p><p className="truncate font-bold">{listing.title} · {naira(listing.priceKobo)}</p><p className="text-xs text-slate-500">{availability.availableUnits ? `${availability.availableUnits} currently available` : "Currently unavailable"}</p></div>{listing.status === "ACTIVE" && availability.availableUnits > 0 ? <Link href={`/product/${listing.slug}`}><Button size="sm" className="bg-[#00843d]">View product</Button></Link> : <div className="flex flex-wrap justify-end gap-2"><Button size="sm" variant="outline" disabled={reminder.isPending} onClick={() => { if (!isAuthenticated) return toast.error("Sign in to set a reminder."); reminder.mutate({ listingId: listing.id, reminderType: "TOMORROW" }); }}>Remind tomorrow</Button><Link href={`/explore?q=${encodeURIComponent(listing.title)}`}><Button size="sm" variant="outline">Similar</Button></Link></div>}</div></article>)}</div> : <p className="mt-5 rounded-2xl bg-white p-6 text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">There are no published verified-purchase reviews for this store yet.</p>}</section>
  </div></main>;
}
