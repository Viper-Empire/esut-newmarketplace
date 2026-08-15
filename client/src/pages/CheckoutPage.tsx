import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { naira } from "@/lib/marketplace";
import { CheckCircle2, MapPin, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

export default function CheckoutPage() {
  const { isAuthenticated } = useAuth();
  const [, go] = useLocation();
  const [note, setNote] = useState("");
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
  const cart = trpc.cart.get.useQuery(undefined, { enabled: isAuthenticated });
  const place = trpc.checkout.place.useMutation({
    onSuccess: data => {
      toast.success(`Order ${data.orderIds.join(", ")} placed for campus pickup.`);
      go("/account/orders");
    },
    onError: error => {
      setIdempotencyKey(crypto.randomUUID());
      toast.error(error.message);
    },
  });

  if (!isAuthenticated) return <main className="page-shell py-20 text-center"><h1 className="text-3xl font-extrabold">Sign in to checkout</h1><p className="mt-3 text-slate-600">Your protected checkout uses your authenticated account.</p><Link href="/cart"><Button className="mt-6 bg-[#e31b23]">Back to cart</Button></Link></main>;
  if (cart.isLoading) return <main className="page-shell py-16">Loading your checkout…</main>;
  if (cart.isError) return <main className="page-shell py-16"><div role="alert" className="rounded-2xl bg-[#fff3f3] p-8 text-center text-[#b91c1c] ring-1 ring-[#fecaca]"><h1 className="text-xl font-extrabold">We could not load checkout</h1><p className="mt-2 text-sm">Try again to retrieve your current cart before reviewing the campus-pickup order.</p><Button variant="outline" className="mt-4" onClick={() => cart.refetch()}>Try again</Button></div></main>;
  if (!cart.data?.items.length) return <main className="page-shell py-20 text-center"><h1 className="text-3xl font-extrabold">Your cart is empty</h1><Link href="/"><Button className="mt-6 bg-[#e31b23]">Continue shopping</Button></Link></main>;

  return <main className="page-shell py-8">
    <p className="eyebrow text-[#00843d]">SECURE CHECKOUT</p>
    <h1 className="mt-2 text-3xl font-extrabold">Campus pickup</h1>
    <div className="mt-7 grid gap-7 lg:grid-cols-[1fr_350px]">
      <section className="space-y-5">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"><h2 className="text-lg font-bold">Pickup method</h2><div className="mt-4 flex items-start gap-3 rounded-xl border-2 border-[#00843d] bg-[#eaf7ef] p-4"><MapPin className="mt-0.5 text-[#00843d]" /><div><b>Campus pickup</b><p className="mt-1 text-sm text-slate-600">Arrange a safe ESUT campus collection point with the seller after your order is confirmed.</p></div></div></div>
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"><h2 className="text-lg font-bold">Payment method</h2><div className="mt-4 flex items-start gap-3 rounded-xl border bg-slate-100 p-4"><ShieldCheck className="mt-0.5 text-[#00843d]" /><div><b>Cash on pickup</b><p className="mt-1 text-sm text-slate-600">No online payment is processed. Pay the seller only at agreed pickup.</p></div></div></div>
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"><label className="font-bold">Pickup note <span className="font-normal text-slate-400">(optional)</span></label><textarea value={note} onChange={event => setNote(event.target.value)} className="mt-3 min-h-28 w-full rounded-xl border p-3 outline-none focus:border-[#00843d]" placeholder="For example: I will be around the Faculty of Engineering at 2pm." /></div>
      </section>
      <aside className="h-fit rounded-2xl bg-[#111827] p-6 text-white"><h2 className="font-bold">Your order</h2>{cart.data.items.map(row => <div className="mt-4 flex justify-between gap-4 text-sm" key={row.item.id}><span className="text-slate-300">{row.listing.title} × {row.item.quantity}</span><b>{naira(row.listing.priceKobo * row.item.quantity)}</b></div>)}<div className="my-5 border-t border-white/15" /><div className="flex justify-between text-lg font-extrabold"><span>Total</span><span>{naira(cart.data.totalKobo)}</span></div><Button disabled={place.isPending} onClick={() => place.mutate({ pickupNote: note || undefined, idempotencyKey })} className="mt-6 w-full bg-[#e31b23] hover:bg-[#c9161d]">Place order <CheckCircle2 size={17} /></Button><p className="mt-4 text-center text-xs text-slate-400">The server independently recalculates all item prices and reserves stock before creating an order.</p></aside>
    </div>
  </main>;
}
