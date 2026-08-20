import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertCircle, FileImage, X } from "lucide-react";
import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export type CaseEvidenceFile = {
  filename: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp" | "video/mp4" | "video/webm";
  dataUrl: string;
};

type EvidenceFile = File & { type: CaseEvidenceFile["mimeType"] };

const supportedTypes: ReadonlySet<string> = new Set(["image/jpeg", "image/png", "image/webp", "video/mp4", "video/webm"]);

const readAsDataUrl = (file: EvidenceFile) => new Promise<CaseEvidenceFile>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve({ filename: file.name, mimeType: file.type, dataUrl: String(reader.result) });
  reader.onerror = () => reject(new Error("The selected evidence file could not be read."));
  reader.readAsDataURL(file);
});

export function CaseSubmissionDialog({
  open,
  onOpenChange,
  title,
  description,
  subjectLabel,
  reasonOptions,
  submitLabel,
  requireEvidence = true,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  subjectLabel: string;
  reasonOptions: ReadonlyArray<{ value: string; label: string }>;
  submitLabel: string;
  requireEvidence?: boolean;
  onSubmit: (payload: { reason: string; details: string; evidence: CaseEvidenceFile[] }) => Promise<void>;
}) {
  const [reason, setReason] = useState(reasonOptions[0]?.value ?? "OTHER");
  const [details, setDetails] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fileSummary = useMemo(() => files.map(file => ({ name: file.name, size: file.size, type: file.type })), [files]);

  const reset = () => {
    setReason(reasonOptions[0]?.value ?? "OTHER");
    setDetails("");
    setFiles([]);
    setError(null);
    setSubmitting(false);
  };

  const updateOpen = (nextOpen: boolean) => {
    if (!nextOpen && !submitting) reset();
    onOpenChange(nextOpen);
  };

  const selectEvidence = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!selected.length) return;
    if (selected.some(file => !supportedTypes.has(file.type))) {
      setError("Use JPEG, PNG, WebP, MP4, or WebM evidence only.");
      return;
    }
    if (selected.some(file => file.size > (file.type.startsWith("video/") ? 10 : 3) * 1024 * 1024)) {
      setError("Photos must be 3 MB or smaller and videos must be 10 MB or smaller.");
      return;
    }
    const unique = new Map(files.map(file => [`${file.name}:${file.size}:${file.lastModified}`, file]));
    selected.forEach(file => unique.set(`${file.name}:${file.size}:${file.lastModified}`, file));
    const nextFiles = Array.from(unique.values());
    if (nextFiles.length > 5) {
      setError("You can submit no more than five evidence files for one case.");
      return;
    }
    setFiles(nextFiles);
    setError(null);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanedDetails = details.trim();
    if (reason.trim().length < 3) return setError("Choose the reason that best describes this concern.");
    if (cleanedDetails.length < 10) return setError("Provide at least 10 characters so the support team can understand what happened.");
    if (requireEvidence && (files.length < 3 || files.length > 5)) return setError("Attach between three and five photos or videos as supporting evidence.");
    setSubmitting(true);
    setError(null);
    try {
      const evidence = await Promise.all(files.map(file => readAsDataUrl(file as EvidenceFile)));
      await onSubmit({ reason: reason.trim(), details: cleanedDetails, evidence });
      reset();
      onOpenChange(false);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "We could not submit this case. Please try again.");
      setSubmitting(false);
    }
  };

  return <Dialog open={open} onOpenChange={updateOpen}>
    <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <form onSubmit={event => void submit(event)} className="space-y-5">
        <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600"><b className="text-slate-900">Reporting:</b> {subjectLabel}</div>
        <label className="block text-sm font-bold text-slate-800">Reason
          <select value={reason} onChange={event => setReason(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-normal outline-none focus:border-[#00843d] focus:ring-4 focus:ring-[#00843d]/10">
            {reasonOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <label className="block text-sm font-bold text-slate-800">What happened?
          <textarea value={details} onChange={event => setDetails(event.target.value)} maxLength={2_000} minLength={10} rows={5} className="mt-2 min-h-32 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-normal outline-none focus:border-[#00843d] focus:ring-4 focus:ring-[#00843d]/10" placeholder="Describe the issue, when it happened, and any relevant order or conversation context." />
          <span className="mt-1 block text-right text-xs font-normal text-slate-500">{details.trim().length}/2000</span>
        </label>
        {requireEvidence ? <section aria-labelledby="case-evidence-title" className="rounded-2xl border border-dashed border-[#00843d]/35 bg-[#f7fbf8] p-4">
          <div className="flex gap-3"><FileImage className="mt-0.5 shrink-0 text-[#00843d]" size={20}/><div><h3 id="case-evidence-title" className="font-extrabold text-slate-900">Supporting evidence</h3><p className="mt-1 text-sm leading-5 text-slate-600">Attach 3–5 original photos or videos. JPEG, PNG, WebP, MP4, and WebM are accepted. Photos are limited to 3 MB each; videos to 10 MB each. Files remain private and are available only to authorized case participants and marketplace moderation staff.</p></div></div>
          <input id="case-evidence-files" type="file" multiple accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" onChange={selectEvidence} className="sr-only" />
          <label htmlFor="case-evidence-files" className="mt-4 inline-flex cursor-pointer items-center rounded-lg border border-[#00843d]/30 bg-white px-3 py-2 text-sm font-bold text-[#006b32] transition hover:bg-[#eaf7ef] focus-within:ring-2 focus-within:ring-[#00843d]/30">Choose evidence files</label>
          {fileSummary.length ? <ul className="mt-4 space-y-2" aria-label="Selected evidence files">{fileSummary.map((file, index) => <li key={`${file.name}-${index}`} className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 text-xs text-slate-600 ring-1 ring-slate-200"><span className="min-w-0 truncate"><b className="text-slate-800">{file.name}</b> · {(file.size / (1024 * 1024)).toFixed(1)} MB</span><button type="button" onClick={() => { setFiles(current => current.filter((_, currentIndex) => currentIndex !== index)); setError(null); }} className="shrink-0 rounded p-1 text-slate-400 hover:text-[#b91c1c] focus:outline-none focus:ring-2 focus:ring-[#e31b23]/30" aria-label={`Remove ${file.name}`}><X size={16}/></button></li>)}</ul> : <p className="mt-4 text-sm font-bold text-[#8a6500]">Select 3–5 files to continue.</p>}
        </section> : null}
        {error ? <div role="alert" className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"><AlertCircle className="mt-0.5 shrink-0" size={16}/><span>{error}</span></div> : null}
        <DialogFooter>
          <Button type="button" variant="outline" disabled={submitting} onClick={() => updateOpen(false)}>Cancel</Button>
          <Button type="submit" className="bg-[#e31b23] hover:bg-[#bd131a]" disabled={submitting}>{submitting ? "Submitting…" : submitLabel}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}

export function CaseReportButton({
  targetType,
  targetId,
  subjectLabel,
  buttonLabel = "Report",
  className,
  size = "sm",
}: {
  targetType: "LISTING" | "STORE" | "USER" | "MESSAGE" | "REVIEW";
  targetId: number;
  subjectLabel: string;
  buttonLabel?: string;
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
}) {
  const [open, setOpen] = useState(false);
  const [pendingReportId, setPendingReportId] = useState<number | null>(null);
  const report = trpc.support.report.useMutation();
  const submitEvidence = trpc.support.submitEvidenceForReport.useMutation();
  const submit = async ({ reason, details, evidence }: { reason: string; details: string; evidence: CaseEvidenceFile[] }) => {
    const reportId = pendingReportId ?? (await report.mutateAsync({ targetType, targetId, reason, details })).id;
    setPendingReportId(reportId);
    await submitEvidence.mutateAsync({ reportId, evidence });
    setPendingReportId(null);
    toast.success("Report and private evidence submitted for administrator review.");
  };
  return <><Button type="button" size={size} variant="outline" className={className} onClick={() => setOpen(true)}>{buttonLabel}</Button><CaseSubmissionDialog open={open} onOpenChange={setOpen} title="Submit a safety report" description="Explain the concern and attach original supporting evidence. Evidence is private by default and is visible only to authorized marketplace moderation staff." subjectLabel={subjectLabel} reasonOptions={[{ value: "SUSPICIOUS_ACTIVITY", label: "Suspicious or unsafe activity" }, { value: "MISLEADING_INFORMATION", label: "Misleading information" }, { value: "HARASSMENT_OR_ABUSE", label: "Harassment or abusive content" }, { value: "PROHIBITED_CONTENT", label: "Prohibited content" }, { value: "OTHER", label: "Other safety concern" }]} submitLabel="Submit report and evidence" onSubmit={submit}/></>;
}
