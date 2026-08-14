import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { BadgeCheck, Bell, Heart, LogOut, MessageCircle, PackageCheck, ShieldCheck, ShoppingCart, Star, Store, UserRound } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

export default function AccountPage() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [, navigate] = useLocation();
  const signOut = async () => { try { await logout(); toast.success("You have been signed out."); navigate("/"); } catch { toast.error("Unable to sign out. Please try again."); } };
  if (loading) return <main className="page-shell py-16">Loading your account…</main>;
  if (!isAuthenticated || !user) return <main className="page-shell py-20 text-center"><UserRound className="mx-auto text-[#00843d]" size={42} /><h1 className="mt-4 text-3xl font-extrabold">Sign in to access your account</h1><p className="mt-2 text-slate-600">Your buyer dashboard and marketplace tools are private to your secure account.</p><Link href="/login"><Button className="mt-6 bg-[#e31b23]">Log in</Button></Link><Link href="/register" className="mt-4 block text-sm font-bold text-[#00843d]">Create an account</Link></main>;
  const role = user.role.replaceAll("_", " ");
  const isSeller = ["SELLER", "ADMIN", "SUPER_ADMIN"].includes(user.role);
  const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(user.role); const isModerator = ["MODERATOR", "ADMIN", "SUPER_ADMIN"].includes(user.role);
  return <main className="page-shell py-8">
    <div className="flex flex-col gap-5 rounded-3xl bg-[#111827] p-7 text-white sm:flex-row sm:items-start sm:justify-between sm:p-10"><div><p className="eyebrow text-[#f5b700]">MY ACCOUNT</p><h1 className="mt-3 text-3xl font-extrabold">Welcome, {user.name ?? "ESUT Marketplace member"}</h1><p className="mt-3 text-slate-300">Your approved access level: <strong className="text-white">{role}</strong></p></div><Button variant="outline" onClick={signOut} className="border-white/30 text-white hover:bg-white hover:text-[#111827]"><LogOut size={17} /> Logout</Button></div>
    {user.loginMethod !== "password" && <section className="mt-6 flex flex-col gap-3 rounded-2xl border border-[#00843d]/25 bg-[#eaf7ef] p-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-bold text-[#14532d]">Set your ESUT Marketplace password</h2><p className="mt-1 text-sm text-[#166534]">You can claim password login with this account’s email. Your existing role, store, orders, and data will remain unchanged.</p></div><Button asChild className="bg-[#00843d] hover:bg-[#006b32]"><Link href="/register">Claim password login</Link></Button></section>}
    <section className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Link href="/cart" className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1"><ShoppingCart className="text-[#e31b23]" /><h2 className="mt-4 font-bold">Cart</h2><p className="mt-1 text-sm text-slate-500">Review items before campus-pickup checkout.</p></Link>
      <Link href="/account/orders" className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1"><PackageCheck className="text-[#00843d]" /><h2 className="mt-4 font-bold">Orders</h2><p className="mt-1 text-sm text-slate-500">Track campus-pickup orders and their current status.</p></Link>
      <Link href="/account/favorites" className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1"><Heart className="text-[#e31b23]" /><h2 className="mt-4 font-bold">Saved favorites</h2><p className="mt-1 text-sm text-slate-500">Compare the products you saved.</p></Link>
      <Link href="/account/offers" className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1"><ShoppingCart className="text-[#e31b23]" /><h2 className="mt-4 font-bold">My offers</h2><p className="mt-1 text-sm text-slate-500">Track seller responses to your offers.</p></Link>
      <Link href="/account/messages" className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1"><MessageCircle className="text-[#00843d]" /><h2 className="mt-4 font-bold">Messages</h2><p className="mt-1 text-sm text-slate-500">Discuss listings safely with sellers.</p></Link>
      <Link href="/account/notifications" className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1"><Bell className="text-[#00843d]" /><h2 className="mt-4 font-bold">Notifications</h2><p className="mt-1 text-sm text-slate-500">See real updates tied to your account.</p></Link>
      <Link href="/account/reviews" className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1"><Star className="text-[#f5b700]" /><h2 className="mt-4 font-bold">Reviews</h2><p className="mt-1 text-sm text-slate-500">Review your completed purchases.</p></Link>
      {isSeller && <Link href="/seller" className="rounded-2xl bg-[#eaf7ef] p-6 ring-1 ring-[#00843d]/20 transition hover:-translate-y-1"><Store className="text-[#00843d]" /><h2 className="mt-4 font-bold">Seller workspace</h2><p className="mt-1 text-sm text-slate-600">Manage your approved seller operations.</p></Link>}
      {isAdmin && <Link href="/admin" className="rounded-2xl bg-[#fff3f3] p-6 ring-1 ring-[#e31b23]/20 transition hover:-translate-y-1"><BadgeCheck className="text-[#e31b23]" /><h2 className="mt-4 font-bold">Administrator workspace</h2><p className="mt-1 text-sm text-slate-600">Review marketplace seller applications.</p></Link>}
      {isModerator && <Link href="/moderator" className="rounded-2xl bg-[#fff7e6] p-6 ring-1 ring-[#f5b700]/30 transition hover:-translate-y-1"><ShieldCheck className="text-[#8a6500]" /><h2 className="mt-4 font-bold">Moderator workspace</h2><p className="mt-1 text-sm text-slate-600">Triage reports, listings, and review safety.</p></Link>}
      {!isSeller && <Link href="/sell" className="rounded-2xl bg-[#eaf7ef] p-6 ring-1 ring-[#00843d]/20 transition hover:-translate-y-1"><PackageCheck className="text-[#00843d]" /><h2 className="mt-4 font-bold">Become a seller</h2><p className="mt-1 text-sm text-slate-600">Apply for protected administrator review.</p></Link>}
    </section>
  </main>;
}
