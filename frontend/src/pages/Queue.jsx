import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ban, CheckCircle2, Clock3, Loader2, RefreshCw, RotateCcw, Trash2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { endpoints } from "@/lib/api";

const terminal = new Set(["done", "failed", "offline", "cancelled"]);

const statusMeta = {
  queued: { label: "Waiting", color: "text-amber-300 border-amber-500/30 bg-amber-500/10", icon: Clock3 },
  dispatching: { label: "Starting", color: "text-cyan-300 border-cyan-500/30 bg-cyan-500/10", icon: Loader2 },
  running: { label: "Rendering", color: "text-emerald-300 border-emerald-500/30 bg-emerald-500/10", icon: Loader2 },
  done: { label: "Complete", color: "text-emerald-300 border-emerald-500/30 bg-emerald-500/10", icon: CheckCircle2 },
  failed: { label: "Failed", color: "text-red-300 border-red-500/30 bg-red-500/10", icon: XCircle },
  offline: { label: "Comfy offline", color: "text-orange-300 border-orange-500/30 bg-orange-500/10", icon: XCircle },
  cancelled: { label: "Cancelled", color: "text-zinc-400 border-zinc-600 bg-zinc-800/50", icon: Ban },
};

function Status({ value }) {
  const meta = statusMeta[value] || statusMeta.queued;
  const Icon = meta.icon;
  const spins = value === "dispatching" || value === "running";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest ${meta.color}`}>
      <Icon className={`h-3 w-3 ${spins ? "animate-spin" : ""}`} />
      {meta.label}
    </span>
  );
}

function when(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString();
}

export default function Queue() {
  const qc = useQueryClient();
  const { data: jobs = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: ["render-queue"],
    queryFn: endpoints.listQueue,
    refetchInterval: 2000,
  });

  const active = useMemo(() => jobs.filter((job) => !terminal.has(job.status)), [jobs]);
  const history = useMemo(() => jobs.filter((job) => terminal.has(job.status)), [jobs]);

  const cancel = useMutation({
    mutationFn: endpoints.cancelRender,
    onSuccess: () => { toast.success("Queue job cancelled"); qc.invalidateQueries({ queryKey: ["render-queue"] }); },
    onError: (e) => toast.error(e?.response?.data?.detail || "Could not cancel job"),
  });
  const retry = useMutation({
    mutationFn: endpoints.retryQueueJob,
    onSuccess: () => { toast.success("Added back to the queue"); qc.invalidateQueries({ queryKey: ["render-queue"] }); },
    onError: (e) => toast.error(e?.response?.data?.detail || "Could not retry job"),
  });
  const clear = useMutation({
    mutationFn: endpoints.clearCompletedQueue,
    onSuccess: (data) => { toast.success(`Cleared ${data.deleted || 0} finished jobs`); qc.invalidateQueries({ queryKey: ["render-queue"] }); },
    onError: () => toast.error("Could not clear queue history"),
  });

  const Job = ({ job }) => (
    <article data-testid={`queue-job-${job.id}`} className="pane p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Status value={job.status} />
            {job.status === "queued" && job.queue_position && (
              <span className="text-xs font-mono text-amber-200">position #{job.queue_position}</span>
            )}
          </div>
          <h2 className="mt-2 truncate font-display font-bold text-zinc-100">{job.workflow_name || job.workflow_type || "Render"}</h2>
          <div className="mt-1 text-[11px] font-mono text-zinc-500">
            Added {when(job.created_at)}
            {job.attempts > 0 ? ` · retry ${job.attempts}` : ""}
          </div>
          {job.error && <p className="mt-2 text-sm text-red-300">{job.error}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          {!terminal.has(job.status) && (
            <button type="button" onClick={() => cancel.mutate(job.id)}
              className="inline-flex items-center gap-2 rounded-lg border border-red-500/30 px-3 py-2 text-xs font-semibold text-red-300 hover:bg-red-500/10">
              <Ban className="h-4 w-4" /> Cancel
            </button>
          )}
          {["failed", "offline", "cancelled"].includes(job.status) && (
            <button type="button" onClick={() => retry.mutate(job.id)}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-black hover:bg-amber-400">
              <RotateCcw className="h-4 w-4" /> Retry
            </button>
          )}
          {job.status === "done" && (
            <a href="/gallery" className="inline-flex items-center gap-2 rounded-lg border hairline px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-white/5">
              View in Gallery
            </a>
          )}
        </div>
      </div>
    </article>
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 pb-28 sm:px-6">
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="section-label !text-amber-300">Render Queue</div>
          <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Production line</h1>
          <p className="mt-2 text-sm text-zinc-400">Jobs are saved and sent to ComfyUI one at a time—even if this page is closed.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => refetch()} className="inline-flex items-center gap-2 rounded-lg border hairline px-3 py-2 text-xs text-zinc-300 hover:bg-white/5">
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} /> Refresh
          </button>
          <button type="button" disabled={!history.length || clear.isPending} onClick={() => clear.mutate()}
            className="inline-flex items-center gap-2 rounded-lg border hairline px-3 py-2 text-xs text-zinc-300 hover:bg-white/5 disabled:opacity-40">
            <Trash2 className="h-4 w-4" /> Clear finished
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="pane grid place-items-center py-20"><Loader2 className="h-6 w-6 animate-spin text-amber-300" /></div>
      ) : jobs.length === 0 ? (
        <div className="pane py-20 text-center">
          <Clock3 className="mx-auto h-8 w-8 text-zinc-600" />
          <h2 className="mt-3 font-display text-xl font-bold">The queue is empty</h2>
          <p className="mt-1 text-sm text-zinc-500">Render from the Character Builder and the job will appear here.</p>
        </div>
      ) : (
        <div className="space-y-7">
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="section-label !text-amber-300">Active · {active.length}</h2>
            </div>
            <div className="space-y-3">
              {active.length ? active.slice().reverse().map((job) => <Job key={job.id} job={job} />) : (
                <div className="rounded-xl border hairline p-5 text-sm text-zinc-500">Nothing is waiting or rendering.</div>
              )}
            </div>
          </section>
          <section>
            <h2 className="mb-3 section-label">History · {history.length}</h2>
            <div className="space-y-3">{history.map((job) => <Job key={job.id} job={job} />)}</div>
          </section>
        </div>
      )}
    </div>
  );
}
