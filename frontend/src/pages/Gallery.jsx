import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { API_BASE, endpoints } from "@/lib/api";
import { Link, useNavigate } from "react-router-dom";
import { X, Download, Copy, ExternalLink, Trash2, CheckSquare, RotateCcw, Shuffle, Pencil, Film, Loader2, Info, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

async function downloadImage(url, filename) {
  try {
    const res = await fetch(url, { mode: "cors" });
    const blob = await res.blob();
    const objUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objUrl;
    a.download = filename || url.split("/").pop() || "render.png";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objUrl);
    toast.success("Downloaded");
  } catch (e) {
    // Fallback for cross-origin: open in new tab so user can right-click save
    window.open(url, "_blank", "noopener");
    toast.message("Opened in new tab", { description: "Right-click the image to save it" });
  }
}

const STATUS_STYLE = {
  done: "text-emerald-300 bg-emerald-500/10 border-emerald-500/30",
  failed: "text-red-400 bg-red-500/10 border-red-500/30",
  offline: "text-zinc-400 bg-zinc-500/10 border-zinc-500/30",
  cancelled: "text-zinc-400 bg-zinc-500/10 border-zinc-500/30",
  running: "text-amber-300 bg-amber-500/10 border-amber-500/30",
};

const proxiedMediaUrl = (url = "") => {
  if (!url) return url;
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
  } catch { /* keep the original URL */ }
  return url;
};
const primaryOutput = (render) => proxiedMediaUrl(render.output_variants?.enhanced?.[0] || render.output_files?.[0]);
const originalOutput = (render) => proxiedMediaUrl(render.output_variants?.original?.[0]);
const isVideoUrl = (url = "") => /\.(webm|mp4|mov)(?:[?&]|$)/i.test(decodeURIComponent(url));

