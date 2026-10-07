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
  compact = false,
}) {
  const updateSmart = (key, checked) => onSmartOptionsChange({
    ...smartOptions,
    [key]: checked,
  });

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
          ? "absolute right-0 top-full z-30 mt-2 w-72 rounded-xl border hairline bg-zinc-950 p-3 shadow-2xl"
          : "rounded-lg border hairline bg-black/20 p-3"}
          data-testid="smart-photoshoot-options"
        >
          <div className="text-[10px] font-mono uppercase tracking-widest text-cyan-300">Smart photoshoot</div>
          <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
            Character, wardrobe, scene, lighting, model and LoRAs stay fixed. Choose what the photoshoot may vary.
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2">
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
        </div>
      )}
    </div>
  );
}
