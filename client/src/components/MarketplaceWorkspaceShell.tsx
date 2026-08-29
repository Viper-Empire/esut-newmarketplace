import { Button } from "@/components/ui/button";
import { ChevronDown, LogOut, Menu, Store } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";
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
  onLogout?: () => Promise<void> | void;
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
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const sectionLabel = kind === "seller" ? "Seller portal" : "Buyer account";
  const initial = (userName?.trim().charAt(0) || "E").toUpperCase();
  const handleLogout = async () => {
    if (!onLogout || isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await onLogout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  const nav = (compact = false) => <nav aria-label={`${sectionLabel} navigation`} className={compact ? "grid gap-1" : "mt-7 grid gap-1"}>{navItems.map(item => {
    const active = location === item.href || (item.href !== "/account" && location.startsWith(`${item.href}/`));
    const Icon = item.icon;
    return <Link key={item.href} href={item.href} className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition ${active ? "bg-[#e31b23] text-white shadow-sm" : "text-emerald-50/85 hover:bg-white/10 hover:text-white"}`} aria-current={active ? "page" : undefined}><Icon size={18} /><span className="min-w-0 flex-1 truncate">{item.label}</span>{item.badge !== undefined ? <span className={`rounded-full px-2 py-0.5 text-xs font-extrabold ${active ? "bg-white/15 text-white" : "bg-[#f5b700] text-[#3b2b00]"}`}>{item.badge}</span> : null}</Link>;
  })}</nav>;

  return <div className="dashboard-surface min-h-screen bg-[#f7faf8] text-[#122033] lg:flex">
    <aside className="dashboard-sidebar hidden w-[264px] shrink-0 flex-col bg-[#006b32] px-4 py-6 lg:flex"><Link href="/" className="flex items-center gap-3 rounded-xl px-2 py-2 text-white"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e31b23] text-lg font-black text-white ring-1 ring-white/20">E</span><span><span className="block text-lg font-black leading-none">ESUT</span><span className="mt-1 block text-sm text-emerald-100/80">Marketplace</span></span></Link><p className="mt-9 px-3 text-xs font-black uppercase tracking-[.16em] text-emerald-100/75">{sectionLabel}</p>{nav()}<div className="mt-auto border-t border-white/20 pt-4"><div className="flex items-center gap-3 px-3 py-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e31b23] text-sm font-black text-white">{initial}</span><div className="min-w-0"><p className="truncate text-sm font-bold text-white">{userName || "Marketplace member"}</p><p className="mt-0.5 text-xs text-emerald-100/75">Secure account</p></div></div>{onLogout ? <Button variant="ghost" className="w-full justify-start text-emerald-50/85 hover:bg-white/10 hover:text-white" onClick={() => void handleLogout()} disabled={isLoggingOut} aria-label="Log out of your account"><LogOut size={17} /> {isLoggingOut ? "Signing out…" : "Log out"}</Button> : null}</div></aside>
    <div className="min-w-0 flex-1"><header className="dashboard-header sticky top-0 z-30 border-b border-[#dcefe3] bg-white/95 px-4 py-3 backdrop-blur sm:px-6 lg:px-8"><div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4"><div className="lg:hidden"><details className="relative"><summary className="flex list-none items-center gap-2 rounded-xl border border-[#b9dcc6] bg-white px-3 py-2 text-sm font-bold text-[#006b32] marker:hidden"><Menu size={18} /> Menu <ChevronDown size={15} /></summary><div className="absolute left-0 top-12 z-50 w-72 rounded-2xl bg-[#006b32] p-3 shadow-2xl">{nav(true)}{onLogout ? <Button variant="ghost" className="mt-2 w-full justify-start text-emerald-50/85 hover:bg-white/10 hover:text-white" onClick={() => void handleLogout()} disabled={isLoggingOut} aria-label="Log out of your account"><LogOut size={17} /> {isLoggingOut ? "Signing out…" : "Log out"}</Button> : null}</div></details></div><Link href="/" className="hidden items-center gap-2 text-sm font-black text-[#006b32] lg:flex"><Store size={18} className="text-[#e31b23]" /> ESUT Marketplace</Link><div className="ml-auto flex items-center gap-2 sm:gap-3">{utility}{onLogout ? <Button type="button" variant="outline" className="inline-flex min-h-10 items-center gap-2 border-[#e31b23]/35 px-3 text-sm font-extrabold text-[#b91c1c] hover:bg-[#fff3f3] hover:text-[#991b1b]" onClick={() => void handleLogout()} disabled={isLoggingOut} aria-label="Log out of your account"><LogOut size={16} /> <span className="hidden sm:inline">{isLoggingOut ? "Signing out…" : "Log out"}</span></Button> : null}<span className="hidden h-9 w-9 items-center justify-center rounded-full bg-[#eaf7ef] text-sm font-black text-[#006b32] ring-1 ring-[#b9dcc6] sm:flex">{initial}</span></div></div></header>
      <main className="dashboard-main mx-auto w-full max-w-[1440px] p-4 sm:p-6 lg:p-8"><div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-black uppercase tracking-[.16em] text-[#00843d]">{eyebrow}</p><h1 className="mt-2 text-3xl font-black tracking-tight text-[#10263c] sm:text-4xl">{title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{subtitle}</p></div></div>{children}</main>
    </div>
  </div>;
}
