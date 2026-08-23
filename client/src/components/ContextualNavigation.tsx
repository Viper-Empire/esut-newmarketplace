import { ArrowLeft, LayoutDashboard, Search } from "lucide-react";
import { Link, useLocation } from "wouter";

type NavigationContext = { backHref: string; backLabel: string; sectionHref?: string; sectionLabel?: string };

function contextFor(path: string): NavigationContext | null {
  if (path === "/" || path === "/explore" || path === "/account" || path === "/seller" || path === "/admin") return null;
  if (path.startsWith("/product/") || path.startsWith("/store/")) return null;
  if (path.startsWith("/category/")) return { backHref: "/explore", backLabel: "Back to marketplace" };
  if (path === "/cart") return { backHref: "/explore", backLabel: "Continue shopping" };
  if (path === "/checkout") return { backHref: "/cart", backLabel: "Back to cart" };
  if (path === "/sell") return { backHref: "/", backLabel: "Back to marketplace" };
  if (path.startsWith("/seller/products/")) return { backHref: "/seller/products", backLabel: "Back to my listings", sectionHref: "/seller", sectionLabel: "Seller workspace" };
  if (path.startsWith("/seller/orders/")) return { backHref: "/seller/orders", backLabel: "Back to seller orders", sectionHref: "/seller", sectionLabel: "Seller workspace" };
  if (path.startsWith("/seller/messages")) return { backHref: "/seller/messages", backLabel: "Back to seller messages", sectionHref: "/seller", sectionLabel: "Seller workspace" };
  if (path.startsWith("/seller/")) return { backHref: "/seller", backLabel: "Back to seller workspace" };
  if (path.startsWith("/admin/users/")) return { backHref: "/admin/users", backLabel: "Back to users", sectionHref: "/admin", sectionLabel: "Admin overview" };
  if (path.startsWith("/admin/orders/")) return { backHref: "/admin/orders", backLabel: "Back to orders", sectionHref: "/admin", sectionLabel: "Admin overview" };
  if (path.startsWith("/admin/")) return { backHref: "/admin", backLabel: "Back to admin overview" };
  if (path.startsWith("/account/orders/")) return { backHref: "/account/orders", backLabel: "Back to my orders", sectionHref: "/account", sectionLabel: "Account overview" };
  if (path.startsWith("/account/messages/")) return { backHref: "/account/messages", backLabel: "Back to messages", sectionHref: "/account", sectionLabel: "Account overview" };
  if (path.startsWith("/account/")) return { backHref: "/account", backLabel: "Back to account overview" };
  if (path === "/forgot-password" || path === "/reset-password" || path === "/verify-email") return { backHref: "/login", backLabel: "Back to sign in" };
  return null;
}

export default function ContextualNavigation() {
  const [path] = useLocation();
  const context = contextFor(path);
  if (!context) return null;
  return <nav aria-label="Page navigation" className="page-shell pt-4 sm:pt-5"><div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white/90 p-2 shadow-sm backdrop-blur"><Link href={context.backHref} className="inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-extrabold text-[#006b32] transition hover:bg-[#eaf7ef] focus:outline-none focus:ring-2 focus:ring-[#00843d]" aria-label={context.backLabel}><ArrowLeft size={16}/>{context.backLabel}</Link>{context.sectionHref ? <Link href={context.sectionHref} className="inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#00843d]"><LayoutDashboard size={16}/>{context.sectionLabel}</Link> : null}<Link href="/explore" className="ml-auto inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#00843d]"><Search size={16}/>Browse marketplace</Link></div></nav>;
}

export { contextFor };
