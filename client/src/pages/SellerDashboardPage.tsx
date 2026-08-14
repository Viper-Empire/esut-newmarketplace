import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { naira } from "@/lib/marketplace";
import { BarChart3, Boxes, LogOut, PackageCheck, PackagePlus, Settings, Store, Truck } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

export default function SellerDashboardPage() {
  const { user, loading, logout } = useAuth(); const [, navigate] = useLocation();
  const isSeller = ["SELLER", "ADMIN", "SUPER_ADMIN"].includes(user?.role ?? "");
  const orders = trpc.seller.orders.useQuery({ page: 1, limit: 8 }, { enabled: isSeller });
  const analytics = trpc.seller.analytics.useQuery(undefined, { enabled: isSeller });
  const signOut = async () => { try { await logout(); toast.success("You have been signed out."); navigate("/"); } catch { toast.error("Unable to sign out. Please try again."); } };
  if (loading) return <main className="page-shell py-16">Loading seller workspace…</main>;
  if (!user) return <main className="page-shell py-20 text-center"><h1 className="text-3xl font-extrabold">Sign in to access seller tools</h1><Link href="/sell" className="mt-4 inline-block font-bold text-[#00843d]">Apply to sell</Link></main>;
  if (!isSeller) return <main className="page-shell py-20 text-center"><Store className="mx-auto text-[#00843d]" size={42} /><h1 className="mt-4 text-3xl font-extrabold">Seller approval required</h1><p className="mt-2 text-slate-600">Your store becomes available after an administrator approves your application.</p><Link href="/sell" className="mt-5 inline-block font-bold text-[#e31b23]">Check seller application</Link></main>;
  const records = orders.data ?? [];
  return <main className="page-shell py-8">
    <div className="flex items-start justify-between gap-4"><div><p className="eyebrow text-[#00843d]">SELLER WORKSPACE</p><h1 className="mt-2 text-3xl font-extrabold">Store operations</h1><p className="mt-2 text-slate-600">Manage only the store, listings, stock, and orders you own.</p></div><Button variant="outline" onClick={signOut}><LogOut size={17} />Logout</Button></div>
    <div className="mt-7 grid gap-4 sm:grid-cols-3"><Metric icon={<PackageCheck className="text-[#00843d]" />} value={analytics.data?.totalOrders ?? "—"} label="Total orders" /><Metric icon={<Truck className="text-[#f5b700]" />} value={analytics.data?.activeOrders ?? "—"} label="Active fulfilment" /><Metric icon={<Store className="text-[#e31b23]" />} value={analytics.data ? naira(analytics.data.completedSalesKobo) : "—"} label="Completed sales" /></div>
    <section className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><WorkspaceLink href="/seller/store" icon={<Store />} title="Store profile" copy="Manage store contact, description, and location." /><WorkspaceLink href="/seller/products" icon={<PackagePlus />} title="Products" copy="Create, edit, upload images, publish, and unpublish listings." /><WorkspaceLink href="/seller/inventory" icon={<Boxes />} title="Inventory" copy="Maintain stock while preserving quantities reserved for orders." /><WorkspaceLink href="/seller/orders" icon={<Truck />} title="Orders" copy="Confirm, prepare, mark ready, and complete campus pickup." /><WorkspaceLink href="/seller/analytics" icon={<BarChart3 />} title="Analytics" copy="View real order and completed-sales totals." /><WorkspaceLink href="/seller/settings" icon={<Settings />} title="Seller settings" copy="Review store configuration and protected account controls." /></section>
    <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"><div className="flex items-center justify-between"><h2 className="font-bold">Recent orders</h2><Link href="/seller/orders" className="text-sm font-bold text-[#00843d]">View all</Link></div>{orders.isLoading ? <p className="mt-5 text-sm text-slate-500">Loading orders…</p> : records.length ? <div className="mt-4 divide-y">{records.map(({ order }) => <Link href={`/seller/orders/${order.publicId}`} className="flex items-center justify-between gap-4 py-4" key={order.id}><div><p className="font-bold">{order.publicId}</p><p className="mt-1 text-sm text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</p></div><div className="text-right"><p className="font-bold">{naira(order.totalKobo)}</p><span className="text-xs font-bold text-[#00843d]">{order.status.replaceAll("_", " ")}</span></div></Link>)}</div> : <p className="mt-5 text-sm text-slate-500">No orders have been received yet.</p>}</section>
  </main>;
}

function Metric({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) { return <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">{icon}<p className="mt-4 text-2xl font-extrabold">{value}</p><span className="text-sm text-slate-500">{label}</span></div>; }
function WorkspaceLink({ href, icon, title, copy }: { href: string; icon: React.ReactNode; title: string; copy: string }) { return <Link href={href} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:ring-[#00843d]/30"><span className="text-[#00843d]">{icon}</span><h2 className="mt-4 font-extrabold">{title}</h2><p className="mt-1 text-sm text-slate-500">{copy}</p></Link>; }
