import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Camera, Plus } from "lucide-react";
import { endpoints } from "@/lib/api";

const STATUS_COLOR = {
  done: "text-emerald-300",
  running: "text-amber-300",
  queued: "text-amber-300",
  failed: "text-red-400",
};

export default function Shoots() {
  const { data: shoots = [], isLoading } = useQuery({
    queryKey: ["shoots"],
    queryFn: endpoints.listShoots,
    refetchInterval: 5000,
  });

  return (
    <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-6 sm:py-10 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6">
        <div>
          <div className="section-label flex items-center gap-2"><Camera className="h-3 w-3" /> Shoots</div>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl mt-1">Photo shoots</h1>
          <p className="text-sm text-zinc-400 mt-1">Batch renders — one character, many poses, one shoot.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="pane h-40 animate-pulse" />)}
        </div>
      ) : shoots.length === 0 ? (
        <div className="pane p-10 text-center">
          <div className="section-label mb-2">No shoots yet</div>
          <h3 className="font-display text-xl">Pick a character to start a shoot</h3>
          <p className="text-sm text-zinc-400 mt-1">Open a character in the Library and hit the Shoot button to batch 4–20 frames with pose and outfit variations.</p>
          <Link to="/" data-testid="btn-shoots-empty-lib" className="inline-flex mt-4 items-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold px-4 py-2">
            <Plus className="h-4 w-4" /> Open Library
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {shoots.map((s, i) => {
            const done = (s.frames || []).filter((f) => f.status === "done").length;
            return (
              <Link
                to={`/shoot/${s.id}`}
                key={s.id}
                data-testid={`shoot-card-${i}`}
                className="pane p-4 space-y-3 hover:border-zinc-700 transition-colors"
              >
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
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
