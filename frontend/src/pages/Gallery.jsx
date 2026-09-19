import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { endpoints } from "@/lib/api";
import { Link } from "react-router-dom";
import { X, Download, Copy, ExternalLink } from "lucide-react";
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

const primaryOutput = (render) => render.output_variants?.enhanced?.[0] || render.output_files?.[0];
const originalOutput = (render) => render.output_variants?.original?.[0];

export default function Gallery() {
  const { data: renders = [], isLoading } = useQuery({
    queryKey: ["renders"],
    queryFn: endpoints.listRenders,
    refetchInterval: 5000,
  });
  const [lightbox, setLightbox] = useState(null); // render object

  // Only renders with output to show as thumbnails; keep unfinished list on the side
  const withOutput = renders.filter((r) => primaryOutput(r));
  const inFlight = renders.filter((r) => !primaryOutput(r) && r.status !== "done");

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
              {withOutput.map((r, i) => (
                <button
                  key={r.id}
                  onClick={() => setLightbox(r)}
                  data-testid={`gallery-thumb-${i}`}
                  className="relative aspect-square rounded-lg overflow-hidden border hairline bg-elevated group focus:outline-none focus:ring-2 focus:ring-amber-400/60"
                >
                  <img
                    src={primaryOutput(r)}
                    alt={r.prompt_positive?.slice(0, 40) || "render"}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute inset-x-0 bottom-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-300 truncate">
                      {r.workflow_name || r.workflow_type}
                    </div>
                  </div>
                  <span className="absolute top-1 right-1 text-[9px] font-mono px-1.5 py-0.5 rounded backdrop-blur-sm bg-black/60 text-emerald-300">
                    {r.output_variants?.enhanced?.length ? "enhanced" : "done"}
                  </span>
                </button>
              ))}
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
          onClick={() => setLightbox(null)}
          data-testid="gallery-lightbox"
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md p-4 sm:p-6 flex items-center justify-center"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-6xl max-h-full flex flex-col md:flex-row gap-4"
          >
            {/* Image column */}
            <div className="flex-1 min-h-0 flex items-center justify-center">
              <img
                src={primaryOutput(lightbox)}
                alt={lightbox.prompt_positive?.slice(0, 60) || "render"}
                data-testid="gallery-lightbox-image"
                className="max-h-[85vh] max-w-full object-contain rounded-lg shadow-2xl"
              />
            </div>

            {/* Meta column */}
            <aside className="w-full md:w-80 shrink-0 pane p-4 space-y-3 max-h-[85vh] overflow-y-auto scroll-fade">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="section-label">Render</div>
                  <div className="font-display font-bold text-sm mt-0.5">{lightbox.workflow_name || lightbox.workflow_type}</div>
                </div>
                <button
                  onClick={() => setLightbox(null)}
                  data-testid="btn-lightbox-close"
                  className="h-8 w-8 grid place-items-center rounded-md text-zinc-400 hover:bg-white/5"
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
