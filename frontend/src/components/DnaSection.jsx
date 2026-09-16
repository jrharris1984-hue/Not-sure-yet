import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Shuffle, RotateCcw, Lock, LockOpen, Wand2 } from "lucide-react";
import PoseIcon from "@/components/PoseIcon";

export function ChipRow({ options, value, onChange, testIdPrefix }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = value === opt;
        return (
          <button
            key={opt}
            type="button"
            data-testid={`${testIdPrefix}-${opt.replace(/\s+/g, "-")}`}
            className={`chip ${active ? "active" : ""}`}
            onClick={() => onChange(active ? "" : opt)}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

export function PoseChipGrid({ options, value, onChange, testIdPrefix }) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
      {options.map((opt) => {
        const active = value === opt;
        return (
          <button
            key={opt}
            type="button"
            data-testid={`${testIdPrefix}-${opt.replace(/\s+/g, "-")}`}
            onClick={() => onChange(active ? "" : opt)}
            className={`flex flex-col items-center justify-center gap-1 rounded-xl border p-2 text-[10px] leading-tight text-center min-h-[88px] transition-all ${
              active
                ? "border-amber-500 bg-amber-500/10 text-amber-100 shadow-[0_0_20px_rgba(245,158,11,0.15)]"
                : "border-[#222634] bg-[#12141C] text-zinc-300 hover:border-zinc-600 hover:bg-[#1A1D28]"
            }`}
          >
            <PoseIcon name={opt} size={40} active={active} />
            <span className="font-mono uppercase tracking-tight">{opt}</span>
          </button>
        );
      })}
    </div>
  );
}

export default function DnaSection({
  section,
  value = {},
  onChange,
  locked,
  onToggleLock,
  onRandomize,
  onReset,
  onSuggest,
}) {
  const set = (k, v) => onChange({ ...value, [k]: v });

  return (
    <section
      data-testid={`dna-section-${section.key}`}
      className="pane p-4 sm:p-6 space-y-4"
    >
      <header className="flex items-center justify-between gap-2">
        <div>
          <div className="section-label">{section.key}</div>
          <h2 className="font-display font-bold text-lg sm:text-xl">{section.title}</h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            title="AI suggest"
            onClick={onSuggest}
            data-testid={`btn-ai-suggest-${section.key}`}
            className="h-9 w-9 grid place-items-center rounded-lg border hairline text-amber-300 hover:bg-amber-500/10"
          >
            <Wand2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Randomize section"
            onClick={onRandomize}
            data-testid={`btn-randomize-${section.key}`}
            className="h-9 w-9 grid place-items-center rounded-lg border hairline text-zinc-300 hover:bg-white/5"
          >
            <Shuffle className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Reset section"
            onClick={onReset}
            data-testid={`btn-reset-${section.key}`}
            className="h-9 w-9 grid place-items-center rounded-lg border hairline text-zinc-300 hover:bg-white/5"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            type="button"
            title={locked ? "Unlock section" : "Lock section"}
            onClick={onToggleLock}
            data-testid={`btn-lock-${section.key}`}
            className={`h-9 w-9 grid place-items-center rounded-lg border hairline ${
              locked ? "text-amber-300 bg-amber-500/10 border-amber-500/40" : "text-zinc-300 hover:bg-white/5"
            }`}
          >
            {locked ? <Lock className="h-4 w-4" /> : <LockOpen className="h-4 w-4" />}
          </button>
        </div>
      </header>

      <div className="grid gap-5">
        {section.fields.map((f) => (
          <div key={f.key} className="space-y-2">
            <label className="flex items-center justify-between text-xs text-zinc-400 font-mono uppercase tracking-widest">
              <span>{f.label}</span>
              {f.type === "slider" && (
                <span data-testid={`slider-value-${section.key}-${f.key}`} className="text-amber-300">
                  {value[f.key] ?? ""}
                </span>
              )}
            </label>
            {f.type === "chips" && (
              <ChipRow
                options={f.options}
                value={value[f.key] || ""}
                onChange={(v) => set(f.key, v)}
                testIdPrefix={`chip-${section.key}-${f.key}`}
              />
            )}
            {f.type === "pose_chips" && (
              <PoseChipGrid
                options={f.options}
                value={value[f.key] || ""}
                onChange={(v) => set(f.key, v)}
                testIdPrefix={`pose-${section.key}-${f.key}`}
              />
            )}
            {f.type === "slider" && (
              <Slider
                data-testid={`slider-${section.key}-${f.key}`}
                min={f.min}
                max={f.max}
                step={f.step || 1}
                value={[Number(value[f.key] ?? f.min)]}
                onValueChange={(v) => set(f.key, v[0])}
              />
            )}
            {f.type === "text" && (
              <Input
                data-testid={`input-${section.key}-${f.key}`}
                value={value[f.key] || ""}
                onChange={(e) => set(f.key, e.target.value)}
                placeholder={`Enter ${f.label.toLowerCase()}...`}
                className="bg-elevated border-hairline text-zinc-100 font-mono text-sm"
              />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
