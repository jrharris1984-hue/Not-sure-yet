import { Shuffle } from 'lucide-react';
import { RANDOM_SCENE_MODES } from '@/lib/randomScenes';
export default function RandomSceneControls({profile, onProfile, onRandomize, busy}) {
  return <section className="pane p-3 sm:p-4 space-y-3" data-testid="random-scene-controls">
    <div className="flex flex-wrap items-center justify-between gap-2"><div className="section-label">Random scene</div>
      <label className="flex items-center gap-2 text-xs text-zinc-400">Range
        <select aria-label="Random range" value={profile} onChange={event=>onProfile(event.target.value)} disabled={busy} className="rounded-lg border hairline bg-elevated px-2 py-1.5 text-zinc-100">
          <option value="adventurous">Adventurous · full range</option><option value="balanced">Balanced · simpler setup</option>
        </select>
      </label>
    </div>
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{RANDOM_SCENE_MODES.map(mode=><button key={mode.id} type="button" disabled={busy} onClick={()=>onRandomize(mode.id)} data-testid={`btn-random-scene-${mode.id}`} className="flex items-center justify-center gap-2 rounded-lg border border-cyan-400/30 bg-cyan-500/5 px-3 py-2.5 text-xs font-semibold text-cyan-100 hover:bg-cyan-500/15 disabled:opacity-40"><Shuffle className="h-4 w-4 shrink-0"/>{mode.label}</button>)}</div>
    <p className="text-[11px] text-zinc-500">Loads a setup for review; does not render. Modes set the cast; foot modes also set pose and styling. Other locked traits remain saved. Two-person foot scenes keep a full-body frame.</p>
  </section>;
}
