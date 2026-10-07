import { STUDIO_MODE_ORDER, STUDIO_PROFILES } from "@/lib/studioProfiles";

export default function StudioModePicker({ value = "standard", onChange, disabled = false }) {
  return <section className="pane p-3 sm:p-4" data-testid="studio-mode-picker">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <div className="section-label">Create mode</div>
        <p className="mt-1 text-xs text-zinc-400">Use the same Builder with a focused set of specialty controls and presets.</p>
      </div>
      <span className="rounded-full border hairline px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-zinc-400">
        {STUDIO_PROFILES[value]?.shortTitle || "Standard"}
      </span>
    </div>
    <div className="mt-3 grid grid-cols-3 gap-2">
      {STUDIO_MODE_ORDER.map((mode) => {
        const profile = STUDIO_PROFILES[mode];
        const selected = value === mode;
        return <button key={mode} type="button" onClick={() => onChange(mode)} disabled={disabled}
          aria-pressed={selected} data-testid={`studio-mode-${mode}`}
          className={`rounded-xl border px-3 py-3 text-left transition-colors disabled:opacity-40 ${selected
            ? "border-amber-400/60 bg-amber-500/10 text-amber-100"
            : "hairline bg-black/15 text-zinc-300 hover:border-cyan-400/40"}`}>
          <span className="block text-xs font-semibold">{profile.shortTitle}</span>
          <span className="mt-1 block text-[10px] leading-relaxed text-zinc-500">{profile.description}</span>
        </button>;
      })}
    </div>
  </section>;
}
