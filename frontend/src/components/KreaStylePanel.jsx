import { AlertTriangle, CheckCircle2, Sparkles } from "lucide-react";

export default function KreaStylePanel({
  style = "none",
  onStyle,
  strength = 0.8,
  onStrength,
  status,
}) {
  const baseReady = !!status?.ready;
  const privateReady = !!status?.private_magazine_ready;
  const baseMissing = status?.missing || [];

  return (
    <section className="pane overflow-hidden border-violet-500/30" data-testid="krea2-style-panel">
      <div className="border-b border-violet-500/20 bg-gradient-to-r from-violet-500/10 to-transparent px-4 py-3">
        <div className="flex items-start gap-2">
          <Sparkles className="mt-0.5 h-4 w-4 text-violet-300" />
          <div>
            <div className="section-label !text-violet-300">Krea 2 Studio</div>
            <p className="mt-0.5 text-xs text-zinc-400">
              Turbo uses the 8-step Krea recipe. Add one style LoRA at a time.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-4">
        {status ? (
          <div className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${
            baseReady ? "border-emerald-500/25 bg-emerald-500/5 text-emerald-200" : "border-amber-500/30 bg-amber-500/5 text-amber-200"
          }`}>
            {baseReady
              ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />}
            <div>
              <div className="font-semibold">{baseReady ? "Krea 2 Turbo ready" : "Krea 2 setup needs attention"}</div>
              {!baseReady && (
                <div className="mt-0.5 text-[10px] text-zinc-400">{baseMissing.join(", ") || "Local ComfyUI check"}</div>
              )}
              {baseReady && status.model && (
                <div className="mt-0.5 text-[10px] text-zinc-500">{status.model}</div>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border hairline bg-black/10 px-3 py-2 text-xs text-zinc-500">Checking local Krea 2 setup…</div>
        )}

        <div>
          <div className="mb-2 text-[10px] font-mono uppercase tracking-widest text-zinc-500">Style</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onStyle("none")}
              className={`rounded-lg border px-3 py-2 text-left transition-colors ${
                style === "none" ? "border-violet-400/60 bg-violet-500/10 text-violet-100" : "hairline text-zinc-400 hover:bg-white/5"
              }`}
              data-testid="krea-style-none"
            >
              <span className="block text-xs font-semibold">None</span>
              <span className="mt-0.5 block text-[10px] text-zinc-500">Plain Krea 2 Turbo</span>
            </button>
            <button
              type="button"
              onClick={() => onStyle("private_magazine")}
              className={`rounded-lg border px-3 py-2 text-left transition-colors ${
                style === "private_magazine" ? "border-fuchsia-400/60 bg-fuchsia-500/10 text-fuchsia-100" : "hairline text-zinc-400 hover:bg-white/5"
              }`}
              data-testid="krea-style-private-magazine"
            >
              <span className="block text-xs font-semibold">Private Magazine</span>
              <span className="mt-0.5 block text-[10px] text-zinc-500">
                {privateReady ? "Installed · trigger added automatically" : "LoRA not detected yet"}
              </span>
            </button>
          </div>
        </div>

        {style === "private_magazine" && (
          <div className="space-y-3">
            {!privateReady && status && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-[11px] text-amber-200">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  Put the Krea 2 Private Magazine LoRA in ComfyUI&apos;s <span className="font-mono">models/loras</span> folder.
                  Ultra Studio will detect the filename automatically after ComfyUI restarts.
                </div>
              </div>
            )}
            <label className="block">
              <span className="mb-2 flex justify-between text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                LoRA strength <b className="text-fuchsia-300">{Number(strength).toFixed(2)}</b>
              </span>
              <input
                type="range"
                min="0.4"
                max="1.5"
                step="0.05"
                value={strength}
                onChange={(event) => onStrength(Number(event.target.value))}
                className="w-full accent-fuchsia-400"
                data-testid="krea-private-magazine-strength"
              />
              <span className="mt-1 block text-[10px] text-zinc-600">
                Starts at 0.80. The <span className="font-mono">privatemag</span> trigger is added automatically.
              </span>
            </label>
          </div>
        )}
      </div>
    </section>
  );
}
