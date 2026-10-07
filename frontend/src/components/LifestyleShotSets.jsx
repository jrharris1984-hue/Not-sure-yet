import { useState } from 'react';
import { LIFESTYLE_SETS, LIFESTYLE_POSES, LIFESTYLE_VIEWS, LIFESTYLE_OUTFITS,
  LIFESTYLE_FRAMING, MAX_LIFESTYLE_SHOTS, lifestyleSetShots } from '@/lib/lifestyleShotSets';

export default function LifestyleShotSets({ shots, onChange }) {
  const [setKey, setSetKey] = useState('views');
  const [outfit, setOutfit] = useState('streetwear');
  const added = lifestyleSetShots(setKey, outfit);
  const update = (index, key, value) => onChange(shots.map((shot, i) => i === index ? { ...shot, [key]: value } : shot));
  const move = (index, offset) => {
    const next = [...shots];
    [next[index], next[index + offset]] = [next[index + offset], next[index]];
    onChange(next);
  };
  return <section className="pane p-4 sm:p-6 space-y-4" data-testid="lifestyle-shot-sets">
    <div><h2 className="section-label">Ordered fashion & lifestyle sets</h2>
      <p className="mt-1 text-xs text-zinc-400">Add a set, then adjust or reorder individual shots. The same character reference and shared setting are used throughout. No images are queued until Start shoot.</p></div>
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="text-xs text-zinc-300">Add a shot set<select aria-label="Shot set" value={setKey} onChange={e => setSetKey(e.target.value)} className="mt-1 w-full bg-elevated border hairline rounded-lg p-2">{LIFESTYLE_SETS.map(set => <option key={set.key} value={set.key}>{set.label}</option>)}</select></label>
      <label className="text-xs text-zinc-300">Outfit for the new set<select aria-label="New set outfit" value={outfit} onChange={e => setOutfit(e.target.value)} className="mt-1 w-full bg-elevated border hairline rounded-lg p-2">{LIFESTYLE_OUTFITS.map(value => <option key={value}>{value}</option>)}</select></label>
    </div>
    <button type="button" className="chip active" disabled={shots.length + added.length > MAX_LIFESTYLE_SHOTS} onClick={() => onChange([...shots, ...added])}>Add {added.length} shots</button>
    <p className="text-xs text-zinc-400">{shots.length}/{MAX_LIFESTYLE_SHOTS} shots · Choose the room and lighting in Set & lighting. Include the chair, couch or bed there when using seated sets.</p>
    {shots.length === 0 && <p className="text-sm text-amber-200">Add at least one shot set to continue.</p>}
    <div className="space-y-2">
      {shots.map((shot, index) => <details key={index} className="rounded-xl border hairline bg-elevated p-3">
        <summary className="cursor-pointer text-sm">{index + 1}. {shot.set_label} · {LIFESTYLE_VIEWS.find(([value]) => value === shot.view)?.[1]} · {shot.outfit}</summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {[
            ['pose', 'Pose', Object.entries(LIFESTYLE_POSES).map(([value, item]) => [value, item.label])],
            ['view', 'View', LIFESTYLE_VIEWS],
            ['framing', 'Framing', LIFESTYLE_FRAMING.map(value => [value, value])],
            ['camera_height', 'Camera height', ['eye-level', 'low', 'high'].map(value => [value, value])],
            ['outfit', 'Outfit', LIFESTYLE_OUTFITS.map(value => [value, value])],
          ].map(([key, label, options]) => <label key={key} className="text-xs text-zinc-300">{label}<select aria-label={`Shot ${index + 1} ${label}`} value={shot[key]} onChange={e => update(index, key, e.target.value)} className="mt-1 w-full bg-elevated border hairline rounded-lg p-2">{options.map(([value, title]) => <option key={value} value={value}>{title}</option>)}</select></label>)}
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          <button type="button" className="chip" aria-label={`Move shot ${index + 1} up`} disabled={index === 0} onClick={() => move(index, -1)}>Move up</button>
          <button type="button" className="chip" aria-label={`Move shot ${index + 1} down`} disabled={index === shots.length - 1} onClick={() => move(index, 1)}>Move down</button>
          <button type="button" className="chip" aria-label={`Remove shot ${index + 1}`} onClick={() => onChange(shots.filter((_, i) => i !== index))}>Remove</button>
        </div>
      </details>)}
    </div>
  </section>;
}
