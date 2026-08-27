import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, ArrowUpRight, CheckCircle2, Clock3, RefreshCw } from "lucide-react";
import { Link } from "wouter";

const priorityStyles = {
  HIGH: "border-[#f1c9c5] bg-[#fff3ed] text-[#9a3412]",
  MEDIUM: "border-[#eadcae] bg-[#fffaf0] text-[#8a6400]",
  LOW: "border-[#cfe3d5] bg-[#eaf7ef] text-[#006b32]",
} as const;

const formatAge = (value: Date | string | number) => {
  const timestamp = new Date(value).getTime();
  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60_000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

export default function AdminAttentionQueue() {
  const queue = trpc.admin.attentionQueue.useQuery(undefined, { refetchInterval: 60_000 });

  return (
    <section className="admin-attention-panel mt-7" aria-labelledby="admin-attention-heading">
      <div className="admin-attention-header">
        <div className="flex min-w-0 items-start gap-3">
          <div className="admin-attention-icon" aria-hidden="true"><AlertTriangle size={18} /></div>
          <div className="min-w-0">
            <p className="eyebrow text-[#e31b23]">OPERATIONS</p>
            <h2 id="admin-attention-heading" className="mt-1 text-xl font-extrabold text-[#08243b]">Needs attention</h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">A server-derived queue of unresolved marketplace work, ordered by operational priority and age.</p>
          </div>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => void queue.refetch()} disabled={queue.isFetching} aria-label="Refresh needs attention queue">
          <RefreshCw aria-hidden="true" size={15} className={queue.isFetching ? "animate-spin" : ""} />
          {queue.isFetching ? "Refreshing…" : "Refresh"}
        </Button>
      </div>

      {queue.isLoading ? (
        <div className="admin-attention-skeletons" aria-label="Loading attention queue" role="status">
          {[1, 2, 3].map(item => <div key={item} className="admin-attention-skeleton" />)}
        </div>
      ) : queue.isError ? (
        <div className="admin-attention-state admin-attention-error" role="alert">
          <p className="font-bold">Unable to load marketplace attention.</p>
          <p className="mt-1 text-sm">The queue could not be retrieved. Try again without leaving the control center.</p>
          <Button className="mt-4" type="button" size="sm" variant="outline" onClick={() => void queue.refetch()}>Retry queue</Button>
        </div>
      ) : queue.data?.length ? (
        <div className="admin-attention-list">
          {queue.data.map(item => (
            <article className="admin-attention-item" key={item.id}>
              <div className={`admin-attention-priority ${priorityStyles[item.priority]}`}><span className="sr-only">Priority </span>{item.priority}</div>
              <div className="admin-attention-item-main">
                <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="admin-attention-source">{item.source}</span>
                  <span className="admin-attention-status">{item.status.replaceAll("_", " ")}</span>
                </div>
                <h3 className="mt-1 truncate text-sm font-extrabold text-[#08243b]">{item.subject}</h3>
                <p className="mt-1 text-sm text-slate-600">{item.reason}</p>
                <p className="mt-2 flex items-center gap-1 text-xs font-bold text-slate-400"><Clock3 aria-hidden="true" size={13} /> {formatAge(item.createdAt)}</p>
              </div>
              <Link href={item.href} className="admin-attention-action">Open <ArrowUpRight aria-hidden="true" size={15} /></Link>
            </article>
          ))}
        </div>
      ) : (
        <div className="admin-attention-state" role="status">
          <CheckCircle2 aria-hidden="true" size={22} />
          <div><p className="font-extrabold">All clear</p><p className="mt-1 text-sm">There are currently no marketplace issues requiring administrator attention.</p></div>
        </div>
      )}
    </section>
  );
}
