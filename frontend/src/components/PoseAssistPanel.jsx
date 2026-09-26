import { ImagePlus, Loader2, ShieldCheck, Sparkles, Upload, X } from "lucide-react";

export default function PoseAssistPanel({
  enabled,
  onEnabled,
  preview,
  uploading,
  onUpload,
  onClear,
  strength,
  onStrength,
  polish,
  onPolish,
  stage = "",
  available = true,
  installing = false,
  onInstall,
}) {
  const stageLabel = stage === "foundation"
    ? "Stage 1 of 2 · building pose foundation"
    : stage === "handoff"
      ? "Preparing pose foundation for Chroma"
      : stage === "polish"
        ? "Stage 2 of 2 · Chroma polish"
        : stage === "done"
          ? "Pose Assist complete"
          : "";

  return (
    <section className="pane overflow-hidden" data-testid="pose-assist-panel">
      <div className="flex items-start gap-3 px-3 py-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-violet-500/30 bg-violet-500/10 text-violet-200">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="section-label">Pose Assist</div>
              <div className="mt-0.5 text-sm font-semibold text-zinc-100">One-click pose → polish</div>
            </div>
            <button
              type="button"
              onClick={() => onEnabled(!enabled)}
              className={
                "rounded-lg border px-3 py-1.5 text-xs font-semibold transition "
                + (enabled
                  ? "border-violet-400/40 bg-violet-500/15 text-violet-100"
                  : "border-hairline text-zinc-500 hover:bg-white/5 hover:text-zinc-200")
              }
              aria-pressed={enabled}
              data-testid="btn-toggle-pose-assist"
            >
              {enabled ? "On" : "Off"}
            </button>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
            FLUX handles the difficult body geometry first. Chroma then polishes the result while keeping the pose.
          </p>
        </div>
      </div>

      {enabled && (
        <div className="border-t hairline px-3 py-3 space-y-3">
          {!available && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/[0.07] px-3 py-2 text-[11px] text-amber-200">
              <div>Pose Assist needs its two internal workflows installed once.</div>
              {onInstall && (
                <button
                  type="button"
                  onClick={onInstall}
                  disabled={installing}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-amber-400/30 bg-amber-500/10 px-2.5 py-1.5 font-semibold text-amber-100 disabled:opacity-40"
                  data-testid="btn-install-pose-assist"
                >
                  {installing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
                  {installing ? "Installing…" : "Install Pose Assist"}
                </button>
              )}
            </div>
          )}

          {preview ? (
            <div className="grid grid-cols-[84px_1fr] gap-3 items-center">
              <div className="relative overflow-hidden rounded-lg border hairline bg-black/20">
                <img src={preview} alt="Pose reference" className="h-24 w-20 object-cover" />
                <button
                  type="button"
                  onClick={onClear}
                  className="absolute right-1 top-1 rounded-full bg-black/75 p-1 text-white"
                  aria-label="Remove pose reference"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-200">
                  <ShieldCheck className="h-3.5 w-3.5" /> Pose reference ready
                </div>
                <div className="mt-1 text-[10px] text-zinc-500">
                  Identity and styling still come from your character setup and prompt.
                </div>
              </div>
            </div>
          ) : (
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-violet-500/35 bg-violet-500/[0.05] px-3 py-4 text-xs font-semibold text-violet-100 hover:bg-violet-500/10">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? "Uploading pose…" : "Choose pose reference"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={uploading}
                onChange={(event) => onUpload(event.target.files?.[0])}
                className="hidden"
                data-testid="input-pose-assist-reference"
              />
            </label>
          )}

          <details className="rounded-lg border hairline bg-black/10 p-2.5">
            <summary className="cursor-pointer text-[11px] font-semibold text-zinc-300">Fine tune</summary>
            <div className="mt-3 space-y-3">
              <label className="block">
                <div className="mb-1 flex items-center justify-between text-[10px] text-zinc-500">
                  <span>Pose strength</span><span className="font-mono text-violet-200">{Math.round(strength * 100)}%</span>
                </div>
                <input
                  type="range" min="0.45" max="1.10" step="0.05"
                  value={strength}
                  onChange={(event) => onStrength(Number(event.target.value))}
                  className="w-full accent-violet-400"
                  data-testid="range-pose-assist-strength"
                />
              </label>
              <label className="block">
                <div className="mb-1 flex items-center justify-between text-[10px] text-zinc-500">
                  <span>Chroma polish strength</span><span className="font-mono text-cyan-200">{Math.round(polish * 100)}%</span>
                </div>
                <input
                  type="range" min="0.10" max="0.50" step="0.05"
                  value={polish}
                  onChange={(event) => onPolish(Number(event.target.value))}
                  className="w-full accent-cyan-400"
                  data-testid="range-pose-assist-polish"
                />
                <div className="mt-1 text-[9px] text-zinc-600">Lower values preserve the FLUX pose more strongly.</div>
              </label>
            </div>
          </details>

          <div className="rounded-lg border border-violet-500/20 bg-violet-500/[0.04] px-3 py-2 text-[10px] text-zinc-400">
            <div className="font-semibold text-zinc-300">Automatic pipeline</div>
            <div className="mt-1">Pose reference → FLUX + DWPose → Chroma polish → final Gallery image</div>
          </div>

          {stageLabel && (
            <div className="flex items-center gap-2 text-[11px] font-semibold text-violet-100" data-testid="pose-assist-stage">
              {stage !== "done" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {stageLabel}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
