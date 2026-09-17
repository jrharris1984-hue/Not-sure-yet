import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Camera, ChevronLeft, RefreshCw, Trash2, Loader2 } from "lucide-react";
import { endpoints } from "@/lib/api";
import LivePreview from "@/components/LivePreview";

const STATUS_COLOR = {
  done: "text-emerald-300",
  running: "text-amber-300",
  queued: "text-amber-300",
  pending: "text-zinc-400",
  failed: "text-red-400",
  offline: "text-zinc-400",
  cancelled: "text-zinc-400",
};

export default function ShootDetail() {
  const { shootId } = useParams();
  const qc = useQueryClient();

  const { data: shoot, isLoading } = useQuery({
    queryKey: ["shoot", shootId],
    queryFn: () => endpoints.getShoot(shootId),
    enabled: !!shootId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "done" || status === "failed" ? 8000 : 2500;
    },
  });

  // Also poll individual running renders so ComfyUI outputs pop in
  useEffect(() => {
    if (!shoot?.renders) return;
    const running = shoot.renders.filter((r) => r && r.status === "running" && r.comfy_prompt_id);
    if (!running.length) return;
    const t = setInterval(async () => {
      try {
        await Promise.all(running.map((r) => endpoints.pollRender(r.id)));
        qc.invalidateQueries({ queryKey: ["shoot", shootId] });
      } catch { /* ignore */ }
    }, 4000);
    return () => clearInterval(t);
  }, [shoot?.renders, shootId, qc]);

  const retry = useMutation({
    mutationFn: (idx) => endpoints.retryShootFrame(shootId, idx, {}),
    onSuccess: () => { toast.success("Frame re-queued"); qc.invalidateQueries({ queryKey: ["shoot", shootId] }); },
    onError: (e) => toast.error(e?.response?.data?.detail || "Retry failed"),
  });

  const cancelFrame = async (renderId) => {
    if (!renderId) return;
    try {
      await endpoints.cancelRender(renderId);
      toast.success("Frame cancelled");
      qc.invalidateQueries({ queryKey: ["shoot", shootId] });
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Cancel failed");
    }
  };

  const del = useMutation({
    mutationFn: () => endpoints.deleteShoot(shootId),
    onSuccess: () => { toast.success("Shoot deleted"); window.history.back(); },
  });

  if (isLoading) return <div className="p-8 text-zinc-400">Loading shoot…</div>;
  if (!shoot) return <div className="p-8 text-zinc-400">Shoot not found.</div>;

  const doneCount = shoot.frames.filter((f) => f.status === "done").length;
  const failedCount = shoot.frames.filter((f) => f.status === "failed").length;
  const offlineCount = shoot.frames.filter((f) => f.status === "offline").length;

  return (
    <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-6 sm:py-10 space-y-6" data-testid="shoot-detail-page">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link
            to={shoot.character_id ? `/character/${shoot.character_id}` : "/"}
            data-testid="btn-shoot-back"
            className="mt-1 text-zinc-400 hover:text-zinc-100"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="section-label flex items-center gap-2"><Camera className="h-3 w-3" /> Photo Shoot</div>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl mt-1" data-testid="shoot-name">{shoot.name}</h1>
            <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-zinc-500 mt-1">
              <span data-testid="shoot-status" className={STATUS_COLOR[shoot.status] || "text-zinc-400"}>
                {shoot.status.toUpperCase()}
              </span>
              <span>·</span>
              <span data-testid="shoot-progress">{doneCount}/{shoot.count} done</span>
              {failedCount > 0 && <><span>·</span><span className="text-red-400">{failedCount} failed</span></>}
              {offlineCount > 0 && <><span>·</span><span className="text-zinc-400">{offlineCount} offline</span></>}
              <span>·</span>
              <span>seed mode: {shoot.seed_mode}</span>
              {shoot.pose_pack && <><span>·</span><span>pack: {shoot.pose_pack}</span></>}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => window.confirm("Delete this shoot and all its frames?") && del.mutate()}
          data-testid="btn-delete-shoot"
          className="inline-flex items-center gap-1.5 rounded-lg border hairline px-3 py-2 text-xs text-zinc-300 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/40"
        >
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-elevated overflow-hidden" data-testid="shoot-progress-bar">
        <div
          className="h-full bg-amber-400 transition-all"
          style={{ width: `${Math.round((shoot.progress || 0) * 100)}%` }}
        />
      </div>

      {/* Frames grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {shoot.frames.map((f, i) => {
          const r = shoot.renders?.[i];
          const outputUrl = r?.output_files?.[0];
          const status = f.status || r?.status || "pending";
          return (
            <div
              key={i}
              data-testid={`shoot-frame-${i}`}
              className="pane p-2 space-y-2"
            >
              <div className="relative aspect-square rounded-md border hairline bg-elevated overflow-hidden">
                {outputUrl ? (
                  <img src={outputUrl} alt={`frame ${i + 1}`} className="w-full h-full object-cover" />
                ) : status === "running" && r?.id ? (
                  <LivePreview
                    clientId={r.id}
                    enabled
                    variant="card"
                    testId={`shoot-frame-${i}-live`}
                    onCancel={() => cancelFrame(r.id)}
                  />
                ) : (
                  <div className="w-full h-full grid place-items-center text-xs text-zinc-500 font-mono">
                    {status === "queued" ? (
                      <Loader2 className="h-5 w-5 animate-spin text-amber-300" />
                    ) : status === "pending" ? (
                      <span className="text-zinc-500">pending</span>
                    ) : (
                      <span className={STATUS_COLOR[status] || "text-zinc-500"}>{status}</span>
                    )}
                  </div>
                )}
                <span className="absolute top-1 left-1 text-[10px] font-mono bg-black/60 text-zinc-100 px-1.5 py-0.5 rounded">
                  #{i + 1}
                </span>
                <span className={`absolute top-1 right-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/60 ${STATUS_COLOR[status] || "text-zinc-400"}`}>
                  {status}
                </span>
              </div>
              <div className="text-[10px] font-mono text-zinc-400 truncate" title={f.pose_action}>
                {f.pose_action || "—"}
              </div>
              {f.outfit_overrides?.outfit_preset && (
                <div className="text-[10px] font-mono text-amber-300/80 truncate">
                  {f.outfit_overrides.outfit_preset}
                </div>
              )}
              {(status === "failed" || status === "offline") && (
                <button
                  type="button"
                  onClick={() => retry.mutate(i)}
                  disabled={retry.isPending}
                  data-testid={`btn-retry-frame-${i}`}
                  className="w-full inline-flex items-center justify-center gap-1 rounded-md bg-amber-500/10 border border-amber-500/40 text-amber-200 text-[10px] font-mono py-1 hover:bg-amber-500/20"
                >
                  <RefreshCw className="h-3 w-3" /> retry
                </button>
              )}
              {r?.error && (
                <div className="text-[9px] text-red-300 font-mono line-clamp-2" title={r.error}>{r.error}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
