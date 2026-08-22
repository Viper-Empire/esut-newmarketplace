import { ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { AdminReversibleActionsPanel } from "@/components/AdminReversibleActionsPanel";
import { AdminPasswordResetPanel } from "@/components/AdminPasswordResetPanel";

export default function AdminRecoveryPage() {
  const { user, loading } = useAuth();
  const allowed = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  if (loading) return <main className="page-shell py-16">Loading administrator recovery…</main>;
  if (!allowed) return <main className="page-shell py-20 text-center"><ShieldCheck className="mx-auto text-[#e31b23]" size={42}/><h1 className="mt-4 text-3xl font-extrabold">Administrator access required</h1><p className="mt-2 text-slate-600">Action recovery is protected by server-side administrator role checks.</p></main>;

  return <main className="page-shell py-8"><p className="eyebrow text-[#e31b23]">ADMINISTRATION</p><div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-3xl font-extrabold">Action recovery</h1><p className="mt-2 max-w-2xl text-slate-600">Recover eligible accidental moderation changes and perform tightly controlled member credential recovery while preserving the complete audit history.</p></div><Link href="/admin" className="text-sm font-extrabold text-[#006b32]">← Back to overview</Link></div><div className="mt-6 space-y-6"><AdminPasswordResetPanel /><AdminReversibleActionsPanel /></div></main>;
}
