import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Camera, ChevronLeft, ChevronRight, X, ExternalLink, RefreshCw, Trash2, Loader2, Download, Star } from "lucide-react";
import { API_BASE, endpoints } from "@/lib/api";
import LivePreview from "@/components/LivePreview";
import { orderedShootFrames } from "@/lib/shootReview";

const STATUS_COLOR = {
  done: "text-emerald-300",
  running: "text-amber-300",
  queued: "text-amber-300",
  pending: "text-zinc-400",
  failed: "text-red-400",
  offline: "text-zinc-400",
  cancelled: "text-zinc-400",
};

function imageUrl(url) {
  if (!url) return "";
  try {
    const parsed = new URL(url, window.location.origin);
    const filename = parsed.searchParams.get("filename");
    if (filename && parsed.pathname.endsWith("/view")) {
      const query = new URLSearchParams({
        filename,
        subfolder: parsed.searchParams.get("subfolder") || "",
        type: parsed.searchParams.get("type") || "output",
      });
      return `${API_BASE}/comfyui/media?${query.toString()}`;
    }
  } catch { /* Use the original URL. */ }
  return url;
}

export default function ShootDetail() {
  const { shootId } = useParams();
  const qc = useQueryClient();
  const [activeFrame, setActiveFrame] = useState(null);
  const [slideDirection, setSlideDirection] = useState(1);
  const swipeStartX = useRef(null);
  const [selectedFrames, setSelectedFrames] = useState([]);
  const [downloading, setDownloading] = useState(false);
  const [bestFirst, setBestFirst] = useState(false);
  const [reviewProgress, setReviewProgress] = useState(null);

  const { data: shoot, isLoading, error, refetch } = useQuery({
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

  const images = orderedShootFrames(shoot?.frames || [], shoot?.renders, bestFirst).map(({ frame, index }) => ({
    index,
    url: imageUrl(shoot?.renders?.[index]?.output_variants?.enhanced?.[0] || shoot?.renders?.[index]?.output_files?.[0]),
    pose: frame.pose_action,
  })).filter((frame) => frame.url);
  const activePosition = images.findIndex((frame) => frame.index === activeFrame);
  const selectedImage = images[activePosition];
  const downloadFrames = async (indices) => {
    if (!indices.length) return;
    setDownloading(true);
    try {
      const blob = await endpoints.downloadShootFrames(shootId, indices);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `shoot-${shootId.slice(0, 12)}.zip`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch { toast.error("Could not download selected images"); }
    finally { setDownloading(false); }
  };
  const cover = useMutation({
    mutationFn: (index) => endpoints.setShootCover(shootId, index),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["shoot", shootId] }); qc.invalidateQueries({ queryKey: ["shoots"] }); toast.success("Shoot cover updated"); },
    onError: () => toast.error("Could not set shoot cover"),
  });
  const reviewSelected = async () => {
    const targets = selectedFrames.filter((index) => shoot.renders?.[index]?.output_files?.length);
    if (!targets.length) return;
    for (let position = 0; position < targets.length; position += 1) {
      setReviewProgress({ current: position + 1, total: targets.length });
      try {
        await endpoints.reviewRenderAlignment(shoot.renders[targets[position]].id);
        qc.invalidateQueries({ queryKey: ["shoot", shootId] });
      } catch (error) {
        toast.error(`Frame ${targets[position] + 1}: ${error?.response?.data?.detail || "Review failed"}`);
      }
    }
    setReviewProgress(null);
    toast.success("Selected frame reviews finished");
  };
  const moveFrame = (direction) => {
    if (activePosition < 0 || !images.length) return;
    setSlideDirection(direction);
    setActiveFrame(images[(activePosition + direction + images.length) % images.length].index);
  };

  useEffect(() => {
    if (activeFrame === null) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setActiveFrame(null);
      if (event.key === "ArrowLeft") moveFrame(-1);
      if (event.key === "ArrowRight") moveFrame(1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  if (isLoading) return <div className="p-8 text-zinc-400">Loading shoot…</div>;
  if (error) return <div className="p-8 space-y-3" role="alert">
    <p>{error?.response?.data?.detail || "Could not load this shoot. Check the backend connection and try again."}</p>
    <button type="button" className="chip" onClick={() => refetch()}>Try again</button>
    <Link to="/shoots" className="chip">Back to photo shoots</Link>
  </div>;
  if (!shoot) return <div className="p-8 text-zinc-400">Shoot not found.</div>;

  const doneCount = shoot.rendered_count ?? shoot.frames.filter((f) => f.status === "done").length;
  const failedCount = shoot.frames.filter((f) => f.status === "failed").length;
  const offlineCount = shoot.frames.filter((f) => f.status === "offline").length;

  return (
    <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-6 sm:py-10 space-y-6" data-testid="shoot-detail-page">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link
            to="/shoots"
            data-testid="btn-shoot-back"
            aria-label="Back to photo shoots"
            title="Back to photo shoots"
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
        <div className="flex flex-wrap items-center gap-2">
        {images.length > 0 && <button type="button" onClick={() => { setSlideDirection(1); setActiveFrame(images[0].index); }}
          data-testid="btn-view-shoot-photos" className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-black">
          <Camera className="h-4 w-4" />View photos ({images.length})
        </button>}
        {images.length > 0 && <button type="button" disabled={downloading} onClick={() => downloadFrames(images.map((image) => image.index))}
          className="rounded-lg border hairline px-3 py-2 text-xs text-zinc-200"><Download className="mr-1 inline h-4 w-4" />Download entire shoot</button>}
        {selectedFrames.length > 0 && <button type="button" disabled={downloading} onClick={() => downloadFrames(selectedFrames)}
          className="rounded-lg border border-amber-500/50 px-3 py-2 text-xs text-amber-200"><Download className="mr-1 inline h-4 w-4" />Download selected ({selectedFrames.length})</button>}
        <button
          type="button"
          onClick={() => window.confirm("Delete this shoot and all its frames?") && del.mutate()}
          data-testid="btn-delete-shoot"
          className="inline-flex items-center gap-1.5 rounded-lg border hairline px-3 py-2 text-xs text-zinc-300 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/40"
        >
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-elevated overflow-hidden" data-testid="shoot-progress-bar">
        <div
          className="h-full bg-amber-400 transition-all"
          style={{ width: `${Math.round((shoot.progress || 0) * 100)}%` }}
        />
      </div>

      {/* Frames grid */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <button type="button" onClick={() => setBestFirst((value) => !value)} aria-pressed={bestFirst}
          className={`rounded-lg border px-3 py-2 ${bestFirst ? "border-cyan-400 bg-cyan-500/15 text-cyan-100" : "hairline text-zinc-300"}`}>
          {bestFirst ? "Best reviewed first ✓" : "Show best reviewed first"}
        </button>
        <button type="button" disabled={!selectedFrames.length || !!reviewProgress} onClick={reviewSelected}
          className="rounded-lg border border-amber-500/40 px-3 py-2 text-amber-200 disabled:opacity-40">
          {reviewProgress ? `Reviewing ${reviewProgress.current}/${reviewProgress.total}…` : `Review selected (${selectedFrames.length})`}
        </button>
        <span className="text-zinc-500">Ranking compares matched, missing, and uncertain details; it is not an image quality score.</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {orderedShootFrames(shoot.frames, shoot.renders, bestFirst).map(({ frame: f, index: i, render: r }) => {
          const outputUrl = imageUrl(r?.output_variants?.enhanced?.[0] || r?.output_files?.[0]);
          const status = outputUrl ? "done" : f.status || r?.status || "pending";
          return (
            <div
              key={i}
              data-testid={`shoot-frame-${i}`}
              className="pane p-2 space-y-2"
            >
              <div className="relative aspect-square rounded-md border hairline bg-elevated overflow-hidden">
                {outputUrl ? (
                  <button type="button" onClick={() => setActiveFrame(i)} aria-label={`View frame ${i + 1} full size`}
                    data-testid={`btn-open-shoot-frame-${i}`} className="w-full h-full cursor-zoom-in">
                    <img src={outputUrl} alt={`frame ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
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
                <span className="pointer-events-none absolute top-1 left-1 text-[10px] font-mono bg-black/60 text-zinc-100 px-1.5 py-0.5 rounded">
                  #{i + 1}
                </span>
                <span className={`pointer-events-none absolute top-1 right-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/60 ${STATUS_COLOR[status] || "text-zinc-400"}`}>
                  {status}
                </span>
              </div>
              <div className="text-[10px] font-mono text-zinc-400 truncate" title={f.pose_action}>
                {f.pose_action || "—"}
              </div>
              {r?.alignment_review && <div className="text-[10px] text-cyan-200" title={r.alignment_review.summary || ""}>
                {r.alignment_review.matched?.length || 0} matched · {r.alignment_review.missing?.length || 0} missing
              </div>}
              {outputUrl && !r?.alignment_review && <div className="text-[10px] text-zinc-500">
                {r?.alignment_review_status === "reviewing" ? "Reviewing image…" : "Not reviewed yet"}
              </div>}
              {outputUrl && <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <label className="flex items-center gap-1 text-zinc-200"><input type="checkbox" checked={selectedFrames.includes(i)}
                  onChange={() => setSelectedFrames((current) => current.includes(i) ? current.filter((item) => item !== i) : [...current, i])} />Select</label>
                <button type="button" onClick={() => cover.mutate(i)} disabled={cover.isPending}
                  className={shoot.cover_frame_index === i ? "text-amber-300" : "text-zinc-400"} title="Set as shoot cover">
                  <Star className={`h-4 w-4 ${shoot.cover_frame_index === i ? "fill-current" : ""}`} /></button>
              </div>}
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
      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-3 sm:p-6"
          role="dialog" aria-modal="true" aria-label={`Photo shoot frame ${selectedImage.index + 1}`}
          data-testid="shoot-gallery-lightbox" onClick={() => setActiveFrame(null)}>
          <div className="relative w-full h-full flex flex-col items-center justify-center gap-3" onClick={(event) => event.stopPropagation()}>
            <div className="absolute top-0 right-0 z-10 flex items-center gap-2">
              <button type="button" onClick={() => downloadFrames([selectedImage.index])} disabled={downloading}
                aria-label="Download this image" className="rounded-full border border-white/20 bg-black/70 p-2.5 text-white"><Download className="h-5 w-5" /></button>
              <a href={selectedImage.url} target="_blank" rel="noopener noreferrer" aria-label="Open full-size image in a new tab"
                className="rounded-full border border-white/20 bg-black/70 p-2.5 text-white"><ExternalLink className="h-5 w-5" /></a>
              <button type="button" onClick={() => setActiveFrame(null)} aria-label="Close photo shoot gallery"
                className="rounded-full border border-white/20 bg-black/70 p-2.5 text-white"><X className="h-5 w-5" /></button>
            </div>
            {images.length > 1 && (
              <button type="button" onClick={() => moveFrame(-1)} aria-label="Previous photo shoot image"
                className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/70 p-2 text-white"
                data-testid="btn-shoot-gallery-previous"><ChevronLeft className="h-6 w-6" /></button>
            )}
            <div className="flex min-h-0 w-full flex-1 items-center justify-center touch-pan-y"
              onTouchStart={(event) => { swipeStartX.current = event.touches[0]?.clientX ?? null; }}
              onTouchEnd={(event) => {
                if (swipeStartX.current === null) return;
                const delta = (event.changedTouches[0]?.clientX ?? swipeStartX.current) - swipeStartX.current;
                swipeStartX.current = null;
                if (Math.abs(delta) >= 50) moveFrame(delta > 0 ? -1 : 1);
              }}>
              <img key={selectedImage.index} src={selectedImage.url} alt={`Photo shoot frame ${selectedImage.index + 1}`}
                className={`max-w-full max-h-[82dvh] object-contain ${slideDirection > 0 ? "gallery-slide-right" : "gallery-slide-left"}`}
                data-testid="shoot-gallery-image" />
            </div>
            {images.length > 1 && (
              <button type="button" onClick={() => moveFrame(1)} aria-label="Next photo shoot image"
                className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/70 p-2 text-white"
                data-testid="btn-shoot-gallery-next"><ChevronRight className="h-6 w-6" /></button>
            )}
            <div className="text-sm text-zinc-200 font-mono">{activePosition + 1} / {images.length}{selectedImage.pose ? ` · ${selectedImage.pose}` : ""}</div>
          </div>
        </div>
      )}
    </div>
  );
}
