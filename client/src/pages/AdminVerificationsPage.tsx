import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useAdminWorkspaceRefresh } from "@/hooks/useAdminWorkspaceRefresh";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, Eye, ShieldCheck, XCircle } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function AdminVerificationsPage() {
  const { user, loading } = useAuth();
  const enabled = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  const refreshAdmin = useAdminWorkspaceRefresh();
  const verifications = trpc.admin.verifications.useQuery(undefined, { enabled });
  const evidence = trpc.admin.verificationEvidenceUrl.useMutation({
    onSuccess: ({ url }) => window.open(url, "_blank", "noopener,noreferrer"),
    onError: error => toast.error(error.message),
  });
  const review = trpc.admin.reviewVerification.useMutation({
    onSuccess: async () => {
      toast.success("Verification decision recorded.");
      await refreshAdmin("sellerReview");
    },
    onError: error => toast.error(error.message),
  });

  if (loading) return <main className="page-shell py-16">Loading verification review…</main>;
  if (!enabled) return <main className="page-shell py-20 text-center"><ShieldCheck className="mx-auto text-[#e31b23]" size={42}/><h1 className="mt-4 text-3xl font-extrabold">Administrator access required</h1><p className="mt-2 text-slate-600">Seller verification evidence is available only to authorised administrators.</p></main>;
  if (verifications.isLoading) return <main className="page-shell py-16">Loading verification requests…</main>;
  if (verifications.isError) return <main className="page-shell py-20 text-center"><ShieldCheck className="mx-auto text-[#e31b23]" size={42}/><h1 className="mt-4 text-3xl font-extrabold">Verification requests could not be loaded</h1><Button className="mt-5" onClick={() => verifications.refetch()}>Try again</Button></main>;

  const rows = verifications.data ?? [];
  const pending = rows.filter(row => row.status === "PENDING");
  const completed = rows.filter(row => row.status !== "PENDING");
  const renderRow = (row: typeof rows[number]) => <article key={row.id} className="flex flex-col gap-4 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
    <div className="min-w-0">
      <p className="font-extrabold text-slate-900">{row.verificationType === "BUSINESS_ENTITY" ? row.businessName ?? "Business vendor" : row.esutEmail ?? "Individual seller"}</p>
      <p className="mt-1 text-sm text-slate-600">{row.verificationType === "BUSINESS_ENTITY" ? `Business registration: ${row.businessRegistrationNumber ?? "Not supplied"}` : `ESUT registration: ${row.registrationNumber ?? "Not supplied"}`}</p>
      <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold"><span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">{row.verificationType.replaceAll("_", " ")}</span><span className={`rounded-full px-3 py-1 ${row.status === "PENDING" ? "bg-[#fff8dd] text-[#8a6400]" : row.status === "APPROVED" ? "bg-[#eaf7ef] text-[#006b32]" : "bg-[#fff3f3] text-[#b91c1c]"}`}>{row.status}</span></div>
      {row.reviewNote ? <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600"><b>Review note:</b> {row.reviewNote}</p> : null}
    </div>
    <div className="flex flex-wrap gap-2 lg:justify-end"><Button size="sm" variant="outline" disabled={evidence.isPending} onClick={() => evidence.mutate({ id: row.id })}><Eye size={16}/>View evidence</Button>{row.status === "PENDING" ? <><Button size="sm" variant="outline" disabled={review.isPending} onClick={() => review.mutate({ id: row.id, approve: false, note: "Verification evidence could not be approved." })}><XCircle size={16}/>Return for update</Button><Button size="sm" className="bg-[#00843d] hover:bg-[#006b32]" disabled={review.isPending} onClick={() => review.mutate({ id: row.id, approve: true })}><CheckCircle2 size={16}/>Approve verification</Button></> : null}</div>
  </article>;

  return <main className="page-shell py-8"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="eyebrow text-[#e31b23]">ADMINISTRATION</p><h1 className="mt-2 text-3xl font-extrabold">Seller verification review</h1><p className="mt-2 max-w-2xl text-slate-600">Review identity and business evidence before an applicant can submit a store application. Every decision is recorded in the audit trail.</p></div><Link href="/admin"><Button variant="outline">Back to overview</Button></Link></div><section className="mt-7 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200"><header className="border-b bg-[#fffaf0] p-5"><h2 className="font-extrabold">Pending review</h2><p className="mt-1 text-sm text-slate-600">{pending.length} request{pending.length === 1 ? "" : "s"} requiring a decision.</p></header>{pending.length ? <div className="divide-y">{pending.map(renderRow)}</div> : <p className="p-6 text-sm text-slate-600">There are no pending verification requests.</p>}</section><section className="mt-7 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200"><header className="border-b p-5"><h2 className="font-extrabold">Decision history</h2><p className="mt-1 text-sm text-slate-600">Completed requests remain available for accountable follow-up.</p></header>{completed.length ? <div className="divide-y">{completed.map(renderRow)}</div> : <p className="p-6 text-sm text-slate-600">No completed verification decisions yet.</p>}</section></main>;
}
