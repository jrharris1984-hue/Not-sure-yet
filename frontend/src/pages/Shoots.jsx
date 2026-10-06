import StudioLoading from "@/components/StudioLoading";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Camera, Plus } from "lucide-react";
import { endpoints } from "@/lib/api";
import { API_BASE } from "@/lib/api";

function coverUrl(url) {
  if (!url) return "";
  try {
    const parsed = new URL(url, window.location.origin);
    if (parsed.pathname.endsWith("/view") && parsed.searchParams.has("filename"))
      return `${API_BASE}/comfyui/media?${parsed.searchParams.toString()}`;
  } catch { /* Use the supplied URL. */ }
  return url;
}

const STATUS_COLOR = {
  done: "text-emerald-300",
  running: "text-amber-300",
  queued: "text-amber-300",
  failed: "text-red-400",
};

export default function Shoots() {
  const [showEmpty, setShowEmpty] = useState(false);
  const { data: shoots = [], isLoading } = useQuery({
    queryKey: ["shoots"],
    queryFn: endpoints.listShoots,
    refetchInterval: 5000,
  });
  const visibleShoots = showEmpty ? shoots : shoots.filter((shoot) => (shoot.rendered_count ?? 0) > 0 || !["done", "failed"].includes(shoot.status));
  const emptyCount = shoots.length - shoots.filter((shoot) => (shoot.rendered_count ?? 0) > 0 || !["done", "failed"].includes(shoot.status)).length;

  return (
    <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-6 sm:py-10 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6">
        <div>
          <div className="section-label flex items-center gap-2"><Camera className="h-3 w-3" /> Shoots</div>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl mt-1">Photo shoots</h1>
          <p className="text-sm text-zinc-400 mt-1">Batch renders — one character, many poses, one shoot.</p>
        </div>
      </div>
      {emptyCount > 0 && (
        <button type="button" onClick={() => setShowEmpty((value) => !value)}
          className="rounded-xl border hairline bg-elevated px-4 py-2 text-xs text-zinc-300 hover:border-cyan-400/50">
          {showEmpty ? "Hide" : "Show"} {emptyCount} shoot{emptyCount === 1 ? "" : "s"} with no images
        </button>
      )}

      {isLoading ? (
        <StudioLoading label="Loading photo shoots…" />
      ) : visibleShoots.length === 0 ? (
        <div className="pane p-10 text-center">
          <div className="section-label mb-2">No shoots yet</div>
          <h3 className="font-display text-xl">Pick a character to start a shoot</h3>
          <p className="text-sm text-zinc-400 mt-1">Open a character in the Library and hit the Shoot button to batch 4–40 frames with pose and outfit variations.</p>
          <Link to="/" data-testid="btn-shoots-empty-lib" className="inline-flex mt-4 items-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold px-4 py-2">
            <Plus className="h-4 w-4" /> Open Library
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleShoots.map((s, i) => {
            const done = s.rendered_count ?? (s.frames || []).filter((f) => f.status === "done").length;
            return (
              <Link
                to={`/shoot/${s.id}`}
                key={s.id}
                data-testid={`shoot-card-${i}`}
                className="pane overflow-hidden hover:border-zinc-700 transition-colors"
                aria-label={`Open photo shoot gallery: ${s.name}`}
              >
                <div className="aspect-video bg-elevated">
                  {s.cover_image ? <img src={coverUrl(s.cover_image)} alt={`${s.name} cover`} className="h-full w-full object-cover" />
                    : <div className="flex h-full items-center justify-center text-zinc-500"><Camera className="h-10 w-10" /></div>}
                </div>
                <div className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-display font-bold text-base truncate">{s.name}</div>
                    <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mt-0.5">
                      {s.count} frames · {s.seed_mode}
                    </div>
                  </div>
                  <span className={`text-xs font-mono ${STATUS_COLOR[s.status] || "text-zinc-400"}`}>
                    {s.status}
                  </span>
                </div>
                <div className="h-1 rounded-full bg-elevated overflow-hidden">
                  <div className="h-full bg-amber-400" style={{ width: `${Math.round((s.progress || 0) * 100)}%` }} />
                </div>
                <div className="text-[11px] font-mono text-zinc-500">{done}/{s.count} rendered</div>
                <div className="text-xs font-semibold text-amber-200">Open shoot gallery →</div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
