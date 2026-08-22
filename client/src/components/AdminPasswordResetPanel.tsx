import { useState } from "react";
import { ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

type ResetForm = {
  targetUserId: string;
  adminCurrentPassword: string;
  newPassword: string;
  confirmPassword: string;
  note: string;
};

const initialForm: ResetForm = { targetUserId: "", adminCurrentPassword: "", newPassword: "", confirmPassword: "", note: "" };

export function AdminPasswordResetPanel() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ResetForm>(initialForm);
  const reset = trpc.admin.resetUserPassword.useMutation({
    onSuccess: result => {
      setForm(initialForm);
      setOpen(false);
      toast.success(`Password replaced. ${result.revokedSessionCount} active session${result.revokedSessionCount === 1 ? "" : "s"} revoked.`);
      if (!result.redisLockoutCleared) toast.message("The durable account lockout was cleared. Redis lockout state was unavailable and will expire normally if present.");
    },
    onError: error => toast.error(error.message),
  });

  if (user?.role !== "SUPER_ADMIN") {
    return <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950"><p className="font-extrabold">Password replacement is reserved for the super administrator.</p><p className="mt-1 text-sm">Ordinary administrators cannot view, recover, or replace member passwords from this workspace.</p></section>;
  }

  const targetUserId = Number(form.targetUserId);
  const valid = Number.isSafeInteger(targetUserId) && targetUserId > 0 && form.adminCurrentPassword.length > 0 && form.newPassword.length >= 10 && form.newPassword === form.confirmPassword && form.note.trim().length >= 3;
  const update = <K extends keyof ResetForm>(field: K, value: ResetForm[K]) => setForm(current => ({ ...current, [field]: value }));
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!valid) return;
    reset.mutate({ targetUserId, adminCurrentPassword: form.adminCurrentPassword, newPassword: form.newPassword, confirmPassword: form.confirmPassword, note: form.note.trim() });
  };

  return <section className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm"><div className="flex gap-3"><ShieldAlert className="mt-0.5 shrink-0 text-[#e31b23]" size={22}/><div><h2 className="font-extrabold text-slate-950">Member password replacement</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-slate-700">This creates a new password; it never reveals the existing password. The target account’s active sessions are revoked, the account lockout is cleared, and the action is recorded in the immutable audit log.</p></div></div><Button type="button" className="mt-4 bg-[#e31b23] hover:bg-[#c9161d]" onClick={() => setOpen(true)}>Replace a member password</Button><Dialog open={open} onOpenChange={next => { if (!reset.isPending) { setOpen(next); if (!next) setForm(initialForm); } }}><DialogContent className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Replace member password</DialogTitle><DialogDescription>Use this only for a verified support or recovery request. Do not enter, request, or record the member’s previous password.</DialogDescription></DialogHeader><form onSubmit={submit} className="space-y-4"><label className="block text-sm font-bold text-slate-800">Target user ID<Input autoFocus inputMode="numeric" pattern="[0-9]*" required value={form.targetUserId} onChange={event => update("targetUserId", event.target.value.replace(/\D/g, ""))} className="mt-2" placeholder="For example: 13" /></label><label className="block text-sm font-bold text-slate-800">Your current administrator password<Input required type="password" autoComplete="current-password" value={form.adminCurrentPassword} onChange={event => update("adminCurrentPassword", event.target.value)} className="mt-2" /></label><label className="block text-sm font-bold text-slate-800">New member password<Input required type="password" minLength={10} maxLength={128} autoComplete="new-password" value={form.newPassword} onChange={event => update("newPassword", event.target.value)} className="mt-2" /><span className="mt-1 block text-xs font-normal text-slate-500">At least 10 characters. Provide the new password only through an approved support channel.</span></label><label className="block text-sm font-bold text-slate-800">Confirm new member password<Input required type="password" minLength={10} maxLength={128} autoComplete="new-password" value={form.confirmPassword} onChange={event => update("confirmPassword", event.target.value)} className="mt-2" /></label><label className="block text-sm font-bold text-slate-800">Required audit note<Textarea required minLength={3} maxLength={500} value={form.note} onChange={event => update("note", event.target.value)} className="mt-2 min-h-24" placeholder="State the factual recovery reason; do not include any password or token." /><span className="mt-1 block text-right text-xs font-normal text-slate-500">{form.note.length}/500</span></label><div role="alert" className="rounded-xl border border-red-200 bg-white p-3 text-sm text-red-800">This action cannot reveal or restore the prior password. It immediately revokes every active session for the target user.</div><DialogFooter><Button type="button" variant="outline" disabled={reset.isPending} onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" className="bg-[#e31b23] hover:bg-[#c9161d]" disabled={!valid || reset.isPending}>{reset.isPending ? "Replacing password…" : "Replace password & revoke sessions"}</Button></DialogFooter></form></DialogContent></Dialog></section>;
}
