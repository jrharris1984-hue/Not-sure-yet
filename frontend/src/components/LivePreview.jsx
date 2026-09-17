import { useComfyWs } from "@/hooks/useComfyWs";
import { Loader2, WifiOff, Zap } from "lucide-react";

/**
 * Inline live-preview overlay driven by ComfyUI's /ws stream.
 *
 * Props:
 *   clientId  - the render.id (passed as ComfyUI client_id at dispatch time)
 *   enabled   - only open the socket while the render is in flight
 *   variant   - "card" (default, fills the container) | "compact" (tiny bar)
 *   fallback  - a React node shown when no preview yet (usually a spinner/status)
 */
export default function LivePreview({ clientId, enabled = true, variant = "card", fallback = null, testId = "live-preview" }) {
  const { connected, progress, step, max, previewUrl, status, error } = useComfyWs(clientId, { enabled });

  if (variant === "compact") {
    return (
      <div data-testid={testId} className="flex items-center gap-2 text-[10px] font-mono">
        {error ? (
          <span className="text-zinc-500 flex items-center gap-1"><WifiOff className="h-3 w-3" /> live off</span>
        ) : (
          <>
            <span className={`h-1.5 w-1.5 rounded-full ${connected ? "bg-emerald-400" : "bg-zinc-600"}`} />
            {max ? (
              <span className="text-amber-300">{step}/{max}</span>
            ) : (
              <span className="text-zinc-500">connecting</span>
            )}
          </>
        )}
      </div>
    );
  }

  // Card variant — designed to fill an aspect-square (shoot frame) or the render panel
  return (
    <div data-testid={testId} className="relative w-full h-full">
      {previewUrl ? (
        <img
          src={previewUrl}
          alt="live preview"
          data-testid={`${testId}-image`}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full grid place-items-center">
          {fallback || <Loader2 className="h-5 w-5 animate-spin text-amber-300" />}
        </div>
      )}
      {/* progress overlay */}
      {(max > 0 || status === "running") && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1.5 pt-4">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-100">
            <Zap className="h-3 w-3 text-amber-300" />
            {max > 0 ? (
              <>
                <span>step {step}/{max}</span>
                <span className="text-amber-300 ml-auto">{Math.round(progress * 100)}%</span>
              </>
            ) : (
              <span>connecting…</span>
            )}
          </div>
          <div className="mt-1 h-0.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400 transition-all"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
        </div>
      )}
      {error && (
        <div className="absolute top-1 right-1 text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/70 text-zinc-400 flex items-center gap-1">
          <WifiOff className="h-3 w-3" /> offline
        </div>
      )}
    </div>
  );
}
