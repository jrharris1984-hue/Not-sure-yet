import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Shuffle, RotateCcw, Lock, LockOpen, Wand2, ChevronDown } from "lucide-react";
import PoseIcon from "@/components/PoseIcon";
import GroupedChips from "@/components/GroupedChips";
import { wardrobeExposure } from "@/lib/wardrobeNudity";
import { normalizeMultiSelection } from "@/lib/dna";
import { physiqueControlStatus, SIZE_CONTROL_PAIRS, sizeControlMode, selectSizeControl } from "@/lib/physiqueControlPriority";

export function ChipRow({ options, value, onChange, testIdPrefix, labels = {} }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = value === opt;
        return (
          <button
            key={opt}
            type="button"
            aria-pressed={active}
            data-testid={`${testIdPrefix}-${opt.replace(/\s+/g, "-")}`}
            className={`chip ${active ? "active" : ""}`}
            onClick={() => onChange(active ? "" : opt)}
          >
            {labels[opt] || opt}
          </button>
        );
      })}
    </div>
  );
}

export function PoseChipGrid({ options, value, onChange, testIdPrefix, labels = {} }) {
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
            className={`flex flex-col items-center justify-center gap-1 rounded-xl border p-2 text-[10px] leading-tight text-center min-h-[108px] transition-all ${
              active
                ? "border-amber-500 bg-amber-500/10 text-amber-100 shadow-[0_0_20px_rgba(245,158,11,0.15)]"
                : "border-[#222634] bg-[#12141C] text-zinc-300 hover:border-zinc-600 hover:bg-[#1A1D28]"
            }`}
          >
            <PoseIcon name={opt} size={56} active={active} />
            <span className="font-mono uppercase tracking-tight">{labels[opt] || opt}</span>
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
  controlNotes = [],
}) {
  const set = (k, v) => {
    if (fieldLocks?.[k]) return; // ignore edits to a locked field
    onChange(k === "exposure_mode"
      ? { ...value, exposure_mode: v || "use selected outfit", nudity_level: 0, nudity_outfit: "" }
      : { ...value, [k]: v });
  };

  return (
    <section
      data-testid={`dna-section-${section.key}`}
      className="pane selection-panel p-3 sm:p-6 space-y-3 sm:space-y-4"
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

      {!collapsed && controlNotes.length > 0 && <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-100 space-y-1" data-testid="builder-control-notes">
        {[...new Set(controlNotes)].map(note => <p key={note}>{note}</p>)}
      </div>}
      {!collapsed && (
      <div className="grid gap-5">
        {section.fields.map((f) => {
          const preset = section.key === 'physique' ? Object.keys(SIZE_CONTROL_PAIRS).find(key => key === f.key || SIZE_CONTROL_PAIRS[key][0] === f.key || (key === 'bust' && f.key === 'implant_volume')) : null;
          const mode = preset ? sizeControlMode(preset, value) : null;
          const isModeHeader = preset === f.key;
          const hiddenControl = preset && (f.key === SIZE_CONTROL_PAIRS[preset][0] ? mode !== 'slider' : f.key === 'implant_volume' ? mode !== 'implant' : false);
          if (hiddenControl || (section.key === 'physique' && f.key === 'bust_shape' && sizeControlMode('bust', value) === 'implant')) return null;
          const priority = section.key === "physique" ? physiqueControlStatus(f.key, value) : null;
          const fLocked = !!fieldLocks?.[f.key];
          const canLock = f.type === "slider" || f.type === "chips" || f.type === "pose_chips";
          return (
          <div key={f.key} className={`${simpleMode && simpleFieldKeys.length && !simpleFieldKeys.includes(f.key) && !(isModeHeader && (simpleFieldKeys.includes(SIZE_CONTROL_PAIRS[preset][0]) || (preset === "bust" && simpleFieldKeys.includes("implant_volume")))) ? "hidden md:block" : "block"} space-y-2 ${fLocked ? "opacity-70" : ""}`}>
            {isModeHeader && <div className="space-y-2" data-testid={`size-mode-${preset}`}>
              <div className="text-xs font-semibold text-zinc-300">{SIZE_CONTROL_PAIRS[preset][1]} · choose one control</div>
              <div className="flex gap-2" role="group" aria-label={`${SIZE_CONTROL_PAIRS[preset][1]} control`}>
                {(preset === 'bust' ? ['preset', 'slider', 'implant'] : ['preset', 'slider']).map(choice => <button type="button" key={choice}
                  data-testid={`size-mode-${preset}-${choice}`} aria-pressed={mode === choice}
                  disabled={!!fieldLocks[preset] || !!fieldLocks[SIZE_CONTROL_PAIRS[preset][0]] || (preset === 'bust' && !!fieldLocks.implant_volume)}
                  onClick={() => onChange(selectSizeControl(preset, choice, value))}
                  className={`rounded-lg border px-3 py-2 text-xs disabled:opacity-40 ${mode === choice ? 'border-cyan-400 text-cyan-100 bg-cyan-500/10' : 'hairline text-zinc-400'}`}>
                  {choice === 'preset' ? 'Preset' : choice === 'slider' ? 'Size slider' : 'Implant size'}
                </button>)}
              </div>
            </div>}
            {(!isModeHeader || mode === 'preset') && <>
            <div className="flex items-center justify-between text-xs text-zinc-400 font-mono uppercase tracking-widest">
              <span className="flex items-center gap-1.5">
                {f.label}
                {priority?.inactive && <span className="text-[10px] text-amber-300 normal-case tracking-normal">Overridden</span>}
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
            {priority && <p data-testid={`control-priority-${f.key}`} className={`text-xs leading-relaxed ${priority.inactive ? "text-amber-200/80" : "text-zinc-500"}`}>{priority.text}</p>}
            {f.help && f.type !== "slider" && <p className="text-xs text-zinc-500 leading-relaxed">{f.help}</p>}
            {f.type === "chips_multi" && (
              <GroupedChips
                labels={f.optionLabels}
                groups={f.groups || [{ name: "All", options: f.options || [] }]}
                value={Array.isArray(value[f.key]) ? value[f.key] : []}
                onChange={(v) => set(f.key, normalizeMultiSelection(f, v, Array.isArray(value[f.key]) ? value[f.key] : []))}
                testIdPrefix={`chip-${section.key}-${f.key}`}
                variant="chips"
                multi
              />
            )}
            {f.type === "chips" && f.groups && (
              <GroupedChips
                labels={f.optionLabels}
                groups={f.groups}
                value={f.key === "exposure_mode" ? wardrobeExposure(value) : Array.isArray(value[f.key]) ? value[f.key].at(-1) || "" : value[f.key] || ""}
                onChange={(v) => set(f.key, v)}
                testIdPrefix={`chip-${section.key}-${f.key}`}
                variant="chips"
              />
            )}
            {f.type === "chips" && !f.groups && (
              <ChipRow
                options={f.options}
                labels={f.optionLabels}
                value={f.key === "exposure_mode" ? wardrobeExposure(value) : Array.isArray(value[f.key]) ? value[f.key].at(-1) || "" : value[f.key] || ""}
                onChange={(v) => set(f.key, v)}
                testIdPrefix={`chip-${section.key}-${f.key}`}
              />
            )}
            {f.type === "pose_chips" && f.groups && (
              <GroupedChips
                labels={f.optionLabels}
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
                labels={f.optionLabels}
                value={value[f.key] || ""}
                onChange={(v) => set(f.key, v)}
                testIdPrefix={`pose-${section.key}-${f.key}`}
              />
            )}
            {f.type === "slider" && (
              <><Slider
                data-testid={`slider-${section.key}-${f.key}`}
                min={preset ? Math.max(f.step || 1, f.min) : f.min}
                max={f.max}
                step={f.step || 1}
                value={[Number(value[f.key] ?? f.min)]}
                onValueChange={(v) => set(f.key, v[0])}
                disabled={fLocked}
              />
              {f.help && <p className="text-xs text-zinc-500 leading-relaxed">{f.help}</p>}
              </>
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
            </>}
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