export default function Gallery() {
  const qc = useQueryClient();
  const nav = useNavigate();
  const { data: renders = [], isLoading } = useQuery({
    queryKey: ["renders"],
    queryFn: endpoints.listRenders,
    refetchInterval: 5000,
  });
  const [lightbox, setLightbox] = useState(null); // render object
  const [showDetails, setShowDetails] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selected, setSelected] = useState([]);
  const swipeStartX = useRef(null);

  const removeOne = useMutation({
    mutationFn: (id) => endpoints.deleteRender(id),
    onSuccess: (_result, id) => {
      setSelected((current) => current.filter((item) => item !== id));
      if (lightbox?.id === id) setLightbox(null);
      qc.invalidateQueries({ queryKey: ["renders"] });
      toast.success("Removed from Gallery");
    },
    onError: (error) => toast.error(error?.response?.data?.detail || "Could not remove render"),
  });

  const removeMany = useMutation({
    mutationFn: (ids) => endpoints.deleteRenders(ids),
    onSuccess: (result) => {
      setSelected([]);
      setSelectionMode(false);
      setLightbox(null);
      qc.invalidateQueries({ queryKey: ["renders"] });
      toast.success(`Removed ${result.deleted || 0} Gallery items`);
    },
    onError: (error) => toast.error(error?.response?.data?.detail || "Could not remove selected renders"),
  });

  const clearCancelled = useMutation({
    mutationFn: endpoints.clearCancelledRenders,
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["renders"] });
      qc.invalidateQueries({ queryKey: ["queue"] });
      toast.success(`Cleared ${result.deleted || 0} cancelled render${result.deleted === 1 ? "" : "s"}`);
    },
    onError: (error) => toast.error(error?.response?.data?.detail || "Could not clear cancelled renders"),
  });

  const recreate = useMutation({
    mutationFn: ({ id, variation }) => endpoints.recreateRender(id, variation),
    onSuccess: (result, variables) => {
      qc.invalidateQueries({ queryKey: ["renders"] });
      qc.invalidateQueries({ queryKey: ["queue"] });
      setLightbox(null);
      toast.success(variables.variation ? "Variation added to the render queue" : "Exact recipe added to the render queue", {
        description: result.queue_position ? `Queue position #${result.queue_position}` : undefined,
      });
    },
    onError: (error) => toast.error(error?.response?.data?.detail || "Could not recreate this render"),
  });

  const reuseAsReference = useMutation({
    mutationFn: ({ render, targetKind }) => endpoints.prepareRenderReference(render.id).then((reference) => ({ render, targetKind, reference })),
    onSuccess: ({ render, targetKind, reference }) => {
      const path = render.character_id ? `/character/${render.character_id}` : "/character/new";
      nav(path, {
        state: {
          galleryReference: reference,
          previewUrl: primaryOutput(render),
          targetKind,
        },
      });
    },
    onError: (error) => toast.error(error?.response?.data?.detail || "Could not reuse this Gallery image"),
  });

  const confirmRemoveOne = (render) => {
    if (window.confirm("Remove this item from the Ultra Studio Gallery? The original ComfyUI output file will remain on disk.")) {
      removeOne.mutate(render.id);
    }
  };

  const confirmRemoveSelected = () => {
    if (!selected.length) return;
    if (window.confirm(`Remove ${selected.length} selected items from the Ultra Studio Gallery? Original ComfyUI files will remain on disk.`)) {
      removeMany.mutate(selected);
    }
  };

  const toggleSelected = (id) => {
    setSelected((current) => current.includes(id)
      ? current.filter((item) => item !== id)
      : [...current, id]);
  };

  // The gallery only treats work that can still produce output as in flight.
  // Terminal records without media (cancelled/failed/offline) are not empty tiles.
  const withOutput = renders.filter((r) => primaryOutput(r));
  const inFlight = renders.filter((r) => !primaryOutput(r) && ["queued", "dispatching", "running"].includes(r.status));
  const cancelled = renders.filter((r) => !primaryOutput(r) && r.status === "cancelled");
  const lightboxIndex = lightbox ? withOutput.findIndex((r) => r.id === lightbox.id) : -1;
  const showAdjacent = (offset) => {
    if (!withOutput.length || lightboxIndex < 0) return;
    const nextIndex = (lightboxIndex + offset + withOutput.length) % withOutput.length;
    setLightbox(withOutput[nextIndex]);
    setShowDetails(false);
  };

  useEffect(() => {
    if (!lightbox) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "ArrowLeft") showAdjacent(-1);
      if (event.key === "ArrowRight") showAdjacent(1);
      if (event.key === "Escape") { setLightbox(null); setShowDetails(false); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const confirmClearCancelled = () => {
    if (!cancelled.length) return;
    if (window.confirm(`Permanently remove ${cancelled.length} cancelled record${cancelled.length === 1 ? "" : "s"} from Ultra Studio? ComfyUI output files are not deleted.`)) {
      clearCancelled.mutate();
    }
  };

  return (
    <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-6 sm:py-10 space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="section-label">Gallery</div>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl mt-1">Renders</h1>
          <p className="text-sm text-zinc-400 mt-1">
            {withOutput.length} finished · {inFlight.length} in flight. Tap a thumbnail to open.
          </p>
        </div>
        {(withOutput.length > 0 || cancelled.length > 0) && (
          <div className="flex gap-2">
            {cancelled.length > 0 && (
              <button type="button" onClick={confirmClearCancelled}
                disabled={clearCancelled.isPending}
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-600/60 bg-zinc-500/5 px-3 py-2 text-sm text-zinc-300 hover:border-red-500/50 hover:text-red-200 disabled:opacity-40"
                data-testid="btn-gallery-clear-cancelled">
                <Trash2 className="h-4 w-4" /> Clear {cancelled.length} cancelled
              </button>
            )}
            {withOutput.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setSelectionMode((value) => !value);
                setSelected([]);
              }}
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${selectionMode ? "border-amber-500/50 bg-amber-500/10 text-amber-200" : "hairline text-zinc-200"}`}
              data-testid="btn-gallery-select">
              <CheckSquare className="h-4 w-4" /> {selectionMode ? "Cancel" : "Select"}
            </button>

            )}
            {selectionMode && selected.length > 0 && (
              <button type="button" onClick={confirmRemoveSelected}
                disabled={removeMany.isPending}
                className="inline-flex items-center gap-2 rounded-lg border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-200 disabled:opacity-40"
                data-testid="btn-gallery-delete-selected">
                <Trash2 className="h-4 w-4" /> Remove {selected.length}
              </button>
            )}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="pane aspect-square animate-pulse" />
          ))}
        </div>
      ) : withOutput.length === 0 && inFlight.length === 0 ? (
        <div className="pane p-10 text-center text-zinc-400">
          <div className="section-label mb-2">Empty gallery</div>
          <p>No renders yet. Head to a character and dispatch one.</p>
        </div>
      ) : (
        <>
          {/* Thumbnail grid — dense, clean, contact-sheet style */}
          {withOutput.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2" data-testid="gallery-grid">
              {withOutput.map((r, i) => {
                const output = primaryOutput(r);
                const checked = selected.includes(r.id);
                return (
                  <div key={r.id}
                    data-testid={`gallery-thumb-${i}`}
                    className={`relative aspect-square rounded-lg overflow-hidden border bg-elevated group ${checked ? "border-amber-400 ring-2 ring-amber-400/50" : "hairline"}`}>
                    <button type="button"
                      onClick={() => {
                        if (selectionMode) toggleSelected(r.id);
                        else {
                          setLightbox(r);
                          setShowDetails(false);
                        }
                      }}
                      className="absolute inset-0 w-full h-full focus:outline-none focus:ring-2 focus:ring-amber-400/60">
                      {isVideoUrl(output) ? (
                        <video src={output} muted playsInline preload="none"
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                      ) : (
                        <img src={output}
                          alt={r.prompt_positive?.slice(0, 40) || "render"}
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute inset-x-0 bottom-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-300 truncate">
                          {r.workflow_name || r.workflow_type}
                        </div>
                      </div>
                    </button>
                    {selectionMode ? (
                      <button type="button" onClick={() => toggleSelected(r.id)}
                        className={`absolute left-1 top-1 z-10 h-7 w-7 rounded-full border grid place-items-center ${checked ? "border-amber-300 bg-amber-400 text-black" : "border-white/40 bg-black/70 text-white"}`}
                        aria-label={checked ? "Deselect render" : "Select render"}>
                        {checked ? "✓" : ""}
                      </button>
                    ) : (
                      <button type="button" onClick={() => confirmRemoveOne(r)}
                        className="absolute left-1 top-1 z-10 h-7 w-7 rounded-full bg-black/70 text-zinc-200 grid place-items-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:bg-red-500"
                        aria-label="Remove from Gallery" data-testid={`btn-delete-render-${i}`}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <span className="absolute top-1 right-1 z-10 text-[9px] font-mono px-1.5 py-0.5 rounded backdrop-blur-sm bg-black/60 text-emerald-300 pointer-events-none">
                      {isVideoUrl(output) ? "video" : r.output_variants?.enhanced?.length ? "enhanced" : "done"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* In-flight strip — small, at the bottom, so you can see what's cooking */}
          {inFlight.length > 0 && (
            <div className="pane p-3 space-y-2" data-testid="gallery-inflight">
              <div className="section-label">In flight · {inFlight.length}</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {inFlight.map((r, i) => (
                  <div key={r.id} className="aspect-square rounded-md border hairline bg-elevated grid place-items-center">
                    <span className={`text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full border ${STATUS_STYLE[r.status] || "text-zinc-400 border-zinc-700"}`}>
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Lightbox modal */}
      {lightbox && (
        <div
          onClick={() => { setLightbox(null); setShowDetails(false); }}
          data-testid="gallery-lightbox"
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md p-0 sm:p-6 flex items-center justify-center"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full h-full md:h-auto max-w-6xl md:max-h-full flex flex-col md:flex-row md:gap-4"
          >
            {/* Mobile controls float over the image instead of covering it with metadata. */}
            <button
              type="button"
              onClick={() => { setLightbox(null); setShowDetails(false); }}
              className="md:hidden absolute right-3 top-[calc(.75rem+env(safe-area-inset-top,0px))] z-30 h-10 w-10 grid place-items-center rounded-full border border-white/20 bg-black/70 text-white backdrop-blur-md"
              aria-label="Close full-screen image"
            >
              <X className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => setShowDetails((value) => !value)}
              className="md:hidden absolute bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] left-1/2 z-30 -translate-x-1/2 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/75 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-md"
              data-testid="btn-lightbox-details-mobile"
            >
              <Info className="h-4 w-4" /> {showDetails ? "Hide details" : "Details"}
            </button>

            {withOutput.length > 1 && (
              <>
                <button type="button" onClick={() => showAdjacent(-1)}
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 h-11 w-11 grid place-items-center rounded-full border border-white/20 bg-black/65 text-white backdrop-blur-md"
                  aria-label="Previous gallery item" data-testid="btn-lightbox-previous">
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button type="button" onClick={() => showAdjacent(1)}
                  className="absolute right-2 md:right-[21rem] sm:right-4 top-1/2 -translate-y-1/2 z-30 h-11 w-11 grid place-items-center rounded-full border border-white/20 bg-black/65 text-white backdrop-blur-md"
                  aria-label="Next gallery item" data-testid="btn-lightbox-next">
                  <ChevronRight className="h-6 w-6" />
                </button>
                <div className="absolute left-1/2 top-[calc(.9rem+env(safe-area-inset-top,0px))] -translate-x-1/2 z-20 rounded-full bg-black/65 px-3 py-1 text-[11px] font-mono text-zinc-200">
                  {lightboxIndex + 1} / {withOutput.length}
                </div>
              </>
            )}

            {/* Image column */}
            <div className="flex-1 min-h-0 h-full flex items-center justify-center touch-pan-y"
              onTouchStart={(event) => { swipeStartX.current = event.touches[0]?.clientX ?? null; }}
              onTouchEnd={(event) => {
                if (swipeStartX.current == null) return;
                const delta = (event.changedTouches[0]?.clientX ?? swipeStartX.current) - swipeStartX.current;
                swipeStartX.current = null;
                if (Math.abs(delta) >= 50) showAdjacent(delta > 0 ? -1 : 1);
              }}>
              {isVideoUrl(primaryOutput(lightbox)) ? (
                <video src={primaryOutput(lightbox)} controls autoPlay playsInline loop
                  data-testid="gallery-lightbox-video"
                  className="max-h-[100dvh] md:max-h-[85vh] max-w-full object-contain md:rounded-lg shadow-2xl" />
              ) : (
                <img
                  src={primaryOutput(lightbox)}
                  alt={lightbox.prompt_positive?.slice(0, 60) || "render"}
                  data-testid="gallery-lightbox-image"
                  className="max-h-[100dvh] md:max-h-[85vh] max-w-full object-contain md:rounded-lg shadow-2xl"
                />
              )}
            </div>

            {/* Meta column */}
            <aside className={`${showDetails ? "flex" : "hidden"} md:flex flex-col fixed md:static inset-x-0 bottom-0 z-40 w-full md:w-80 shrink-0 pane rounded-b-none md:rounded-[14px] p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] md:pb-4 space-y-3 max-h-[78dvh] md:max-h-[85vh] overflow-y-auto scroll-fade shadow-2xl`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="section-label">Render</div>
                  <div className="font-display font-bold text-sm mt-0.5">{lightbox.workflow_name || lightbox.workflow_type}</div>
                </div>
                <button
                  onClick={() => setShowDetails(false)}
                  className="md:hidden h-8 w-8 grid place-items-center rounded-md text-zinc-400 hover:bg-white/5"
                  aria-label="Hide render details"
                >
                  <X className="h-4 w-4" />
                </button>
                <button
                  onClick={() => { setLightbox(null); setShowDetails(false); }}
                  data-testid="btn-lightbox-close"
                  className="hidden md:grid h-8 w-8 place-items-center rounded-md text-zinc-400 hover:bg-white/5"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="rounded-md bg-elevated border hairline p-2">
                  <div className="text-zinc-500 uppercase tracking-widest text-[9px]">Status</div>
                  <div className="text-emerald-300 mt-0.5">done</div>
                </div>
                {lightbox.seed_used != null && (
                  <div className="rounded-md bg-elevated border hairline p-2">
                    <div className="text-zinc-500 uppercase tracking-widest text-[9px]">Seed</div>
                    <div className="text-amber-300 mt-0.5 truncate">{lightbox.seed_used}</div>
                  </div>
                )}
              </div>

              {lightbox.prompt_positive && (
                <div>
                  <div className="text-[9px] font-mono uppercase tracking-widest text-zinc-500 mb-1">Positive prompt</div>
                  <div className="text-[11px] font-mono text-zinc-300 bg-elevated border hairline rounded-md p-2 max-h-32 overflow-y-auto scroll-fade whitespace-pre-wrap">
                    {lightbox.prompt_positive}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2 pt-2">
                <div className="grid grid-cols-2 gap-2">
                  <button type="button"
                    onClick={() => recreate.mutate({ id: lightbox.id, variation: false })}
                    disabled={recreate.isPending}
                    data-testid="btn-lightbox-recreate"
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20 text-sm px-3 py-2 disabled:opacity-40">
                    {recreate.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />} Recreate
                  </button>
                  <button type="button"
                    onClick={() => recreate.mutate({ id: lightbox.id, variation: true })}
                    disabled={recreate.isPending}
                    data-testid="btn-lightbox-variation"
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-violet-500/40 bg-violet-500/10 text-violet-200 hover:bg-violet-500/20 text-sm px-3 py-2 disabled:opacity-40">
                    <Shuffle className="h-4 w-4" /> Variation
                  </button>
                </div>
                {!isVideoUrl(primaryOutput(lightbox)) && (
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button"
                      onClick={() => reuseAsReference.mutate({ render: lightbox, targetKind: "edit" })}
                      disabled={reuseAsReference.isPending}
                      data-testid="btn-lightbox-edit-again"
                      className="inline-flex items-center justify-center gap-2 rounded-lg border hairline text-zinc-200 hover:bg-white/5 text-sm px-3 py-2 disabled:opacity-40">
                      <Pencil className="h-4 w-4" /> Edit Again
                    </button>
                    <button type="button"
                      onClick={() => reuseAsReference.mutate({ render: lightbox, targetKind: "video" })}
                      disabled={reuseAsReference.isPending}
                      data-testid="btn-lightbox-animate"
                      className="inline-flex items-center justify-center gap-2 rounded-lg border hairline text-zinc-200 hover:bg-white/5 text-sm px-3 py-2 disabled:opacity-40">
                      <Film className="h-4 w-4" /> Animate
                    </button>
                  </div>
                )}
                <button
                  onClick={() => downloadImage(primaryOutput(lightbox), `${lightbox.workflow_name || "render"}-${lightbox.id.slice(0, 8)}-enhanced.png`)}
                  data-testid="btn-lightbox-download"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold px-3 py-2"
                >
                  <Download className="h-4 w-4" /> Download enhanced
                </button>
                {originalOutput(lightbox) && (
                  <button
                    onClick={() => downloadImage(originalOutput(lightbox), `${lightbox.workflow_name || "render"}-${lightbox.id.slice(0, 8)}-original.png`)}
                    data-testid="btn-lightbox-download-original"
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg border hairline text-zinc-200 hover:bg-white/5 text-sm px-3 py-2"
                  >
                    <Download className="h-4 w-4" /> Download original
                  </button>
                )}
                <button
                  onClick={() => { navigator.clipboard.writeText(lightbox.prompt_positive || ""); toast.success("Prompt copied"); }}
                  data-testid="btn-lightbox-copy-prompt"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg border hairline text-zinc-200 hover:bg-white/5 text-sm px-3 py-2"
                >
                  <Copy className="h-4 w-4" /> Copy prompt
                </button>
                <button
                  type="button"
                  onClick={() => confirmRemoveOne(lightbox)}
                  disabled={removeOne.isPending}
                  data-testid="btn-lightbox-delete"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-red-500/40 text-red-200 hover:bg-red-500/10 text-sm px-3 py-2 disabled:opacity-40"
                >
                  <Trash2 className="h-4 w-4" /> Remove from Gallery
                </button>
                {lightbox.character_id && (
                  <Link
                    to={`/character/${lightbox.character_id}`}
                    data-testid="btn-lightbox-open-character"
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg border hairline text-zinc-200 hover:bg-white/5 text-sm px-3 py-2"
                  >
                    <ExternalLink className="h-4 w-4" /> Open character
                  </Link>
                )}
              </div>
            </aside>
          </div>
        </div>
      )}
    </div>
  );
}
