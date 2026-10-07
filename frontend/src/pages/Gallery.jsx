import { confirmPermanentDelete } from "@/lib/permanentDeleteConfirmation";
import GalleryCarousel from "@/components/GalleryCarousel";
import StudioLoading from "@/components/StudioLoading";
import GalleryBrowseControls from "@/components/GalleryBrowseControls";
import { browseGallery, galleryIsVideo, galleryModel, galleryRefreshInterval } from "@/lib/galleryBrowse";
import ImageRecoveryPanel from "@/components/ImageRecoveryPanel";
import PostGenerationActions from "@/components/PostGenerationActions";
import { loadBodyCreationRecipe } from "@/lib/bodyCreationRecipe";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { API_BASE, endpoints } from "@/lib/api";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { X, Download, Copy, ExternalLink, Trash2, CheckSquare, RotateCcw, Shuffle, Pencil, Film, Loader2, Info, ChevronLeft, ChevronRight, PersonStanding, BookOpen, FolderPlus, Columns2, ScanFace, SlidersHorizontal } from "lucide-react";
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
const isVideoUrl = galleryIsVideo;

function GalleryImage({ src, alt }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return failed ? (
    <span className="absolute inset-0 flex items-center justify-center px-4 text-center text-xs text-zinc-400">
      Image unavailable. Check the ComfyUI output location.
    </span>
  ) : (
    <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)}
      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 group-focus-within:scale-105" />
  );
}

const generationValue = (render, key) =>
  render?.generation_settings?.[key] ?? render?.render_recipe?.[key] ?? null;

const renderDimensions = (render) => {
  const width = generationValue(render, "width");
  const height = generationValue(render, "height");
  return width && height ? `${width} × ${height}` : "—";
};

const renderOperationLabel = (render) => {
  if (render?.operation === "variation") return "New seed";
  if (render?.operation === "small_variation") return "Small variation";
  if (render?.operation === "anatomy_repair") return "Anatomy repair";
  if (render?.operation === "recreate") return "Recreate";
  if (render?.parent_render_id) return "Derived";
  return "Original";
};

const formatRenderDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
};

