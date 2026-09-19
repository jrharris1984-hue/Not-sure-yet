import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "react-router-dom";
import { X, ChevronUp, ChevronDown, Zap, Square } from "lucide-react";
import { endpoints } from "@/lib/api";
import LivePreview from "@/components/LivePreview";
import { toast } from "sonner";

// Floating live-preview bar. Auto-appears whenever there's at least one render in flight.
// Users can collapse it to a slim pill or dismiss it (dismissal is per-session).
export default function NowRenderingStrip() {
  const location = useLocation();
  const [expanded, setExpanded] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [dismissedIds, setDismissedIds] = useState(new Set());

  // Hide entirely on gallery / shoot detail pages where the render preview is already inline
  const hideOnPath = /^\/shoot\/[^/]+$/.test(location.pathname);

  const { data: renders = [] } = useQuery({
    queryKey: ["render-queue"],
    queryFn: endpoints.listQueue,
    refetchInterval: 3000,
    enabled: !hideOnPath,
  });

  const active = useMemo(
    () => renders.filter((r) =>
      (["queued", "dispatching", "running"].includes(r.status)) && !dismissedIds.has(r.id)
    ),
    [renders, dismissedIds]
  );

  // Reset dismissal when a new render starts
  useEffect(() => {
    if (active.length > 0) setDismissed(false);
  }, [active.length]);

  if (hideOnPath || dismissed || active.length === 0) return null;

  const cancelOne = async (id) => {
    try {
      await endpoints.cancelRender(id);
      toast.success("Render cancelled");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Cancel failed");
    }
  };

  return (
    <div
      data-testid="now-rendering-strip"
      className="fixed z-40 left-2 right-2 sm:left-4 sm:right-4 md:left-auto md:right-4 md:w-[420px] bottom-20 md:bottom-4 pointer-events-none"
    >
      <div className="pane glass pointer-events-auto shadow-2xl border-amber-500/30 overflow-hidden">
        <header className="flex items-center gap-2 px-3 py-2 border-b hairline">
          <div className="relative">
            <Zap className="h-3.5 w-3.5 text-amber-300" />
            <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
          </div>
          <div className="section-label !text-amber-300">Now rendering · {active.length}</div>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            data-testid="btn-now-rendering-toggle"
            className="ml-auto h-6 w-6 grid place-items-center rounded-md text-zinc-400 hover:bg-white/5"
            title={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            data-testid="btn-now-rendering-dismiss"
            className="h-6 w-6 grid place-items-center rounded-md text-zinc-400 hover:bg-white/5"
            title="Dismiss (until next render starts)"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {expanded && (
          <div className={`p-2 grid gap-2 ${active.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
            {active.slice(0, 4).map((r) => (
              <div
                key={r.id}
                data-testid={`now-rendering-tile-${r.id}`}
                className="relative rounded-md overflow-hidden border hairline bg-elevated"
              >
                <div className="relative aspect-video">
                  <LivePreview
                    clientId={r.render_id || r.id}
                    enabled
                    variant="card"
                    testId={`now-rendering-preview-${r.id}`}
                    onCancel={() => cancelOne(r.id)}
                  />
                </div>
                <div className="flex items-center gap-2 px-2 py-1.5 text-[10px] font-mono">
                  <span className="text-zinc-300 uppercase tracking-widest truncate flex-1">
                    {r.status === "queued" && r.queue_position ? `#${r.queue_position} · ` : ""}{r.workflow_name || r.workflow_type}
                  </span>
                  {r.character_id && (
                    <Link
                      to={`/character/${r.character_id}`}
                      data-testid={`btn-now-rendering-open-${r.id}`}
                      className="text-amber-300 hover:text-amber-200 uppercase tracking-widest"
                    >
                      open →
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => { setDismissedIds((s) => new Set([...s, r.id])); }}
                    data-testid={`btn-now-rendering-hide-${r.id}`}
                    className="h-5 w-5 grid place-items-center rounded text-zinc-500 hover:text-zinc-200"
                    title="Hide from strip"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
            {active.length > 4 && (
              <div className="col-span-full text-center text-[10px] font-mono text-zinc-500 py-1">
                +{active.length - 4} more in queue
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
