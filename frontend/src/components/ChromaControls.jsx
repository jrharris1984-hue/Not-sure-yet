import { Aperture, Dice5, Sparkles } from "lucide-react";

const FORMATS = [
  { label: "Portrait", width: 768, height: 1152 },
  { label: "Square", width: 1024, height: 1024 },
  { label: "Landscape", width: 1152, height: 768 },
];

export default function ChromaControls({ value, onChange }) {
  const set = (patch) => onChange({ ...value, ...patch });
  const format = FORMATS.find((item) => item.width === value.width && item.height === value.height);

  return (
    <section data-testid="goldenchroma-controls" className="pane overflow-hidden border-amber-500/30">
      <div className="border-b border-amber-500/20 bg-gradient-to-r from-amber-500/10 to-transparent px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-300" />
          <div>
            <div className="section-label !text-amber-300">GoldenChroma Studio</div>
            <p className="mt-0.5 text-xs text-zinc-400">Short T5-safe prompt · controls apply directly to the Chroma workflow</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <label className="mb-2 block text-[10px] font-mono uppercase tracking-widest text-zinc-500">Canvas</label>
          <div className="grid grid-cols-3 gap-2">
            {FORMATS.map((item) => (
              <button key={item.label} type="button"
                onClick={() => set({ width: item.width, height: item.height })}
                className={`rounded-lg border px-2 py-2 text-xs transition-colors ${format?.label === item.label ? "border-amber-400/60 bg-amber-500/10 text-amber-200" : "hairline text-zinc-400 hover:bg-white/5"}`}>
                <Aperture className="mx-auto mb-1 h-4 w-4" />
                {item.label}
                <span className="mt-0.5 block text-[9px] font-mono text-zinc-600">{item.width}×{item.height}</span>
              </button>
            ))}
          </div>
        </div>

        <label className="block">
          <span className="mb-2 flex justify-between text-[10px] font-mono uppercase tracking-widest text-zinc-500">
            Steps <b className="text-amber-300">{value.steps}</b>
          </span>
          <input type="range" min="12" max="40" step="1" value={value.steps}
            onChange={(e) => set({ steps: Number(e.target.value) })} className="w-full accent-amber-400" />
          <span className="mt-1 block text-[10px] text-zinc-600">26 is the balanced default</span>
        </label>

        <label className="block">
          <span className="mb-2 flex justify-between text-[10px] font-mono uppercase tracking-widest text-zinc-500">
            CFG <b className="text-amber-300">{value.cfg.toFixed(1)}</b>
          </span>
          <input type="range" min="1" max="7" step="0.1" value={value.cfg}
            onChange={(e) => set({ cfg: Number(e.target.value) })} className="w-full accent-amber-400" />
          <span className="mt-1 block text-[10px] text-zinc-600">3.8 keeps Chroma natural</span>
        </label>

        <label className="block">
          <span className="mb-2 block text-[10px] font-mono uppercase tracking-widest text-zinc-500">Sampler</span>
          <select value={value.sampler} onChange={(e) => set({ sampler: e.target.value })}
            className="w-full rounded-lg border hairline bg-elevated px-3 py-2 text-sm text-zinc-100">
            <option value="euler">Euler</option>
            <option value="dpmpp_2m">DPM++ 2M</option>
            <option value="dpmpp_2m_sde">DPM++ 2M SDE</option>
          </select>
        </label>

        <label className="block sm:col-span-2">
          <span className="mb-2 block text-[10px] font-mono uppercase tracking-widest text-zinc-500">Seed</span>
          <div className="flex gap-2">
            <input type="number" value={value.seed} placeholder="Random every render"
              onChange={(e) => set({ seed: e.target.value })}
              className="min-w-0 flex-1 rounded-lg border hairline bg-elevated px-3 py-2 text-sm text-zinc-100" />
            <button type="button" title="Create random seed"
              onClick={() => set({ seed: String(Math.floor(Math.random() * 2147483647)) })}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border hairline text-zinc-300 hover:bg-white/5">
              <Dice5 className="h-4 w-4" />
            </button>
          </div>
        </label>
      </div>
    </section>
  );
}
