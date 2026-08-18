import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { ChevronDown, LogOut, Menu, Store } from "lucide-react";
import ThemePreferenceSelect from "@/components/ThemePreferenceSelect";
import type { LucideIcon } from "lucide-react";
import { Link, useLocation } from "wouter";

export type WorkspaceNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string | number;
};

type MarketplaceWorkspaceShellProps = {
  kind: "seller" | "buyer";
  eyebrow: string;
  title: string;
  subtitle: string;
  navItems: WorkspaceNavItem[];
  userName?: string | null;
  utility?: React.ReactNode;
  onLogout?: () => void;
  children: React.ReactNode;
};

export function MarketplaceWorkspaceShell({
  kind,
  eyebrow,
  title,
  subtitle,
  navItems,
  userName,
  utility,
  onLogout,
  children,
}: MarketplaceWorkspaceShellProps) {
  const [location] = useLocation();
  const { theme } = useTheme();
  useEffect(() => { const root = document.documentElement; root.classList.toggle("dark", theme === "dark"); root.dataset.theme = theme; }, [theme]);
  const sectionLabel = kind === "seller" ? "Seller portal" : "Buyer account";
  const initial = (userName?.trim().charAt(0) || "E").toUpperCase();

  const nav = (compact = false) => <nav aria-label={`${sectionLabel} navigation`} className={compact ? "grid gap-1" : "mt-7 grid gap-1"}>{navItems.map(item => {
    const active = location === item.href || (item.href !== "/account" && location.startsWith(`${item.href}/`));
    const Icon = item.icon;
    return <Link key={item.href} href={item.href} className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition ${active ? "bg-[#0f4c70] text-white shadow-sm" : "text-slate-200 hover:bg-white/10 hover:text-white"}`} aria-current={active ? "page" : undefined}><Icon size={18} /><span className="min-w-0 flex-1 truncate">{item.label}</span>{item.badge !== undefined ? <span className={`rounded-full px-2 py-0.5 text-xs font-extrabold ${active ? "bg-white/15 text-white" : "bg-[#f5b700] text-[#3b2b00]"}`}>{item.badge}</span> : null}</Link>;
  })}</nav>;

  return <div className="min-h-screen bg-[#f3f6f9] text-[#10263c] lg:flex">
    <aside className="hidden w-[264px] shrink-0 flex-col bg-[#08243b] px-4 py-6 lg:flex"><Link href="/" className="flex items-center gap-3 rounded-xl px-2 py-2 text-white"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00843d] text-lg font-black ring-1 ring-white/20">E</span><span><span className="block text-lg font-black leading-none">ESUT</span><span className="mt-1 block text-sm text-slate-300">Marketplace</span></span></Link><p className="mt-9 px-3 text-xs font-black uppercase tracking-[.16em] text-slate-400">{sectionLabel}</p>{nav()}<div className="mt-auto border-t border-white/10 pt-4"><div className="flex items-center gap-3 px-3 py-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0f4c70] text-sm font-black text-white">{initial}</span><div className="min-w-0"><p className="truncate text-sm font-bold text-white">{userName || "Marketplace member"}</p><p className="mt-0.5 text-xs text-slate-400">Secure account</p></div></div>{onLogout ? <Button variant="ghost" className="w-full justify-start text-slate-200 hover:bg-white/10 hover:text-white" onClick={onLogout}><LogOut size={17} /> Log out</Button> : null}</div></aside>
    <div className="min-w-0 flex-1"><header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6 lg:px-8"><div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4"><div className="lg:hidden"><details className="relative"><summary className="flex list-none items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold marker:hidden"><Menu size={18} /> Menu <ChevronDown size={15} /></summary><div className="absolute left-0 top-12 z-50 w-72 rounded-2xl bg-[#08243b] p-3 shadow-2xl">{nav(true)}{onLogout ? <Button variant="ghost" className="mt-2 w-full justify-start text-slate-200 hover:bg-white/10 hover:text-white" onClick={onLogout}><LogOut size={17} /> Log out</Button> : null}</div></details></div><Link href="/" className="hidden items-center gap-2 text-sm font-black text-[#08243b] lg:flex"><Store size={18} className="text-[#00843d]" /> ESUT Marketplace</Link><div className="ml-auto flex items-center gap-3"><ThemePreferenceSelect compact />{utility}<span className="hidden h-9 w-9 items-center justify-center rounded-full bg-[#eaf7ef] text-sm font-black text-[#006b32] sm:flex">{initial}</span></div></div></header>
      <main className="mx-auto w-full max-w-[1440px] p-4 sm:p-6 lg:p-8"><div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-black uppercase tracking-[.16em] text-[#00843d]">{eyebrow}</p><h1 className="mt-2 text-3xl font-black tracking-tight text-[#10263c] sm:text-4xl">{title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{subtitle}</p></div></div>{children}</main>
    </div>
  </div>;
}
