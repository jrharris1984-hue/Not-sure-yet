import RandomizerPresets from './RandomizerPresets';
import { PHOTO_RANDOM_SCOPES } from '@/lib/photoRandomizer';
import { Shuffle } from 'lucide-react';
import { RANDOM_SCENE_MODES } from '@/lib/randomScenes';
export default function RandomSceneControls({profile, onProfile, onRandomize, onPhotoRandomize, onCustomRandomize, issues = [], busy}) {
  return <section className="pane p-3 sm:p-4 space-y-3" data-testid="random-scene-controls">
    <div className="flex flex-wrap items-center justify-between gap-2"><div className="section-label">Random scene</div>
      <label className="flex items-center gap-2 text-xs text-zinc-400">Range
        <select aria-label="Random range" value={profile} onChange={event=>onProfile(event.target.value)} disabled={busy} className="rounded-lg border hairline bg-elevated px-2 py-1.5 text-zinc-100">
          <option value="natural">Natural photo · coherent choices</option><option value="adventurous">Adventurous · full range</option><option value="balanced">Balanced · simpler setup</option>
        </select>
      </label>
    </div>
    {onPhotoRandomize && <div className="space-y-2"><h3 className="text-xs font-semibold text-zinc-200">Change one part · keep identity and clothing</h3><div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{PHOTO_RANDOM_SCOPES.map(scope => <button key={scope.id} type="button" disabled={busy} onClick={() => onPhotoRandomize(scope.id)} className="min-h-11 rounded-xl border hairline px-3 py-2 text-xs text-cyan-100 disabled:opacity-40">{scope.label}</button>)}</div><p className="text-xs text-zinc-400">These actions always use natural-photo rules and respect locks. Scene includes lighting and camera; Appearance changes the active cast's looks.</p></div>}
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{RANDOM_SCENE_MODES.map(mode=><button key={mode.id} type="button" disabled={busy} onClick={()=>onRandomize(mode.id)} data-testid={`btn-random-scene-${mode.id}`} className="flex items-center justify-center gap-2 rounded-lg border border-cyan-400/30 bg-cyan-500/5 px-3 py-2.5 text-xs font-semibold text-cyan-100 hover:bg-cyan-500/15 disabled:opacity-40"><Shuffle className="h-4 w-4 shrink-0"/>{mode.label}</button>)}</div>
    {profile === 'natural' && <p className="text-xs text-zinc-400">Natural mode uses everyday poses, photographic styling and bounded proportions. Existing outfits, custom text and locked choices are retained. Rules check structured settings, not the final image.</p>}
    {issues.length > 0 && <div role="status" className="rounded-xl border border-amber-400/30 p-3 text-xs text-amber-200"><b>Review conflicting choices</b><ul className="mt-2 space-y-1">{[...new Set(issues)].map(issue => <li key={issue}>{issue}</li>)}</ul><p className="mt-2">Unlock or edit the conflicting controls, then try again. Locked choices were kept.</p></div>}
    {onCustomRandomize && <RandomizerPresets onApply={onCustomRandomize} busy={busy} />}
    <p className="text-[11px] text-zinc-500">Loads a setup for review; does not render. Modes set the cast; foot modes also set pose and styling. Other locked traits remain saved. Two-person foot scenes keep a full-body frame.</p>
  </section>;
}
