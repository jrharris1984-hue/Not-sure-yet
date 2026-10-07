import {useEffect, useMemo, useState} from 'react';

const TWO_PERSON_POSE_GROUPS = [
  {label:'Portrait', poses:[
    'side by side','shoulder to shoulder','formal portrait pose','casual candid pose',
    'looking at camera together','mirrored pose','staggered standing',
  ]},
  {label:'Interaction', poses:[
    'facing each other','looking at each other','close conversational pose','leaning together',
    'embracing','hugging from behind','holding hands','arm in arm',
  ]},
  {label:'Movement', poses:[
    'walking together','walking arm in arm','dancing together','one behind the other',
  ]},
  {label:'Seated & mixed levels', poses:[
    'seated together','seated side by side','seated facing each other','one seated and one standing',
  ]},
  {label:'Angles', poses:[
    'back to back','over-the-shoulder pairing',
  ]},
];

const GROUP_POSE_GROUPS = [
  {label:'Group composition', poses:[
    'group portrait','staggered lineup','semicircle','standing at different depths',
  ]},
  {label:'Interaction', poses:[
    'walking together','seated group','hands joined','casual candid group',
  ]},
];

const clean = value => String(value || '').replace(/\s+/g, ' ').trim();

export default function CastPoseOptions({count, value, onSelect}) {
  const groups = count === 2 ? TWO_PERSON_POSE_GROUPS : GROUP_POSE_GROUPS;
  const presetSet = useMemo(() => new Set(groups.flatMap(group => group.poses)), [groups]);
  const selectedIsCustom = !!clean(value) && !presetSet.has(clean(value));
  const [customPose, setCustomPose] = useState(selectedIsCustom ? clean(value) : '');

  useEffect(() => {
    if (selectedIsCustom) setCustomPose(clean(value));
  }, [selectedIsCustom, value]);

  if (count < 2) return null;

  const applyCustom = () => {
    const pose = clean(customPose);
    if (pose) onSelect(pose);
  };

  return <div className="pane p-3" data-testid="cast-aware-poses">
    <div className="section-label">Poses for {count} people</div>
    <p className="mt-1 text-xs text-zinc-400">Choose a shared composition; each person keeps separate character settings.</p>

    <div className="mt-3 space-y-3">
      {groups.map(group => <section key={group.label} aria-label={group.label}>
        <div className="mb-1.5 text-[10px] font-mono uppercase tracking-widest text-emerald-300/80">{group.label}</div>
        <div className="grid grid-cols-2 gap-2">
          {group.poses.map(pose => <button key={pose} type="button" aria-pressed={value === pose} onClick={() => onSelect(pose)}
            className={`sheet-field-card rounded-lg border px-3 py-2 text-xs capitalize ${value === pose ? 'has-selection border-amber-400 text-amber-200' : 'hairline text-zinc-300'}`}>{pose}</button>)}
        </div>
      </section>)}
    </div>

    <div className="mt-4 rounded-lg border hairline bg-black/10 p-2.5">
      <label className="block text-[10px] font-mono uppercase tracking-widest text-cyan-300">Custom shared pose</label>
      <p className="mt-1 text-[11px] text-zinc-500">Type any composition or interaction that is not listed above.</p>
      <div className="mt-2 flex gap-2">
        <input
          value={customPose}
          onChange={event => setCustomPose(event.target.value)}
          onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); applyCustom(); } }}
          placeholder={count === 2 ? 'e.g. one kneeling while the other stands behind' : 'e.g. triangular group composition'}
          aria-label="Custom shared pose"
          className={`min-w-0 flex-1 rounded-lg border bg-elevated px-3 py-2 text-xs text-zinc-100 outline-none focus:border-cyan-400 ${selectedIsCustom ? 'border-cyan-400/70' : 'hairline'}`}
        />
        <button type="button" onClick={applyCustom} disabled={!clean(customPose)}
          className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-30">
          Use custom
        </button>
      </div>
      {selectedIsCustom && <div className="mt-2 text-[11px] text-cyan-200">Active custom pose: {clean(value)}</div>}
    </div>
  </div>;
}
