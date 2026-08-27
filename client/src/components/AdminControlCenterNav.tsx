import { useAuth } from "@/_core/hooks/useAuth";
import {
  Activity,
  BarChart3,
  Bell,
  BookOpenCheck,
  ClipboardCheck,
  Flag,
  Gavel,
  History,
  LayoutDashboard,
  Menu,
  PackageCheck,
  RefreshCw,
  Settings,
  ShieldCheck,
  ShieldEllipsis,
  Store,
  UserCog,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";

type AdminLink = { href: string; label: string; icon: React.ElementType; superAdmin?: boolean };
type AdminGroup = { label: string; links: AdminLink[] };

export const ADMIN_NAV_GROUPS: AdminGroup[] = [
  {
    label: "Command center",
    links: [
      { href: "/admin", label: "Overview", icon: LayoutDashboard },
      { href: "/admin/operations", label: "Operations", icon: Activity },
      { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Marketplace management",
    links: [
      { href: "/admin/users", label: "Users", icon: Users },
      { href: "/admin/sellers", label: "Sellers", icon: UserCog },
      { href: "/admin/stores", label: "Stores", icon: Store },
      { href: "/admin/listings", label: "Moderation", icon: PackageCheck },
      { href: "/admin/categories", label: "Categories", icon: BookOpenCheck },
      { href: "/admin/orders", label: "Orders", icon: ClipboardCheck },
      { href: "/admin/reservations", label: "Reservations", icon: RefreshCw },
      { href: "/admin/offers", label: "Offers", icon: ClipboardCheck },
    ],
  },
  {
    label: "Trust & safety",
    links: [
      { href: "/admin/reports", label: "Reports", icon: Flag },
      { href: "/admin/disputes", label: "Disputes", icon: Gavel },
      { href: "/admin/reviews", label: "Reviews", icon: ClipboardCheck },
      { href: "/admin/verifications", label: "Verifications", icon: ShieldCheck },
    ],
  },
  {
    label: "System control",
    links: [
      { href: "/admin/notifications", label: "Notifications", icon: Bell },
      { href: "/admin/audit-logs", label: "Audit log", icon: History },
      { href: "/admin/security", label: "Security", icon: ShieldEllipsis },
      { href: "/admin/recovery", label: "Recovery", icon: RefreshCw },
      { href: "/admin/settings", label: "Settings", icon: Settings },
      { href: "/admin/staff", label: "Staff roles", icon: Users, superAdmin: true },
    ],
  },
];

const isCurrent = (pathname: string, href: string) =>
  href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

const roleLabel = (role?: string | null) => {
  if (role === "SUPER_ADMIN") return "Super administrator";
  if (role === "ADMIN") return "Administrator";
  return role?.replaceAll("_", " ") || "Administrator";
};

function initials(name?: string | null) {
  return (name ?? "Admin")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join("") || "A";
}

function AdminNavLinks({ close }: { close?: () => void }) {
  const [location] = useLocation();
  const pathname = location.split("?")[0] ?? location;
  const { user } = useAuth();

  return (
    <nav aria-label="Administration workspaces" className="admin-nav-groups">
      {ADMIN_NAV_GROUPS.map(group => {
        const links = group.links.filter(link => !link.superAdmin || user?.role === "SUPER_ADMIN");
        return (
          <section key={group.label} className="admin-nav-group">
            <p className="admin-nav-group-label">{group.label}</p>
            <div className="admin-nav-links">
              {links.map(link => {
                const Icon = link.icon;
                const active = isCurrent(pathname, link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    onClick={close}
                    className={`admin-nav-link${active ? " is-active" : ""}`}
                  >
                    <Icon aria-hidden="true" size={17} />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
    </nav>
  );
}

function AdminIdentity({ onLogout }: { onLogout: () => void }) {
  const { user } = useAuth();
  return (
    <div className="admin-identity">
      <div className="admin-identity-avatar" aria-hidden="true">{initials(user?.name)}</div>
      <div className="min-w-0">
        <p className="admin-identity-name">{user?.name || "Administrator"}</p>
        <p className="admin-identity-role">{roleLabel(user?.role)}</p>
      </div>
      <button type="button" className="admin-logout-button" onClick={onLogout}>Log out</button>
    </div>
  );
}

export default function AdminControlCenterNav() {
  const { user, loading, logout } = useAuth();
  const [location, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  const pathname = location.split("?")[0] ?? location;
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  if (loading || !pathname.startsWith("/admin") || !["ADMIN", "SUPER_ADMIN"].includes(user?.role ?? "")) return null;

  const logoutAndReturn = async () => {
    await logout();
    navigate("/");
  };
  const currentEntry = ADMIN_NAV_GROUPS.flatMap(group => group.links.map(link => ({ ...link, group: group.label }))).find(link => isCurrent(pathname, link.href));

  return (
    <>
      <aside className="admin-sidebar" aria-label="Administration control center">
        <div className="admin-sidebar-brand">
          <div className="admin-brand-mark" aria-hidden="true">ES</div>
          <div className="min-w-0">
            <p className="admin-brand-name">ESUT Marketplace</p>
            <p className="admin-brand-subtitle">Control center</p>
          </div>
        </div>
        <div className="admin-role-chip"><ShieldCheck aria-hidden="true" size={14} /> {roleLabel(user?.role)}</div>
        <AdminNavLinks />
        <div className="admin-sidebar-footer">
          <Link className="admin-public-link" href="/">← Return to marketplace</Link>
          <AdminIdentity onLogout={() => { void logoutAndReturn(); }} />
        </div>
      </aside>

      <header className="admin-shell-topbar">
        <div className="min-w-0">
          <p className="admin-shell-kicker">ESUT Marketplace · Admin control center</p>
          <p className="admin-shell-breadcrumb"><span>Admin</span><b aria-hidden="true">/</b><span>{currentEntry?.group ?? "Command center"}</span><b aria-hidden="true">/</b><strong>{currentEntry?.label ?? "Overview"}</strong></p>
        </div>
        <div className="admin-shell-context"><span className="admin-shell-role">{roleLabel(user?.role)}</span><span className="admin-shell-identity">{user?.name || "Administrator"}</span></div>
      </header>

      <div className="admin-mobile-bar">
        <button type="button" className="admin-mobile-menu-button" aria-expanded={open} aria-controls="admin-mobile-drawer" onClick={() => setOpen(true)}>
          <Menu aria-hidden="true" size={20} />
          <span>Admin control center</span>
        </button>
        <span className="admin-mobile-current">{ADMIN_NAV_GROUPS.flatMap(group => group.links).find(link => isCurrent(pathname, link.href))?.label ?? "Overview"}</span>
      </div>

      {open ? (
        <div className="admin-mobile-overlay" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setOpen(false); }}>
          <aside id="admin-mobile-drawer" className="admin-mobile-drawer" aria-label="Administration workspaces">
            <div className="admin-mobile-drawer-header">
              <div>
                <p className="admin-brand-name">ESUT Marketplace</p>
                <p className="admin-brand-subtitle">Control center</p>
              </div>
              <button type="button" className="admin-mobile-close" aria-label="Close admin navigation" onClick={() => setOpen(false)}><X aria-hidden="true" size={20} /></button>
            </div>
            <AdminNavLinks close={() => setOpen(false)} />
            <div className="admin-mobile-drawer-footer">
              <AdminIdentity onLogout={() => { void logoutAndReturn(); }} />
              <Link className="admin-public-link" href="/" onClick={() => setOpen(false)}>← Return to marketplace</Link>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
