import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export function ActionReasonButton({
  children,
  title,
  description,
  confirmLabel,
  onConfirm,
  disabled,
  className,
  variant = "outline",
  size = "sm",
}: {
  children: React.ReactNode;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: (reason: string) => unknown | Promise<unknown>;
  disabled?: boolean;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const confirm = async () => { const clean = reason.trim(); if (clean.length < 3) return; setSubmitting(true); try { await onConfirm(clean); setReason(""); setOpen(false); } finally { setSubmitting(false); } };
  return <><Button type="button" size={size} variant={variant} disabled={disabled} className={className} onClick={() => setOpen(true)}>{children}</Button><Dialog open={open} onOpenChange={next => { if (!submitting) { setOpen(next); if (!next) setReason(""); } }}><DialogContent><DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader><label className="block text-sm font-bold text-slate-800">Required audit note<Textarea autoFocus value={reason} maxLength={600} onChange={event => setReason(event.target.value)} className="mt-2 min-h-28" placeholder="State the factual reason for this decision." /><span className="mt-1 block text-right text-xs font-normal text-slate-500">{reason.length}/600</span></label><DialogFooter><Button type="button" variant="outline" disabled={submitting} onClick={() => setOpen(false)}>Cancel</Button><Button type="button" className="bg-[#00843d]" disabled={submitting || reason.trim().length < 3} onClick={() => void confirm()}>{submitting ? "Saving…" : confirmLabel}</Button></DialogFooter></DialogContent></Dialog></>;
}
