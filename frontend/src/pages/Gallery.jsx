import { useQuery } from "@tanstack/react-query";
import { endpoints } from "@/lib/api";
import { Link } from "react-router-dom";

export default function Gallery() {
  const { data: renders = [], isLoading } = useQuery({
    queryKey: ["renders"],
    queryFn: endpoints.listRenders,
    refetchInterval: 5000,
  });
  return (
    <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-6 sm:py-10 space-y-6">
      <div>
        <div className="section-label">Gallery</div>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl mt-1">Renders</h1>
        <p className="text-sm text-zinc-400 mt-1">Every render is stored with its exact DNA snapshot. Tap to re-render.</p>
      </div>
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="pane h-56 animate-pulse" />)}
        </div>
      ) : renders.length === 0 ? (
        <div className="pane p-10 text-center text-zinc-400">
          <div className="section-label mb-2">Empty gallery</div>
          <p>No renders yet. Head to a character and dispatch one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {renders.map((r, i) => (
            <div key={r.id} data-testid={`gallery-card-${i}`} className="pane p-3 space-y-2">
              {r.output_files?.[0] ? (
                <img src={r.output_files[0]} alt="render" className="w-full rounded-md border hairline" />
              ) : (
                <div className="aspect-square rounded-md border hairline bg-elevated grid place-items-center text-xs text-zinc-500 font-mono">
                  {r.status}
                </div>
              )}
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400 font-mono uppercase tracking-widest">{r.workflow_type}</span>
                <span className={r.status === "done" ? "text-emerald-300" : r.status === "failed" ? "text-red-400" : "text-amber-300"}>{r.status}</span>
              </div>
              <div className="text-xs text-zinc-400 font-mono line-clamp-2">{r.prompt_positive}</div>
              {r.character_id && (
                <Link
                  to={`/character/${r.character_id}`}
                  data-testid={`btn-rerender-${i}`}
                  className="block text-center text-xs rounded-md bg-amber-500/10 border border-amber-500/40 text-amber-200 py-1.5 hover:bg-amber-500/20"
                >
                  Open character
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
