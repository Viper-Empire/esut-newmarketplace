import { useAuth } from "@/_core/hooks/useAuth";
import { Activity, BarChart3, Bell, BookOpenCheck, ClipboardCheck, Flag, Gavel, History, LayoutDashboard, PackageCheck, RefreshCw, Settings, ShieldCheck, ShieldEllipsis, Store, UserCog, Users } from "lucide-react";
import { Link, useLocation } from "wouter";

type AdminLink = { href: string; label: string; icon: React.ElementType; superAdmin?: boolean };

const groups: Array<{ label: string; links: AdminLink[] }> = [
  { label: "Command center", links: [{ href: "/admin", label: "Overview", icon: LayoutDashboard }, { href: "/admin/operations", label: "Operations", icon: Activity }, { href: "/admin/analytics", label: "Analytics", icon: BarChart3 }] },
  { label: "Marketplace management", links: [{ href: "/admin/users", label: "Users", icon: Users }, { href: "/admin/sellers", label: "Sellers", icon: UserCog }, { href: "/admin/stores", label: "Stores", icon: Store }, { href: "/admin/listings", label: "Moderation", icon: PackageCheck }, { href: "/admin/categories", label: "Categories", icon: BookOpenCheck }, { href: "/admin/orders", label: "Orders", icon: ClipboardCheck }, { href: "/admin/reservations", label: "Reservations", icon: RefreshCw }, { href: "/admin/offers", label: "Offers", icon: ClipboardCheck }] },
  { label: "Trust & safety", links: [{ href: "/admin/verifications", label: "Verifications", icon: ShieldCheck }, { href: "/admin/reports", label: "Reports", icon: Flag }, { href: "/admin/disputes", label: "Disputes", icon: Gavel }, { href: "/admin/reviews", label: "Reviews", icon: ClipboardCheck }] },
  { label: "System control", links: [{ href: "/admin/notifications", label: "Notifications", icon: Bell }, { href: "/admin/audit-logs", label: "Audit log", icon: History }, { href: "/admin/security", label: "Security", icon: ShieldEllipsis }, { href: "/admin/recovery", label: "Recovery", icon: RefreshCw }, { href: "/admin/settings", label: "Settings", icon: Settings }, { href: "/admin/staff", label: "Staff roles", icon: Users, superAdmin: true }] },
];

const isCurrent = (pathname: string, href: string) => href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

export default function AdminControlCenterNav() {
  const { user, loading } = useAuth();
  const [location] = useLocation();
  const pathname = location.split("?")[0] ?? location;
  if (loading || !pathname.startsWith("/admin") || !["ADMIN", "SUPER_ADMIN"].includes(user?.role ?? "")) return null;

  return <aside aria-label="Administration control center navigation" className="border-b border-[#d4e7da] bg-[#f7fbf8]"><div className="page-shell py-3"><div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between"><div className="shrink-0"><p className="text-[10px] font-black uppercase tracking-[.15em] text-[#006b32]">ESUT Marketplace</p><p className="mt-1 text-sm font-black text-[#08243b]">Administration control center</p></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{groups.map(group => <section key={group.label}><p className="mb-1.5 text-[10px] font-black uppercase tracking-[.12em] text-slate-500">{group.label}</p><div className="flex flex-wrap gap-1.5">{group.links.filter(link => !link.superAdmin || user?.role === "SUPER_ADMIN").map(link => { const Icon = link.icon; const active = isCurrent(pathname, link.href); return <Link key={link.href} href={link.href} aria-current={active ? "page" : undefined} className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-[#00843d]/35 ${active ? "bg-[#00843d] text-white shadow-sm" : "bg-white text-[#315244] ring-1 ring-[#cfe3d5] hover:bg-[#e8f7ee] hover:text-[#006b32]"}`}><Icon size={13}/>{link.label}</Link>; })}</div></section>)}</div></div></div></aside>;
}
