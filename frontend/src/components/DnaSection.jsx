import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Shuffle, RotateCcw, Lock, LockOpen, Wand2, ChevronDown } from "lucide-react";
import PoseIcon from "@/components/PoseIcon";
import GroupedChips from "@/components/GroupedChips";

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
  fieldLocks = {},
  onToggleFieldLock,
  collapsed = false,
  onToggleCollapsed,
  simpleMode = false,
  simpleFieldKeys = [],
  onRequestAdvanced,
}) {
  const set = (k, v) => {
    if (fieldLocks?.[k]) return; // ignore edits to a locked field
    onChange({ ...value, [k]: v });
  };

  return (
    <section
      data-testid={`dna-section-${section.key}`}
      className="pane p-3 sm:p-6 space-y-3 sm:space-y-4"
    >
      <header className="flex items-start sm:items-center justify-between gap-2">
        <button
          type="button"
          onClick={onToggleCollapsed}
          data-testid={`btn-collapse-${section.key}`}
          className="flex items-center gap-2 text-left group"
        >
          <ChevronDown className={`h-4 w-4 text-zinc-500 group-hover:text-zinc-200 transition-transform ${collapsed ? "-rotate-90" : ""}`} />
          <div>
            <div className="section-label">{section.key}</div>
            <h2 className="font-display font-bold text-lg sm:text-xl">{section.title}</h2>
          </div>
        </button>
        <div className="flex items-center gap-1">
          <button
            type="button"
            title="AI suggest"
            onClick={onSuggest}
            data-testid={`btn-ai-suggest-${section.key}`}
            className={`${simpleMode ? "hidden md:grid" : "grid"} h-8 w-8 sm:h-9 sm:w-9 place-items-center rounded-lg border hairline text-amber-300 hover:bg-amber-500/10`}
          >
            <Wand2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Randomize section"
            onClick={onRandomize}
            data-testid={`btn-randomize-${section.key}`}
            className="h-8 w-8 sm:h-9 sm:w-9 grid place-items-center rounded-lg border hairline text-zinc-300 hover:bg-white/5"
          >
            <Shuffle className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Reset section"
            onClick={onReset}
            data-testid={`btn-reset-${section.key}`}
            className={`${simpleMode ? "hidden md:grid" : "grid"} h-8 w-8 sm:h-9 sm:w-9 place-items-center rounded-lg border hairline text-zinc-300 hover:bg-white/5`}
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            type="button"
            title={locked ? "Unlock section" : "Lock section — keep these values and prioritize them as Must Match"}
            onClick={onToggleLock}
            data-testid={`btn-lock-${section.key}`}
            className={`${simpleMode ? "hidden md:grid" : "grid"} h-9 w-9 place-items-center rounded-lg border hairline ${
              locked ? "text-amber-300 bg-amber-500/10 border-amber-500/40" : "text-zinc-300 hover:bg-white/5"
            }`}
          >
            {locked ? <Lock className="h-4 w-4" /> : <LockOpen className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {!collapsed && (
      <div className="grid gap-5">
        {section.fields.map((f) => {
          const fLocked = !!fieldLocks?.[f.key];
          const canLock = f.type === "slider" || f.type === "chips" || f.type === "pose_chips";
          return (
          <div key={f.key} className={`${simpleMode && simpleFieldKeys.length && !simpleFieldKeys.includes(f.key) ? "hidden md:block" : "block"} space-y-2 ${fLocked ? "opacity-70" : ""}`}>
            <div className="flex items-center justify-between text-xs text-zinc-400 font-mono uppercase tracking-widest">
              <span className="flex items-center gap-1.5">
                {f.label}
                {fLocked && <Lock className="h-3 w-3 text-amber-300" />}
              </span>
              <div className="flex items-center gap-2">
                {f.type === "slider" && (
                  <span data-testid={`slider-value-${section.key}-${f.key}`} className="text-amber-300">
                    {value[f.key] ?? ""}
                  </span>
                )}
                {canLock && onToggleFieldLock && (
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleFieldLock(f.key); }}
                    data-testid={`btn-field-lock-${section.key}-${f.key}`}
                    title={fLocked ? "Unlock — value can change again" : "Lock — keep this value and prioritize it as Must Match"}
                    className={`h-5 w-5 grid place-items-center rounded ${
                      fLocked ? "text-amber-300" : "text-zinc-500 hover:text-zinc-200"
                    }`}
                  >
                    {fLocked ? <Lock className="h-3 w-3" /> : <LockOpen className="h-3 w-3" />}
                  </button>
                )}
              </div>
            </div>
            {f.type === "chips_multi" && (
              <GroupedChips
                groups={f.groups || [{ name: "All", options: f.options || [] }]}
                value={Array.isArray(value[f.key]) ? value[f.key] : []}
                onChange={(v) => set(f.key, v)}
                testIdPrefix={`chip-${section.key}-${f.key}`}
                variant="chips"
                multi
              />
            )}
            {f.type === "chips" && f.groups && (
              <GroupedChips
                groups={f.groups}
                value={value[f.key] || ""}
                onChange={(v) => set(f.key, v)}
                testIdPrefix={`chip-${section.key}-${f.key}`}
                variant="chips"
              />
            )}
            {f.type === "chips" && !f.groups && (
              <ChipRow
                options={f.options}
                value={value[f.key] || ""}
                onChange={(v) => set(f.key, v)}
                testIdPrefix={`chip-${section.key}-${f.key}`}
              />
            )}
            {f.type === "pose_chips" && f.groups && (
              <GroupedChips
                groups={f.groups}
                value={value[f.key] || ""}
                onChange={(v) => set(f.key, v)}
                testIdPrefix={`pose-${section.key}-${f.key}`}
                variant="poses"
              />
            )}
            {f.type === "pose_chips" && !f.groups && (
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
                disabled={fLocked}
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
          );
        })}
      </div>
      )}
      {!collapsed && simpleMode && simpleFieldKeys.length > 0 && section.fields.some((field) => !simpleFieldKeys.includes(field.key)) && (
        <button
          type="button"
          onClick={onRequestAdvanced}
          className="md:hidden w-full rounded-lg border border-dashed hairline px-3 py-2.5 text-xs font-semibold text-zinc-500 hover:bg-white/[0.03] hover:text-zinc-300"
          data-testid={`btn-advanced-fields-${section.key}`}
        >
          Show all {section.fields.length} {section.title.toLowerCase()} controls
        </button>
      )}
    </section>
  );
}
