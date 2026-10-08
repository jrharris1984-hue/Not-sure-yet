import { useState } from "react";
import { photoshootCatalog, resolvePhotoshootPreset, SMART_VARIATION_STRENGTHS } from "@/lib/batchSmartPhotoshoot";
import SmartPhotoshootDesigner from "@/components/SmartPhotoshootDesigner";

const MODES = [
  ["explore", "New seeds only"],
  ["nearby", "Nearby seeds"],
  ["pose", "New seed + different pose"],
  ["camera", "New seed + different camera"],
  ["pose_camera", "New seed + pose + camera"],
  ["smart", "Smart photoshoot"],
];

const SMART_FIELDS = [
  ["pose", "Pose"],
  ["camera", "Camera"],
  ["framing", "Framing"],
  ["expression", "Expression"],
];

export default function BatchVariationControl({
  value,
  onChange,
  smartOptions,
  onSmartOptionsChange,
  smartPreset = "editorial",
  onSmartPresetChange,
  smartPlan = [],
  onRegeneratePlan,
  smartStrength = "balanced",
  onSmartStrengthChange,
  customPresets = [],
  onSavePreset,
  onDeletePreset,
  compact = false,
}) {
  const updateSmart = (key, checked) => onSmartOptionsChange({
    ...smartOptions,
    [key]: checked,
  });
  const [designerOpen, setDesignerOpen] = useState(false);
  const [designerSource, setDesignerSource] = useState(smartPreset);
  const catalog = photoshootCatalog(customPresets);
  const activePreset = resolvePhotoshootPreset(smartPreset, customPresets);

  return (
    <div className={compact ? "relative" : "space-y-2"} data-testid="batch-variation-control">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label="Batch variety"
        title="Choose how multi-image batches vary while keeping the character and scene coherent."
        className={compact
          ? "bg-elevated border border-hairline rounded-lg px-3 py-2 text-sm text-zinc-100"
          : "w-full bg-elevated border border-hairline rounded-lg px-2 py-2 text-xs text-zinc-100"}
      >
        {MODES.map(([mode, label]) => <option key={mode} value={mode}>{label}</option>)}
      </select>

      {value === "smart" && (
        <div className={compact
          ? "absolute right-0 top-full z-30 mt-2 w-[34rem] max-w-[90vw] rounded-xl border hairline bg-zinc-950 p-3 shadow-2xl"
          : "rounded-lg border hairline bg-black/20 p-3"}
          data-testid="smart-photoshoot-options"
        >
          <div className="text-[10px] font-mono uppercase tracking-widest text-cyan-300">Smart photoshoot director</div>
          <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
            Pick a type of shoot, then Ultra Studio builds a deliberate shot list instead of randomizing every image independently.
          </p>

          <label className="mt-3 block text-[10px] font-mono uppercase tracking-widest text-zinc-400">
            Shoot style
            <select
              value={smartPreset}
              onChange={(event) => onSmartPresetChange?.(event.target.value)}
              className="mt-1 w-full rounded-lg border hairline bg-elevated px-2 py-2 text-xs normal-case tracking-normal text-zinc-100"
              aria-label="Smart photoshoot style"
            >
              {catalog.categories.map(category => (
                <optgroup key={category.key} label={category.label}>
                  {category.presets.map(preset => (
                    <option key={preset.key} value={preset.key}>{preset.label}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>

          <div className="mt-2 flex items-start gap-2 rounded-lg border hairline bg-white/[0.02] px-2.5 py-2 text-[11px] text-zinc-400">
            <div className="min-w-0 flex-1">
              <span className="font-semibold text-zinc-200">{activePreset.label}</span>
              <span className="ml-1">{activePreset.description}</span>
            </div>
            <div className="flex shrink-0 gap-1">
              <button type="button" onClick={() => { setDesignerSource("__blank__"); setDesignerOpen(true); }}
                className="rounded-md border hairline px-2 py-1 text-[10px] font-semibold text-zinc-300 hover:bg-white/5">
                New
              </button>
              <button type="button" onClick={() => { setDesignerSource(smartPreset); setDesignerOpen(true); }}
                className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-[10px] font-semibold text-cyan-200">
                {activePreset.custom ? "Edit" : "Customize"}
              </button>
            </div>
          </div>

          <label className="mt-3 block text-[10px] font-mono uppercase tracking-widest text-zinc-400">
            Variation strength
            <select
              value={smartStrength}
              onChange={(event) => onSmartStrengthChange?.(event.target.value)}
              className="mt-1 w-full rounded-lg border hairline bg-elevated px-2 py-2 text-xs normal-case tracking-normal text-zinc-100"
              aria-label="Smart photoshoot variation strength"
            >
              {SMART_VARIATION_STRENGTHS.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>

          <div className="mt-3 grid grid-cols-2 gap-2">
            {SMART_FIELDS.map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 rounded-lg border hairline bg-white/[0.02] px-2 py-2 text-[11px] text-zinc-300">
                <input
                  type="checkbox"
                  checked={!!smartOptions[key]}
                  onChange={(event) => updateSmart(key, event.target.checked)}
                />
                {label}
              </label>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between gap-2">
            <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Planned shots</div>
            <button type="button" onClick={onRegeneratePlan}
              className="rounded-md border hairline px-2 py-1 text-[10px] font-semibold text-cyan-200 hover:bg-white/5">
              New plan
            </button>
          </div>

          <div className="mt-2 max-h-56 space-y-1 overflow-y-auto pr-1" data-testid="smart-photoshoot-plan">
            {smartPlan.map((item, index) => (
              <div key={`${index}-${item.title}`} className="grid grid-cols-[1.5rem_1fr] gap-2 rounded-md border hairline bg-black/20 px-2 py-1.5 text-[10px]">
                <span className="font-mono text-cyan-300">{String(index + 1).padStart(2, "0")}</span>
                <div className="min-w-0">
                  <div className="font-semibold text-zinc-200">{item.title}</div>
                  <div className="truncate text-zinc-500">
                    {[item.framing, item.pose?.label, item.camera?.label, item.expression].filter(Boolean).join(" · ")}
                  </div>
                </div>
              </div>
            ))}
            {!smartPlan.length && <div className="text-[11px] text-zinc-500">Choose at least one variation control to build a shot plan.</div>}
          </div>
        </div>
      )}

      <SmartPhotoshootDesigner
        open={designerOpen}
        onClose={() => setDesignerOpen(false)}
        sourcePreset={designerSource}
        customPresets={customPresets}
        onSave={async (preset) => {
          await onSavePreset?.(preset);
          onSmartPresetChange?.(preset.key);
        }}
        onDelete={async (key) => {
          await onDeletePreset?.(key);
          onSmartPresetChange?.("editorial");
          setDesignerOpen(false);
        }}
      />
    </div>
  );
}
