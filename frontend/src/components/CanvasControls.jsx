import { useEffect, useState } from "react";

function dimension(value) {
  if (String(value).trim() === "" || !Number.isFinite(Number(value))) return null;
  return Math.floor(Math.max(256, Math.min(2048, Number(value))) / 8) * 8;
}

function formatSize(settings, format) {
  const long = dimension(Math.max(settings.width, settings.height)) || 1024;
  const short = Math.max(256, Math.floor(long * 2 / 3 / 8) * 8);
  return { width: format === "portrait" ? short : long, height: format === "landscape" ? short : long };
}

export default function CanvasControls({ settings, onSettings, busy = false }) {
  const [width, setWidth] = useState(String(settings.width));
  const [height, setHeight] = useState(String(settings.height));
  const [message, setMessage] = useState("");
  useEffect(() => {
    setWidth(String(settings.width)); setHeight(String(settings.height)); setMessage("");
  }, [settings.width, settings.height]);
  const orientation = settings.width === settings.height ? "square" : settings.width < settings.height ? "portrait" : "landscape";
  const apply = () => {
    const nextWidth = dimension(width), nextHeight = dimension(height);
    if (nextWidth == null || nextHeight == null) { setMessage("Enter a number for both dimensions."); return; }
    onSettings({ ...settings, width: nextWidth, height: nextHeight });
    setWidth(String(nextWidth)); setHeight(String(nextHeight));
    setMessage("");
  };
  return <fieldset disabled={busy} className="space-y-3" data-testid="canvas-controls">
    <legend className="text-xs font-semibold text-zinc-300">Canvas · {settings.width} × {settings.height}</legend>
    <div className="grid grid-cols-3 gap-2" aria-label="Canvas format">
      {[{ id: "portrait", label: "Portrait" }, { id: "square", label: "Square" }, { id: "landscape", label: "Landscape" }].map((format) => {
        const size = formatSize(settings, format.id), selected = orientation === format.id;
        return <button key={format.id} type="button" disabled={busy} aria-label={`Canvas ${format.id}`} aria-pressed={selected}
          onClick={() => { onSettings({ ...settings, ...size }); setWidth(String(size.width)); setHeight(String(size.height)); setMessage(""); }}
          className={`min-w-0 rounded-xl border px-2 py-3 text-center disabled:opacity-40 ${selected ? "border-cyan-400/70 bg-cyan-400/10 text-cyan-100" : "hairline text-zinc-400 hover:border-white/30"}`}>
          <span className="flex h-12 items-center justify-center" aria-hidden="true"><span className="block max-h-10 max-w-14 rounded border-2 border-current bg-current/10" style={{ aspectRatio: `${size.width} / ${size.height}`, height: size.width > size.height ? 28 : 40 }} /></span>
          <span className="mt-1 block text-xs font-semibold">{format.label}</span>
          <span className="mt-1 block text-[10px] text-zinc-500">{size.width} × {size.height}</span>
        </button>;
      })}
    </div>
    <details className="rounded-xl border hairline bg-black/15 p-3">
      <summary className="cursor-pointer text-xs font-semibold text-zinc-300">Custom dimensions</summary>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <label className="text-xs text-zinc-400">Width<input type="number" aria-label="Canvas width" min="256" max="2048" step="8" value={width} disabled={busy} onChange={(event) => setWidth(event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border hairline bg-elevated px-3 text-white" /></label>
        <label className="text-xs text-zinc-400">Height<input type="number" aria-label="Canvas height" min="256" max="2048" step="8" value={height} disabled={busy} onChange={(event) => setHeight(event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border hairline bg-elevated px-3 text-white" /></label>
      </div>
      <p className="mt-2 text-[11px] text-zinc-500">256–2048 pixels per side, aligned down to multiples of 8. Larger canvases use more memory.</p>
      <button type="button" onClick={apply} disabled={busy} className="mt-2 min-h-11 rounded-lg border border-cyan-400/40 px-3 text-xs font-semibold text-cyan-200 disabled:opacity-40">Apply dimensions</button>
      {message && <p role="status" className="mt-2 text-xs text-cyan-200">{message}</p>}
    </details>
  </fieldset>;
}
