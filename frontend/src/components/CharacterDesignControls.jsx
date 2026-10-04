import { useId } from "react";
import { GLUTE_SIZE_MAX, GLUTE_SHAPES, GLUTE_TEXTURES } from "@/lib/gluteControls";
import { normalizeCharacterDesign } from "@/lib/characterDesign";

export default function CharacterDesignControls({ value, onChange, subjectLabel = "A" }) {
  const id = useId();
  const profile = normalizeCharacterDesign(value);
  const update = (key, next) => onChange(normalizeCharacterDesign({ ...profile, [key]: next }));
  return (
    <section className="pane p-3 sm:p-6 space-y-4" data-testid="character-design-controls">
      <header>
        <h2 className="font-display font-bold text-lg">Character design notes · Subject {subjectLabel}</h2>
        <p className="text-xs text-zinc-400 mt-1">Proportion and surface references for non-explicit character design. Saved with this subject as design notes; these notes do not change render prompts.</p>
      </header>
      <div className="space-y-2">
        <label htmlFor={`${id}-size`} className="block text-sm">Glute proportion reference <span className="text-amber-300">{profile.size} / {GLUTE_SIZE_MAX}</span></label>
        <input id={`${id}-size`} type="range" min="0" max={GLUTE_SIZE_MAX} step="1" value={profile.size}
          onChange={event => update("size", Number(event.target.value))} className="w-full accent-amber-400" />
        <p className="text-xs text-zinc-500">0 means unspecified. Values are visual references, not anatomical measurements.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[["shape", "Glute shape reference", GLUTE_SHAPES], ["texture", "Surface texture reference", GLUTE_TEXTURES]].map(([key, label, options]) => (
          <div key={key} className="space-y-2 min-w-0">
            <label htmlFor={`${id}-${key}`} className="block text-sm">{label}</label>
            <select id={`${id}-${key}`} value={profile[key]} onChange={event => update(key, event.target.value)}
              className="w-full rounded-lg border hairline bg-elevated px-3 py-2 text-sm text-zinc-100">
              <option value="" label="Unspecified" />
              {options.map(option => <option key={option} value={option} label={option} />)}
            </select>
          </div>
        ))}
      </div>
      <button type="button" className="chip" onClick={() => onChange(normalizeCharacterDesign())}>Clear design notes</button>
      <p className="text-xs text-zinc-500">Use Save character to keep these notes. Each subject has separate selections.</p>
    </section>
  );
}
