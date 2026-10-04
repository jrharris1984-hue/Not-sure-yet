import { useEffect, useState } from "react";
import { endpoints } from "@/lib/api";
import { characterDesignRequest } from "@/lib/characterDesign";

export default function ClothedDesignRender({ subject, characterId, onQueued, disabled = false }) {
  const request = characterDesignRequest(subject, characterId);
  const requestJson = JSON.stringify(request);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let current = true;
    setPreview(null);
    setError("");
    const timer = window.setTimeout(() => {
      endpoints.previewCharacterDesign(JSON.parse(requestJson)).then(result => {
        if (current) setPreview(result);
      }).catch(() => { if (current) setError("Design preview unavailable. Check the backend connection."); });
    }, 250);
    return () => { current = false; window.clearTimeout(timer); };
  }, [requestJson]);
  const render = async () => {
    if (busy || disabled || !preview) return;
    setBusy(true);
    setError("");
    try {
      const queued = await endpoints.renderCharacterDesign(request);
      onQueued(queued);
    } catch (failure) {
      setError(failure?.response?.data?.detail || "Could not queue the clothed character design.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="space-y-3 pt-4 border-t hairline" data-testid="clothed-design-render">
      <h3 className="font-semibold text-sm">Clothed character study · SDXL / Juggernaut</h3>
      <p className="text-xs text-zinc-400">Render this subject standing in an opaque sweatshirt, full-length jeans, and shoes. Size and shape guide the garment silhouette; texture guides the fabric finish. Age and gender come from this subject’s Identity selections.</p>
      {preview?.checkpoint && <p className="text-xs text-zinc-500 break-all">Required checkpoint: {preview.checkpoint}</p>}
      <details className="text-xs text-zinc-400">
        <summary className="cursor-pointer">Preview design prompt</summary>
        <p className="mt-2 leading-relaxed whitespace-pre-wrap" data-testid="clothed-design-preview">{preview?.positive || "Loading preview…"}</p>
      </details>
      {error && <p role="alert" className="text-xs text-red-300">{error}</p>}
      <button type="button" onClick={render} disabled={busy || disabled || !preview}
        className="w-full sm:w-auto rounded-lg px-4 py-2.5 bg-lime-400 text-black font-semibold text-sm disabled:opacity-50"
        data-testid="btn-render-clothed-design">
        {busy ? "Queueing design…" : "Render clothed character design"}
      </button>
    </div>
  );
}