export default function Gallery() {
  const qc = useQueryClient();
  const nav = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const requestedRenderId = searchParams.get("render");
  const returnTo = searchParams.get("returnTo") || location.state?.returnTo || "";
  const { data: renders = [], isLoading, isError, error, isFetching, refetch } = useQuery({
    queryKey: ["renders"],
    queryFn: endpoints.listRenders,
    refetchInterval: (query) => galleryRefreshInterval(query.state.data),
    refetchOnMount: "always",
  });
  const [lightbox, setLightbox] = useState(null); // render object
  const [retrySelection, setRetrySelection] = useState(null);
  const [retryPreview, setRetryPreview] = useState(null);
  useEffect(() => { setRetrySelection(null); setRetryPreview(null); }, [lightbox?.id, lightbox?.alignment_review?.reviewed_at]);
  const [improvePreview, setImprovePreview] = useState(null);
  const [improvePrompt, setImprovePrompt] = useState("");
  const [improveSource, setImproveSource] = useState("");
  const [improveNegative, setImproveNegative] = useState("");
  const [improveInstruction, setImproveInstruction] = useState("");
  useEffect(() => {
    setImprovePreview(null);
    setImprovePrompt("");
    setImproveSource(lightbox?.prompt_positive || "");
    setImproveNegative(lightbox?.prompt_negative || "");
    setImproveInstruction("");
  }, [lightbox?.id, lightbox?.prompt_positive, lightbox?.prompt_negative]);
  useEffect(() => {
    if (!lightbox?.id) return;
    const updated = renders.find((render) => render.id === lightbox.id);
    if (updated && updated !== lightbox) setLightbox(updated);
  }, [renders, lightbox]);
  const [showDetails, setShowDetails] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selected, setSelected] = useState([]);
  const [albumFilter, setAlbumFilter] = useState("all");
  const [browse, setBrowse] = useState({ search: "", model: "all", media: "all", sort: "newest" });
  const [showQcFlagged, setShowQcFlagged] = useState(true);
  const [thumbSize, setThumbSize] = useState("medium");
  const [pageSize, setPageSize] = useState(24);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [compareOpen, setCompareOpen] = useState(false);
  const carousel = useRef(null);
  const directOpenApplied = useRef(false);
  const { data: versions = [] } = useQuery({
    queryKey: ["render-versions", lightbox?.id],
    queryFn: () => endpoints.getRenderVersions(lightbox.id),
    enabled: !!lightbox?.id,
    refetchInterval: lightbox?.id ? 5000 : false,
  });

  const removeOne = useMutation({
    mutationFn: ({ id }) => endpoints.deleteRender(id),
    onSuccess: (result, { id }) => {
      setSelected((current) => current.filter((item) => item !== id));
      if (lightbox?.id === id) setLightbox(null);
      qc.invalidateQueries({ queryKey: ["renders"] });
      toast.success(`Permanently deleted ${result.files_deleted || 0} output file(s)`);
    },
    onError: (error) => toast.error(error?.response?.data?.detail || "Could not remove render"),
  });

  const removeMany = useMutation({
    mutationFn: ({ ids }) => endpoints.deleteRenders(ids),
    onSuccess: (result) => {
      setSelected([]);
      setSelectionMode(false);
      setLightbox(null);
      qc.invalidateQueries({ queryKey: ["renders"] });
      toast.success(`Permanently deleted ${result.deleted || 0} items and ${result.files_deleted || 0} output file(s)`);
    },
    onError: (error) => toast.error(error?.response?.data?.detail || "Could not remove selected renders"),
  });
  const removeQcFlagged = useMutation({
    mutationFn: endpoints.deleteQcFlaggedRenders,
    onSuccess: (result) => {
      setSelected([]);
      setLightbox(null);
      setPage(1);
      qc.invalidateQueries({ queryKey: ["renders"] });
      toast.success(`Permanently deleted ${result.deleted || 0} items and ${result.files_deleted || 0} output file(s)`);
    },
    onError: (error) => toast.error(error?.response?.data?.detail || "Could not remove QC-flagged items"),
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
      toast.success(variables.variation ? "New seed added to the render queue" : "Exact recreation added to the render queue", {
        description: result.queue_position ? `Queue position #${result.queue_position}` : undefined,
      });
    },
    onError: (error) => toast.error(error?.response?.data?.detail || "Could not recreate this render"),
  });
  const recoverImage = useMutation({
    mutationFn: ({ id, body }) => endpoints.recoverRenderImage(id, body),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["renders"] });
      qc.invalidateQueries({ queryKey: ["queue"] });
      qc.invalidateQueries({ queryKey: ["render-versions"] });
      toast.success("New image version added to the queue", {
        description: result.queue_position ? `Queue position #${result.queue_position}` : undefined,
      });
    },
    onError: (error) => toast.error(error?.response?.data?.detail || "Could not prepare this image for recovery"),
  });
  const reviewAlignment = useMutation({
    mutationFn: endpoints.reviewRenderAlignment,
    onSuccess: (result, id) => {
      setLightbox((current) => current?.id === id ? { ...current, alignment_review: result, alignment_review_status: "done" } : current);
      qc.invalidateQueries({ queryKey: ["renders"] });
      toast.success("Image review complete");
    },
    onError: (error) => toast.error(error?.response?.data?.detail || "Could not review this image"),
  });
  const retryMissing = useMutation({
    mutationFn: endpoints.retryMissingDetails,
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["renders"] });
      qc.invalidateQueries({ queryKey: ["queue"] });
      toast.success("Retry added to the render queue", { description: result.queue_position ? `Queue position #${result.queue_position}` : undefined });
    },
    onError: (error) => toast.error(error?.response?.data?.detail || "Could not retry missing details"),
  });
  const previewMissing = useMutation({
    mutationFn: ({ id, indices }) => endpoints.previewMissingDetails(id, indices),
    onSuccess: (result) => setRetryPreview(result),
    onError: (error) => toast.error(error?.response?.data?.detail || "Could not preview the correction"),
  });
  const previewImprovement = useMutation({
    mutationFn: endpoints.previewImprovedRender,
    onSuccess: (result) => { setImprovePreview(result); setImprovePrompt(result.prompt_positive); },
    onError: (error) => toast.error(error?.response?.data?.detail || "Could not prepare an improved prompt"),
  });
  const queueImprovement = useMutation({
    mutationFn: endpoints.queueImprovedRender,
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["renders"] });
      qc.invalidateQueries({ queryKey: ["queue"] });
      toast.success("Improved render added to the queue", { description: result.queue_position ? `Queue position #${result.queue_position}` : undefined });
      setImprovePreview(null);
    },
    onError: (error) => toast.error(error?.response?.data?.detail || "Could not queue improved render"),
  });

  const reuseAsReference = useMutation({
    mutationFn: async ({ render, targetKind, referenceMode, instruction }) => {
      const previewUrl = primaryOutput(render);
      const reference = await endpoints.prepareRenderReference(render.id, previewUrl);
      const saved = referenceMode === "keep_character"
        ? await endpoints.getRenderRecipe(render.id)
        : null;
      return { render, targetKind, referenceMode, instruction, reference, saved, previewUrl };
    },
    onSuccess: ({ render, targetKind, referenceMode, instruction, reference, saved, previewUrl }) => {
      const path = render.character_id ? `/character/${render.character_id}` : "/character/new";
      nav(path, {
        state: {
          galleryReference: reference,
          editInstruction: instruction,
          previewUrl,
          targetKind,
          referenceMode,
          characterRecipe: saved?.recipe,
        },
      });
    },
    onError: (error) => toast.error(error?.response?.data?.detail || "Could not reuse this Gallery image"),
  });

  const openRecipe = useMutation({
    mutationFn: (render) => endpoints.getRenderRecipe(render.id).then((result) => ({ render, result })),
    onSuccess: ({ render, result }) => {
      const path = render.character_id ? `/character/${render.character_id}` : "/character/new";
      nav(path, { state: { renderRecipe: result, renderRecipeMode: "exact" } });
    },
    onError: (error) => toast.error(error?.response?.data?.detail || "Could not restore this render recipe"),
  });

  const rebuildCurrentCompiler = useMutation({
    mutationFn: (render) => endpoints.getRenderRecipe(render.id).then((result) => ({ render, result })),
    onSuccess: ({ render, result }) => {
      const path = render.character_id ? `/character/${render.character_id}` : "/character/new";
      nav(path, { state: { renderRecipe: result, renderRecipeMode: "current" } });
    },
    onError: (error) => toast.error(error?.response?.data?.detail || "Could not rebuild this setup with the current compiler"),
  });

  const openBodyCreation = useMutation({
    mutationFn: async (render) => ({ render, result: await loadBodyCreationRecipe(render, endpoints) }),
    onSuccess: ({ render, result }) => {
      const path = render.character_id ? `/character/${render.character_id}` : "/character/new";
      nav(`${path}/s/physique`, { state: { renderRecipe: result, renderRecipeMode: "body_creation" } });
    },
    onError: (error) => toast.error(error?.response?.data?.detail || error.message || "Could not load the original creation setup"),
  });

  const moveToAlbum = useMutation({
    mutationFn: ({ ids, album }) => endpoints.setRenderAlbumBulk(ids, album),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["renders"] });
      setSelected([]);
      setSelectionMode(false);
      toast.success(result.album ? `Moved to ${result.album}` : "Removed from album");
    },
    onError: (error) => toast.error(error?.response?.data?.detail || "Could not update album"),
  });

  const confirmRemoveOne = (render) => {
    const message = "Permanently delete this image or video and its output files from your hard drive? This cannot be undone.";
    if (confirmPermanentDelete(message)) {
      removeOne.mutate({ id: render.id });
    }
  };

  const confirmRemoveSelected = () => {
    if (!selected.length) return;
    const message = `Permanently delete ${selected.length} selected items and their output files from your hard drive? This cannot be undone.`;
    if (confirmPermanentDelete(message)) {
      removeMany.mutate({ ids: selected });
    }
  };

  const toggleSelected = (id) => {
    setSelected((current) => current.includes(id)
      ? current.filter((item) => item !== id)
      : [...current, id]);
  };

  // The gallery only treats work that can still produce output as in flight.
  // Terminal records without media (cancelled/failed/offline) are not empty tiles.
  const qcFlagged = renders.filter((r) => r.anatomy_guard_status === "failed" && primaryOutput(r));
  const withOutput = renders.filter((r) => primaryOutput(r) && (showQcFlagged || r.anatomy_guard_status !== "failed"));
  const albums = [...new Set(withOutput.map((render) => render.album).filter(Boolean))].sort();
  const models = useMemo(() => [...new Set(renders.filter((render) => primaryOutput(render)).map(galleryModel))].sort(), [renders]);
  const displayedOutput = useMemo(() => browseGallery(renders, { ...browse, album: albumFilter, showQc: showQcFlagged }),
    [renders, browse, albumFilter, showQcFlagged]);
  const pageCount = Math.max(1, Math.ceil(displayedOutput.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageOutput = displayedOutput.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const pageIds = pageOutput.map((render) => render.id);
  const pageFullySelected = pageIds.length > 0 && pageIds.every((id) => selected.includes(id));
  const togglePageSelection = () => {
    setSelected((current) => pageIds.every((id) => current.includes(id))
      ? current.filter((id) => !pageIds.includes(id))
      : [...new Set([...current, ...pageIds])]);
  };
  const inFlight = renders.filter((r) => !primaryOutput(r) && ["queued", "dispatching", "running"].includes(r.status));
  const cancelled = renders.filter((r) => !primaryOutput(r) && r.status === "cancelled");
  const lightboxIndex = lightbox ? displayedOutput.findIndex((r) => r.id === lightbox.id) : -1;
  const commitAdjacent = (offset) => {
    if (!displayedOutput.length || lightboxIndex < 0) return;
    const nextIndex = (lightboxIndex + offset + displayedOutput.length) % displayedOutput.length;
    setLightbox(displayedOutput[nextIndex]);
    setShowDetails(false);
  };

  const showAdjacent = offset => carousel.current?.navigate(offset);

  const { data: requestedRender, isError: requestedError } = useQuery({
    queryKey: ["gallery-requested-render", requestedRenderId],
    queryFn: () => endpoints.getRender(requestedRenderId),
    enabled: !!requestedRenderId && !renders.some((render) => render.id === requestedRenderId),
    refetchInterval: (query) => query.state.data && !primaryOutput(query.state.data)
      && ["queued", "dispatching", "running"].includes(query.state.data.status) ? 2000 : false,
  });
  useEffect(() => {
    if (!requestedRenderId || directOpenApplied.current === requestedRenderId) return;
    const requested = renders.find((render) => render.id === requestedRenderId) || requestedRender;
    if (requested && primaryOutput(requested)) {
      directOpenApplied.current = requestedRenderId;
      setLightbox(requested);
    }
  }, [requestedRenderId, renders, requestedRender]);

  useEffect(() => {
    if (!lightbox) return undefined;
    const onKeyDown = (event) => {
      if (event.target?.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(event.target?.tagName)) return;
      if (event.key === "ArrowLeft") showAdjacent(-1);
      if (event.key === "ArrowRight") showAdjacent(1);
      if (event.key === "Escape") { setLightbox(null); setShowDetails(false); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const confirmClearCancelled = () => {
    if (!cancelled.length) return;
    if (confirmPermanentDelete(`Permanently remove ${cancelled.length} cancelled record${cancelled.length === 1 ? "" : "s"} from Ultra Studio? Any associated output files will also be permanently deleted.`)) {
      clearCancelled.mutate();
    }
  };

  const promptForAlbum = () => {
    if (!selected.length) return;
    const album = window.prompt("Album name (leave blank to remove from an album):", "");
    if (album === null) return;
    moveToAlbum.mutate({ ids: selected, album });
  };

  const compared = selected.length === 2
    ? selected.map((id) => withOutput.find((render) => render.id === id)).filter(Boolean)
    : [];

  return (
    <div className="mx-auto max-w-[1400px] px-3 sm:px-6 py-4 sm:py-10 space-y-3 sm:space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="section-label hidden sm:block">Gallery</div>
          <h1 className="font-display font-extrabold text-2xl sm:text-4xl sm:mt-1">Renders</h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            {withOutput.length} finished · {inFlight.length} in flight.
            <span className="hidden sm:inline"> Tap a thumbnail to open.</span>
            {selectionMode && <span className="ml-2 text-amber-200">{selected.length} selected</span>}
          </p>
        </div>
        <div className="flex items-center gap-2 sm:hidden">
          {selectionMode && <button type="button" onClick={() => { setSelectionMode(false); setSelected([]); }}
            className="rounded-lg border hairline px-3 py-2 text-xs text-zinc-200">Cancel selection</button>}
          <button type="button" aria-expanded={optionsOpen} aria-controls="gallery-options"
            onClick={() => setOptionsOpen(value => !value)} data-testid="btn-gallery-options"
            className="inline-flex items-center gap-2 rounded-lg border hairline px-3 py-2 text-sm text-zinc-200">
            <SlidersHorizontal className="h-4 w-4" /> {optionsOpen ? "Hide options" : "Options"}
          </button>
        </div>
        {returnTo && (
          <button type="button" onClick={() => nav(returnTo)}
            className="inline-flex items-center gap-1 rounded-lg border hairline px-3 py-2 text-sm font-semibold text-zinc-200 hover:bg-white/5"
            data-testid="btn-gallery-return-to-editor">
            <ChevronLeft className="h-4 w-4" /> Back to editor
          </button>
        )}
      </div>

      <div id="gallery-options" data-testid="gallery-options"
        className={`${optionsOpen ? "block" : "hidden"} sm:block space-y-4`}>
        <div className="flex items-center justify-between sm:hidden">
          <span className="section-label">Gallery options</span>
          <button type="button" onClick={() => setOptionsOpen(false)} className="rounded-lg border hairline px-3 py-2 text-xs text-zinc-200">Done</button>
        </div>
        {(withOutput.length > 0 || cancelled.length > 0) && (
          <div className="flex flex-wrap gap-2">
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
                setOptionsOpen(false);
              }}
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${selectionMode ? "border-amber-500/50 bg-amber-500/10 text-amber-200" : "hairline text-zinc-200"}`}
              data-testid="btn-gallery-select">
              <CheckSquare className="h-4 w-4" /> {selectionMode ? "Cancel" : "Select"}
            </button>

            )}
            {selectionMode && pageIds.length > 0 && (
              <button type="button" onClick={togglePageSelection}
                data-testid="btn-gallery-select-page"
                aria-pressed={pageFullySelected}
                className="inline-flex items-center gap-2 rounded-lg border hairline px-3 py-2 text-sm text-zinc-200 hover:bg-white/5">
                <CheckSquare className="h-4 w-4" /> {pageFullySelected ? "Deselect this page" : `Select all on this page (${pageIds.length})`}
              </button>
            )}
            {selectionMode && selected.length > 0 && (
              <>
                <button type="button" onClick={promptForAlbum} disabled={moveToAlbum.isPending}
                  className="inline-flex items-center gap-2 rounded-lg border hairline px-3 py-2 text-sm text-zinc-200 disabled:opacity-40"
                  data-testid="btn-gallery-album-selected">
                  <FolderPlus className="h-4 w-4" /> Album
                </button>
                {selected.length === 2 && (
                  <button type="button" onClick={() => setCompareOpen(true)}
                    className="inline-flex items-center gap-2 rounded-lg border border-cyan-500/50 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-100"
                    data-testid="btn-gallery-compare">
                    <Columns2 className="h-4 w-4" /> Compare
                  </button>
                )}
                <button type="button" onClick={confirmRemoveSelected}
                  disabled={removeMany.isPending}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-200 disabled:opacity-40"
                  data-testid="btn-gallery-delete-selected">
                  <Trash2 className="h-4 w-4" /> Delete {selected.length}
                </button>
              </>
            )}

          </div>
        )}
        <GalleryBrowseControls value={browse} models={models} onChange={(next) => { setBrowse(next); setPage(1); }}
          matches={displayedOutput.length} total={withOutput.length} onRefresh={() => refetch()} refreshing={isFetching} />
        {withOutput.length > 0 && (
          <div className="gallery-shelf" data-testid="gallery-album-filter">
            {[{ key: "all", label: `All ${withOutput.length}` }, { key: "unfiled", label: "Unfiled" }, ...albums.map((album) => ({ key: album, label: album }))].map((item) => (
              <button key={item.key} type="button" onClick={() => { setAlbumFilter(item.key); setPage(1); }}
                aria-pressed={albumFilter === item.key}
                className={`gallery-album ${albumFilter === item.key ? "gallery-album-active" : ""}`}>
                {(() => {
                  const cover = withOutput.find((render) => item.key === "all" || (item.key === "unfiled" ? !render.album : render.album === item.key));
                  const coverUrl = cover && primaryOutput(cover);
                  return coverUrl && !isVideoUrl(coverUrl) ? <img src={coverUrl} alt="" loading="lazy" /> : null;
                })()}
                <span className="gallery-album-title">{item.label}</span>
              </button>
            ))}
          </div>
        )}

        {qcFlagged.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 rounded-lg border hairline bg-elevated p-3 text-xs text-zinc-300" data-testid="gallery-qc-controls">
            <button type="button" aria-pressed={showQcFlagged} data-testid="btn-gallery-show-qc"
              onClick={() => { setShowQcFlagged((value) => !value); setSelected([]); setLightbox(null); setPage(1); }}
              className={`rounded-lg border px-3 py-2 ${showQcFlagged ? "border-amber-400/50 bg-amber-400/10 text-amber-100" : "hairline"}`}>
              Show QC-flagged images: {showQcFlagged ? "On" : "Off"}
            </button>
            <button type="button" disabled={removeQcFlagged.isPending} data-testid="btn-gallery-delete-all-qc"
              onClick={() => confirmPermanentDelete("Permanently delete ALL QC-flagged renders and their output files from your hard drive? This cannot be undone.") && removeQcFlagged.mutate()}
              className="rounded-lg border border-red-500/40 px-3 py-2 text-red-200 hover:bg-red-500/10 disabled:opacity-40">
              <Trash2 className="mr-1 inline h-3.5 w-3.5" /> Delete all QC-flagged
            </button>
          </div>
        )}

        {withOutput.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400" data-testid="gallery-thumbnail-size">
            <span>Thumbnails</span>
            {["small", "medium", "large"].map((size) => (
              <button key={size} type="button" onClick={() => setThumbSize(size)} aria-pressed={thumbSize === size}
                className={`rounded-lg border px-2 py-1 capitalize ${thumbSize === size ? "border-cyan-400 text-cyan-100 bg-cyan-400/10" : "hairline"}`}>{size}</button>
            ))}
            <span className="ml-2">Per page</span>
            {[12, 16, 20, 24].map((size) => (
              <button key={size} type="button" onClick={() => { setPageSize(size); setPage(1); }} aria-pressed={pageSize === size}
                data-testid={`gallery-page-size-${size}`}
                className={`rounded-lg border px-2 py-1 ${pageSize === size ? "border-amber-400 text-amber-100 bg-amber-400/10" : "hairline"}`}>{size}</button>
            ))}
          </div>
        )}
      </div>

      {isError && <div role="alert" className="pane border-rose-500/40 p-4 text-sm text-rose-200">
        Could not refresh Gallery. {error?.response?.data?.detail || "Check the backend connection and try Refresh."}
        {!!renders.length && <span className="block mt-1 text-xs text-zinc-400">Your last loaded images remain available.</span>}
      </div>}
      {requestedError && <p role="alert" className="text-sm text-rose-300">The requested render could not be opened. It may have been removed.</p>}
      {isLoading ? (
        <StudioLoading label="Loading Gallery…" />
      ) : !isError && withOutput.length === 0 && inFlight.length === 0 ? (
        <div className="pane p-10 text-center text-zinc-400">
          <div className="section-label mb-2">Empty gallery</div>
          <p>No renders yet. Head to a character and dispatch one.</p>
        </div>
      ) : (
        <>
          {displayedOutput.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-400">
              <span>Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, displayedOutput.length)} of {displayedOutput.length}</span>
            </div>
          )}
          {displayedOutput.length === 0 && withOutput.length > 0 && <div className="pane p-8 text-center text-zinc-400">
            No images match these filters. Clear the search or choose another album.
            <button type="button" onClick={() => setOptionsOpen(true)} className="mt-3 rounded-lg border hairline px-3 py-2 text-sm text-zinc-200 sm:hidden">Show options</button>
          </div>}
          {/* Thumbnail grid — dense, clean, contact-sheet style */}
          {displayedOutput.length > 0 && (
            <div className={`grid gap-2 ${thumbSize === "small" ? "grid-cols-3 sm:grid-cols-4 md:grid-cols-6" : thumbSize === "large" ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4"}`} data-testid="gallery-grid">
              {pageOutput.map((r, i) => {
                const output = primaryOutput(r);
                const checked = selected.includes(r.id);
                return (
                  <div key={r.id}
                    data-testid={`gallery-thumb-${(currentPage - 1) * pageSize + i}`}
                    className={`gallery-poster relative aspect-square rounded-lg overflow-hidden border bg-elevated group ${checked ? "border-amber-400 ring-2 ring-amber-400/50" : "hairline"}`}>
                    <button type="button"
                      onClick={() => {
                        if (selectionMode) toggleSelected(r.id);
                        else {
                          setLightbox(r);
                          setShowDetails(false);
                        }
                      }}
                      className="gallery-poster-open absolute inset-0 w-full h-full focus:outline-none focus:ring-2 focus:ring-amber-400/60" aria-label={`Open ${r.workflow_name || "render"} image`}>
                      {isVideoUrl(output) ? (
                        <video src={output} muted playsInline preload="none"
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 group-focus-within:scale-105" />
                      ) : (
                        <GalleryImage src={output} alt={r.prompt_positive?.slice(0, 40) || "render"} />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent opacity-40 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity" />
                      <div className="gallery-poster-caption hidden sm:block absolute inset-x-0 bottom-0 p-2 transition-opacity">
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
                        className="absolute left-1 top-1 z-10 h-7 w-7 rounded-full bg-black/70 text-zinc-200 hidden sm:grid place-items-center sm:opacity-0 sm:group-hover:opacity-100 hover:bg-red-500"
                        aria-label="Permanently delete image or video" data-testid={`btn-delete-render-${i}`}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <span className="absolute top-1 right-1 z-10 hidden sm:block text-[9px] font-mono px-1.5 py-0.5 rounded backdrop-blur-sm bg-black/60 text-emerald-300 pointer-events-none">
                      {r.anatomy_guard_status === "failed" ? "QC flagged" : isVideoUrl(output) ? "video" : r.output_variants?.enhanced?.length ? "enhanced" : "done"}
                    </span>
                    {!selectionMode && <button type="button" onClick={() => openRecipe.mutate(r)} disabled={openRecipe.isPending}
                      className="absolute bottom-2 right-2 z-10 hidden sm:inline-flex rounded-lg border border-cyan-300/30 bg-black/80 px-2 py-1.5 text-[10px] font-semibold text-cyan-100 disabled:opacity-40"
                      aria-label={`Open exact recipe for ${r.workflow_name || "render"}`} title="Load the saved prompt, seed and settings into Builder for review; does not queue a render" data-testid={`gallery-use-recipe-${r.id}`}>
                      Open exact recipe
                    </button>}
                    {r.album && <span className="absolute bottom-10 left-1 z-10 hidden sm:block max-w-[90%] truncate rounded bg-black/65 px-1.5 py-0.5 text-[9px] text-zinc-200 pointer-events-none">{r.album}</span>}
                  </div>
                );
              })}
            </div>
          )}
          {pageCount > 1 && <nav aria-label="Gallery pages" className="flex flex-wrap items-center justify-center gap-3 text-sm">
            <button type="button" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)} className="rounded-lg border hairline px-3 py-2 disabled:opacity-40">Previous</button>
            <span>Page {currentPage} of {pageCount}</span>
            <label className="flex items-center gap-2">Go to page
              <input key={currentPage} type="number" min="1" max={pageCount} defaultValue={currentPage}
                aria-label="Go to gallery page" data-testid="gallery-page-jump"
                onBlur={(event) => {
                  const requested = Number(event.currentTarget.value);
                  if (Number.isInteger(requested) && requested >= 1) setPage(Math.min(requested, pageCount));
                  else event.currentTarget.value = String(currentPage);
                }}
                onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }}
                className="w-16 rounded-lg border hairline bg-elevated px-2 py-2 text-center text-zinc-100" />
            </label>
            <button type="button" disabled={currentPage >= pageCount} onClick={() => setPage(currentPage + 1)} className="rounded-lg border hairline px-3 py-2 disabled:opacity-40">Next</button>
          </nav>}

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
            {returnTo && (
              <button type="button" onClick={() => nav(returnTo)}
                className="absolute left-3 top-[calc(.75rem+env(safe-area-inset-top,0px))] z-30 inline-flex h-10 items-center gap-1 rounded-full border border-white/20 bg-black/70 px-3 text-sm font-semibold text-white backdrop-blur-md"
                data-testid="btn-return-to-builder">
                <ChevronLeft className="h-4 w-4" /> Edit
              </button>
            )}
            <button
              type="button"
              onClick={() => { setLightbox(null); setShowDetails(false); }}
              className="md:hidden absolute right-3 top-[calc(.75rem+env(safe-area-inset-top,0px))] z-30 h-10 w-10 grid place-items-center rounded-full border border-white/20 bg-black/70 text-white backdrop-blur-md"
              aria-label="Close full-screen image"
            >
              <X className="h-5 w-5" />
            </button>
            <button type="button" onClick={() => confirmRemoveOne(lightbox)} disabled={removeOne.isPending}
              data-testid="btn-lightbox-delete-fullscreen" aria-label="Permanently delete this image or video"
              className={`absolute right-16 ${returnTo ? "md:left-24" : "md:left-3"} md:right-auto top-[calc(.75rem+env(safe-area-inset-top,0px))] z-30 inline-flex h-10 items-center gap-1.5 rounded-full border border-red-400/50 bg-black/75 px-3 text-xs font-semibold text-red-200 disabled:opacity-40`}>
              <Trash2 className="h-4 w-4" />{removeOne.isPending ? "Deleting…" : "Delete"}
            </button>
            <button
              type="button"
              onClick={() => setShowDetails((value) => !value)}
              className="md:hidden absolute bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] left-1/2 z-30 -translate-x-1/2 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/75 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-md"
              data-testid="btn-lightbox-details-mobile"
            >
              <Info className="h-4 w-4" /> {showDetails ? "Hide details" : "Details"}
            </button>

            {displayedOutput.length > 1 && lightboxIndex >= 0 && (
              <>
                <button type="button" onClick={() => showAdjacent(-1)}
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 h-11 w-11 grid place-items-center rounded-full border border-white/20 bg-black/65 text-white backdrop-blur-md"
                  aria-label="Previous gallery item" data-testid="btn-lightbox-previous">
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button type="button" onClick={() => showAdjacent(1)}
                  className="absolute right-2 md:right-[25rem] sm:right-4 top-1/2 -translate-y-1/2 z-30 h-11 w-11 grid place-items-center rounded-full border border-white/20 bg-black/65 text-white backdrop-blur-md"
                  aria-label="Next gallery item" data-testid="btn-lightbox-next">
                  <ChevronRight className="h-6 w-6" />
                </button>
                <div className="absolute left-1/2 top-[calc(.9rem+env(safe-area-inset-top,0px))] -translate-x-1/2 z-20 rounded-full bg-black/65 px-3 py-1 text-[11px] font-mono text-zinc-200">
                  {lightboxIndex + 1} / {displayedOutput.length}
                </div>
              </>
            )}

            {/* Image column */}
            <GalleryCarousel ref={carousel} current={lightbox}
              items={displayedOutput}
              onNavigate={commitAdjacent} outputUrl={primaryOutput} isVideo={isVideoUrl} />

            {/* Meta column */}
            <aside className={`${showDetails ? "flex" : "hidden"} md:flex flex-col fixed md:static inset-x-0 bottom-0 z-40 w-full md:w-96 shrink-0 pane rounded-t-2xl rounded-b-none md:rounded-[14px] p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] md:pb-4 space-y-3 max-h-[84dvh] md:max-h-[85vh] overflow-y-auto scroll-fade shadow-2xl`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="section-label">Render</div>
                  <div className="font-display font-bold text-base mt-0.5 truncate">{lightbox.workflow_name || lightbox.workflow_type}</div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full border hairline bg-elevated px-2 py-0.5 text-[9px] font-mono uppercase tracking-wide text-zinc-400">
                      {lightbox.workflow_type || "image"}
                    </span>
                    <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[9px] font-mono uppercase tracking-wide text-violet-200">
                      {renderOperationLabel(lightbox)}
                    </span>
                    {formatRenderDate(lightbox.created_at) && (
                      <span className="text-[9px] font-mono text-zinc-500">{formatRenderDate(lightbox.created_at)}</span>
                    )}
                  </div>
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

              {lightbox.anatomy_guard_status === "failed" && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-100" role="status">
                  Anatomy check flagged this image. The completed ComfyUI file is preserved in your gallery.
                  {lightbox.anatomy_guard_summary && <p className="mt-1 text-amber-200/80">{lightbox.anatomy_guard_summary}</p>}
                </div>
              )}

              {!isVideoUrl(primaryOutput(lightbox)) && <div className="space-y-3">
                    <ImageRecoveryPanel key={lightbox.id} busy={recoverImage.isPending}
                      onImprove={(instruction, mode, targets) => endpoints.aiEditPrompt(
                        mode === "anatomy_repair" ? `Repair only ${targets.join(", ")}: ${instruction}` : instruction,
                        true, mode === "small_variation" ? "variation" : "edit")}
                      onEdit={(instruction) => reuseAsReference.mutate({ render: lightbox, targetKind: "edit", instruction })}
                      onRecover={(body) => recoverImage.mutate({ id: lightbox.id,
                        body: { ...body, output_url: primaryOutput(lightbox) } })} />
                    <button onClick={() => downloadImage(primaryOutput(lightbox), `${lightbox.workflow_name || "render"}-${lightbox.id.slice(0, 8)}-enhanced.png`)}
                      data-testid="btn-lightbox-download" className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 text-black text-sm font-semibold px-3 py-2">
                      <Download className="h-4 w-4" /> Download
                    </button>
              </div>}
                {isVideoUrl(primaryOutput(lightbox)) && (
                  <button onClick={() => downloadImage(primaryOutput(lightbox), `${lightbox.workflow_name || "video"}-${lightbox.id.slice(0, 8)}.webm`)} className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 text-black text-sm font-semibold px-3 py-2">
                    <Download className="h-4 w-4" /> Download video
                  </button>
                )}
              <button type="button" disabled={!lightbox.prompt_positive} onClick={async () => {
                try {
                  await navigator.clipboard.writeText(lightbox.prompt_positive || "");
                  toast.success("Prompt copied");
                } catch { toast.error("Could not copy the prompt. Select it in Prompt & advanced actions to copy manually."); }
              }} data-testid="btn-lightbox-copy-prompt" className="w-full rounded-lg border hairline px-3 py-2 text-sm disabled:opacity-40"><Copy className="inline h-4 w-4 mr-2" />Copy prompt</button>
              <details key={lightbox.id} className="rounded-lg border hairline bg-black/10 p-3" data-testid="gallery-other-tools">
                <summary className="cursor-pointer text-xs font-semibold text-zinc-300">Review image, prompt & recipe tools</summary>
                <div className="space-y-3 pt-3">
                  <details className="rounded-lg border hairline p-2.5" data-testid="gallery-action-guide">
                    <summary className="cursor-pointer text-xs text-cyan-200">What these actions do</summary>
                    <dl className="mt-3 space-y-2 text-xs text-zinc-400">
                      {[
                        ['Open exact recipe', 'Loads saved prompts, seed and settings into Builder. Review or change them before rendering. The card shortcut does the same thing.'],
                        ['Review image / Review again', 'AI compares the image with saved selections and reports missing details. It does not generate or edit an image.'],
                        ['Recreate Exact', 'Queues the saved recipe with the same seed. ComfyUI may reuse cached results when the graph is unchanged.'],
                        ['New seed', 'Queues the saved recipe with a different seed. This is a new generation, not an edit of the image.'],
                        ['Rebuild prompt', 'Opens saved selections in Builder and replaces the saved prompt with the current compiler output and starts with a new seed. Does not render until you choose Render.'],
                        ['Change body setup', 'Opens the original creation setup at Body controls to generate a new image with revised proportions. Does not edit the existing image.'],
                        ['Edit image', 'Opens Qwen Edit with this image as its source. Describe the changes you want.'],
                        ['Face reference', 'Uses this image to guide facial identity in a new generation and restores the saved character selections. Pose, outfit and body may change.'],
                        ['Animate', 'Uses the image as the starting frame for WAN image-to-video. Describe motion and set clip length.'],
                      ].map(([label, help]) => <div key={label}><dt className="font-semibold text-zinc-200">{label}</dt><dd>{help}</dd></div>)}
                    </dl>
                  </details>
              {!isVideoUrl(primaryOutput(lightbox)) && <section className="rounded-lg border border-cyan-500/30 bg-cyan-500/5 p-3 text-xs" data-testid="gallery-alignment-review">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-cyan-100">Image vs. selections</span>
                  <button type="button" onClick={() => reviewAlignment.mutate(lightbox.id)} disabled={reviewAlignment.isPending || lightbox.alignment_review_status === "reviewing"}
                    className="rounded-lg border border-cyan-500/40 px-2 py-1.5 text-cyan-100 disabled:opacity-40" data-testid="btn-gallery-review-image">
                    {reviewAlignment.isPending ? "Reviewing…" : lightbox.alignment_review ? "Review again" : "Review image"}
                  </button>
                </div>
                {lightbox.alignment_review_status === "reviewing" && !lightbox.alignment_review && <p className="mt-2 text-cyan-200">Local image review is running. Results will appear here when ready.</p>}
                {lightbox.alignment_review_status === "unavailable" && !lightbox.alignment_review && <p className="mt-2 text-amber-200">This review did not complete. Your image is saved; tap Review image to try again.</p>}
                {lightbox.alignment_review && <div className="mt-2 space-y-2 text-zinc-300">
                  <p>{lightbox.alignment_review.summary}</p>
                  {lightbox.alignment_review.matched?.length > 0 && <p className="text-emerald-200">Matched: {lightbox.alignment_review.matched.join(" · ")}</p>}
                  {lightbox.alignment_review.missing?.length > 0 && <div>
                    <div className="font-semibold text-amber-200">Missing or different</div>
                    <div className="mt-2 space-y-2">{lightbox.alignment_review.missing.map((item, index) =>
                      <label key={index} className="flex items-start gap-2 rounded border border-amber-500/20 p-2">
                        <input type="checkbox" checked={retrySelection === null || retrySelection.includes(index)}
                          onChange={() => {
                            const current = retrySelection ?? lightbox.alignment_review.missing.map((_, i) => i);
                            setRetrySelection(current.includes(index) ? current.filter((i) => i !== index) : [...current, index]);
                            setRetryPreview(null);
                          }} className="mt-0.5 accent-amber-400" />
                        <span><span className="capitalize">{item.category}:</span> {item.detail}</span>
                      </label>)}</div>
                  </div>}
                  {lightbox.alignment_review.uncertain?.length > 0 && <p className="text-zinc-400">Hard to tell: {lightbox.alignment_review.uncertain.join(" · ")}</p>}
                  {lightbox.alignment_review.reference_used && <p className="text-zinc-500">Compared with this character’s chosen default image.</p>}
                  {lightbox.alignment_review.missing?.length > 0 && <div className="space-y-2">
                    <button type="button" disabled={previewMissing.isPending || retrySelection?.length === 0}
                      onClick={() => previewMissing.mutate({ id: lightbox.id, indices: retrySelection ?? lightbox.alignment_review.missing.map((_, i) => i) })}
                      data-testid="btn-gallery-retry-missing"
                      className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 font-semibold text-amber-100 disabled:opacity-40">
                      {previewMissing.isPending ? "Preparing preview…" : "Preview correction"}
                    </button>
                    {retryPreview && <div className="space-y-2 rounded-lg border border-amber-500/30 bg-black/30 p-3">
                      <p className="font-semibold text-amber-100">Prompt for the new render</p>
                      <p className="max-h-36 overflow-y-auto whitespace-pre-wrap break-words text-zinc-300">{retryPreview.prompt_positive}</p>
                      <button type="button" disabled={retryMissing.isPending}
                        onClick={() => retryMissing.mutate({ id: lightbox.id, indices: retrySelection ?? lightbox.alignment_review.missing.map((_, i) => i) })}
                        className="rounded-lg border border-amber-500/50 bg-amber-500/20 px-3 py-2 font-semibold text-amber-100 disabled:opacity-40">
                        {retryMissing.isPending ? "Queuing…" : "Render with this correction"}
                      </button>
                    </div>}
                  </div>}
                </div>}
              </section>}

              {!isVideoUrl(primaryOutput(lightbox)) && <section className="rounded-lg border border-purple-500/30 bg-purple-500/5 p-3 text-xs space-y-2" data-testid="gallery-improve-render">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-semibold text-purple-100">Rewrite prompt for a new render</div>
                    <p className="text-zinc-400">Rewrite the saved text for a new generation. To edit this image, use the image tools above.</p>
                  </div>
                </div>
                <label htmlFor="improve-source-prompt" className="block font-semibold text-zinc-200">Original positive prompt · edit a copy</label>
                <textarea id="improve-source-prompt" rows={5} value={improveSource} onChange={(event) => { setImproveSource(event.target.value); setImprovePreview(null); }}
                  data-testid="improve-source-prompt" className="w-full rounded-lg border hairline bg-elevated p-2 font-mono text-xs text-zinc-100" />
                <label htmlFor="improve-instruction" className="block font-semibold text-zinc-200">Tell AI what to change</label>
                <textarea id="improve-instruction" rows={2} value={improveInstruction} onChange={(event) => setImproveInstruction(event.target.value)}
                  maxLength={1000} placeholder="e.g. Keep both people, switch to a full-body view, and simplify the background"
                  data-testid="improve-instruction" className="w-full rounded-lg border hairline bg-elevated p-2 text-xs text-zinc-100" />
                <button type="button" onClick={() => previewImprovement.mutate({ id: lightbox.id, source_prompt: improveSource, instruction: improveInstruction })}
                  disabled={previewImprovement.isPending || improveSource.trim().length < 30}
                  className="rounded-lg border border-purple-500/40 px-3 py-2 font-semibold text-purple-100 disabled:opacity-40">
                  {previewImprovement.isPending ? "Preparing…" : "Edit prompt with AI"}
                </button>
                {improvePreview && <div className="space-y-2 rounded-lg border border-purple-500/20 bg-black/20 p-2">
                  {improvePreview.note && <p className="text-purple-200">{improvePreview.note}</p>}
                  <label htmlFor="improve-render-prompt" className="block font-semibold text-zinc-200">Corrected prompt · edit before rendering</label>
                  <textarea id="improve-render-prompt" rows={7} value={improvePrompt} onChange={(event) => setImprovePrompt(event.target.value)}
                    className="w-full rounded-lg border hairline bg-elevated p-2 font-mono text-xs text-zinc-100" />
                  <label htmlFor="improve-negative-prompt" className="block font-semibold text-zinc-200">Negative prompt · optional</label>
                  <textarea id="improve-negative-prompt" rows={3} value={improveNegative} onChange={(event) => setImproveNegative(event.target.value)}
                    className="w-full rounded-lg border hairline bg-elevated p-2 font-mono text-xs text-zinc-100" />
                  <button type="button" disabled={queueImprovement.isPending || improvePrompt.trim().length < 30}
                    onClick={() => queueImprovement.mutate({ id: lightbox.id, prompt_positive: improvePrompt, prompt_negative: improveNegative })}
                    className="rounded-lg border border-purple-400/50 bg-purple-500/20 px-3 py-2 font-semibold text-purple-100 disabled:opacity-40">
                    {queueImprovement.isPending ? "Queuing…" : "Render with corrected prompt"}
                  </button>
                </div>}
              </section>}

              <div className="flex flex-col gap-2">
                <section className="rounded-lg border hairline bg-black/10 p-2.5" data-testid="gallery-recipe-snapshot">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="text-xs font-bold text-zinc-200">Recipe snapshot</div>
                    <button type="button" onClick={() => openRecipe.mutate(lightbox)} disabled={openRecipe.isPending}
                      className="text-[10px] font-semibold text-amber-300 hover:text-amber-200 disabled:opacity-40"
                      data-testid="btn-lightbox-open-recipe-quick">
                      Open exact recipe
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono">
                    <div className="rounded-md border hairline bg-elevated p-2">
                      <div className="text-[8px] uppercase tracking-wider text-zinc-500">Seed</div>
                      <div className="mt-0.5 truncate text-amber-200">{lightbox.seed_used ?? "—"}</div>
                    </div>
                    <div className="rounded-md border hairline bg-elevated p-2">
                      <div className="text-[8px] uppercase tracking-wider text-zinc-500">Size</div>
                      <div className="mt-0.5 text-zinc-200">{renderDimensions(lightbox)}</div>
                    </div>
                    <div className="rounded-md border hairline bg-elevated p-2">
                      <div className="text-[8px] uppercase tracking-wider text-zinc-500">Steps · CFG</div>
                      <div className="mt-0.5 text-zinc-200">{generationValue(lightbox, "steps") ?? "—"} · {generationValue(lightbox, "cfg") ?? "—"}</div>
                    </div>
                    <div className="rounded-md border hairline bg-elevated p-2">
                      <div className="text-[8px] uppercase tracking-wider text-zinc-500">Sampler</div>
                      <div className="mt-0.5 truncate text-zinc-200">{generationValue(lightbox, "sampler_name") || "—"}</div>
                    </div>
                  </div>
                </section>

                {versions.filter((version) => primaryOutput(version)).length > 1 && (
                  <section className="rounded-lg border hairline bg-black/10 p-2.5" data-testid="gallery-version-family">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div>
                        <div className="text-xs font-bold text-zinc-200">Version family</div>
                        <div className="text-[9px] text-zinc-500">{versions.filter((version) => primaryOutput(version)).length} related renders</div>
                      </div>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1 scroll-fade">
                      {versions.filter((version) => primaryOutput(version)).map((version) => (
                        <button key={version.id} type="button" onClick={() => setLightbox(version)}
                          className={`w-20 shrink-0 overflow-hidden rounded-lg border text-left ${version.id === lightbox.id ? "border-amber-400 bg-amber-500/10" : "hairline bg-elevated"}`}
                          data-testid={`gallery-version-${version.id}`}>
                          <div className="aspect-square overflow-hidden bg-black/30">
                            {isVideoUrl(primaryOutput(version))
                              ? <video src={primaryOutput(version)} muted playsInline preload="none" className="h-full w-full object-cover" />
                              : <img src={primaryOutput(version)} alt="version" className="h-full w-full object-cover" />}
                          </div>
                          <div className="p-1.5">
                            <div className="truncate text-[9px] font-bold text-zinc-200">{renderOperationLabel(version)}</div>
                            <div className="truncate text-[8px] font-mono text-zinc-500">seed {version.seed_used ?? "—"}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-2.5">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold text-amber-100">Reuse this render</div>
                      <div className="mt-0.5 text-[10px] text-zinc-500">
                        Exact uses the saved prompt + seed. New seed regenerates from text. Current Compiler rebuilds the prompt from today's app logic.
                      </div>
                    </div>
                    {(recreate.isPending || rebuildCurrentCompiler.isPending) && <Loader2 className="h-4 w-4 animate-spin text-amber-300" />}
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <button
                      type="button"
                      onClick={() => recreate.mutate({ id: lightbox.id, variation: false })}
                      disabled={recreate.isPending || rebuildCurrentCompiler.isPending}
                      data-testid="btn-lightbox-recreate-primary"
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-100 hover:bg-amber-500/15 disabled:opacity-40"
                    >
                      <RotateCcw className="h-4 w-4" /> Recreate Exact
                    </button>
                    <button
                      type="button"
                      onClick={() => recreate.mutate({ id: lightbox.id, variation: true })}
                      disabled={recreate.isPending || rebuildCurrentCompiler.isPending}
                      data-testid="btn-lightbox-variation-primary"
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-violet-500/40 bg-violet-500/10 px-3 py-2 text-xs font-semibold text-violet-100 hover:bg-violet-500/15 disabled:opacity-40"
                    >
                      <Shuffle className="h-4 w-4" /> New seed
                    </button>
                    <button
                      type="button"
                      onClick={() => rebuildCurrentCompiler.mutate(lightbox)}
                      disabled={recreate.isPending || rebuildCurrentCompiler.isPending}
                      data-testid="btn-lightbox-rebuild-current"
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-100 hover:bg-cyan-500/15 disabled:opacity-40"
                      title="Open the saved DNA/settings in Builder, clear saved prompt overrides, and regenerate the prompt with the current compiler"
                    >
                      <BookOpen className="h-4 w-4" /> Rebuild prompt
                    </button>
                  </div>
                </div>

                {!isVideoUrl(primaryOutput(lightbox)) && (
                  <div className="space-y-2">
                    {lightbox.parent_render_id && renders.some((r) => r.id === lightbox.parent_render_id && primaryOutput(r)) &&
                      renders.some((r) => r.id === lightbox.id) && <button type="button"
                        onClick={() => { setSelected([lightbox.parent_render_id, lightbox.id]); setCompareOpen(true); }}
                        className="w-full rounded-lg border hairline px-3 py-2 text-xs font-semibold text-cyan-100"
                        data-testid="btn-compare-with-source">Compare with source</button>}
                    <PostGenerationActions
                      compact
                      busy={reuseAsReference.isPending || openBodyCreation.isPending}
                      onBody={() => openBodyCreation.mutate(lightbox)}
                      onEdit={() => reuseAsReference.mutate({ render: lightbox, targetKind: "edit" })}
                      onPose={() => reuseAsReference.mutate({ render: lightbox, targetKind: "edit", referenceMode: "new_pose" })}
                      onAnimate={() => reuseAsReference.mutate({ render: lightbox, targetKind: "video" })}
                      onReference={() => reuseAsReference.mutate({ render: lightbox, targetKind: "face", referenceMode: "keep_character" })}
                      onTools={() => nav(`/tools?render=${encodeURIComponent(lightbox.id)}`)}
                    />

                  </div>
                )}


                <details className="rounded-lg border hairline bg-black/15 p-3" data-testid="gallery-render-details">
                  <summary className="cursor-pointer text-xs font-semibold text-zinc-300">Prompt & advanced actions</summary>
                  <div className="space-y-2 pt-3">
                    {lightbox.prompt_positive && <div className="text-[11px] font-mono text-zinc-300 bg-elevated border hairline rounded-md p-2 max-h-32 overflow-y-auto whitespace-pre-wrap">{lightbox.prompt_positive}</div>}
                    {originalOutput(lightbox) && originalOutput(lightbox) !== primaryOutput(lightbox) && (
                      <button onClick={() => downloadImage(originalOutput(lightbox), `${lightbox.workflow_name || "render"}-${lightbox.id.slice(0, 8)}-original.png`)} data-testid="btn-lightbox-download-original" className="w-full rounded-lg border hairline px-3 py-2 text-sm">
                        <Download className="inline h-4 w-4 mr-2" />Download original
                      </button>
                    )}

                    <button type="button" onClick={() => confirmRemoveOne(lightbox)} disabled={removeOne.isPending} data-testid="btn-lightbox-delete" className="w-full rounded-lg border border-red-500/40 px-3 py-2 text-sm text-red-200"><Trash2 className="inline h-4 w-4 mr-2" />Delete permanently</button>
                    {lightbox.character_id && <Link to={`/character/${lightbox.character_id}`} data-testid="btn-lightbox-open-character" className="w-full inline-flex items-center justify-center gap-2 rounded-lg border hairline px-3 py-2 text-sm"><ExternalLink className="h-4 w-4" />Open character</Link>}
                  </div>
                </details>
              </div>
                </div>
              </details>
            </aside>
          </div>
        </div>
      )}

      {compareOpen && compared.length === 2 && (
        <div className="fixed inset-0 z-[60] bg-black/95 p-4 sm:p-8" onClick={() => setCompareOpen(false)} data-testid="gallery-compare-modal">
          <button type="button" onClick={() => setCompareOpen(false)} className="fixed right-4 top-4 z-10 h-10 w-10 rounded-full bg-black/70 text-white grid place-items-center"><X className="h-5 w-5" /></button>
          <div className="mx-auto grid h-full max-w-7xl grid-cols-1 md:grid-cols-2 gap-3" onClick={(event) => event.stopPropagation()}>
            {compared.map((render) => (
              <div key={render.id} className="min-h-0 flex flex-col gap-2">
                <div className="min-h-0 flex-1 grid place-items-center rounded-xl border hairline bg-black/40 overflow-hidden">
                  {isVideoUrl(primaryOutput(render))
                    ? <video src={primaryOutput(render)} controls className="max-h-full max-w-full object-contain" />
                    : <img src={primaryOutput(render)} alt="comparison" className="max-h-full max-w-full object-contain" />}
                </div>
                <div className="rounded-lg border hairline bg-elevated p-2.5 text-[10px] font-mono">
                  <div className="truncate text-xs font-bold text-zinc-200">{render.workflow_name || render.workflow_type}</div>
                  <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-1 text-zinc-500">
                    <span>seed <b className="text-amber-200">{render.seed_used ?? "—"}</b></span>
                    <span>size <b className="text-zinc-200">{renderDimensions(render)}</b></span>
                    <span>steps <b className="text-zinc-200">{generationValue(render, "steps") ?? "—"}</b></span>
                    <span>cfg <b className="text-zinc-200">{generationValue(render, "cfg") ?? "—"}</b></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
