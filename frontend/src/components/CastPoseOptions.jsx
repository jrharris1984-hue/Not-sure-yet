export default function CastPoseOptions({count, value, onSelect}) {
  if (count < 2) return null;
  const poses = count === 2
    ? ['side by side', 'back to back', 'facing each other', 'walking together', 'seated together', 'embracing', 'dancing together']
    : ['group portrait', 'staggered lineup', 'semicircle', 'walking together', 'seated group', 'standing at different depths', 'hands joined'];
  return <div className="pane p-3" data-testid="cast-aware-poses">
    <div className="section-label">Poses for {count} people</div>
    <p className="mt-1 text-xs text-zinc-400">Choose a shared composition; each person keeps separate character settings.</p>
    <div className="mt-2 grid grid-cols-2 gap-2">
      {poses.map(pose => <button key={pose} type="button" aria-pressed={value === pose} onClick={() => onSelect(pose)}
        className={`sheet-field-card rounded-lg border px-3 py-2 text-xs capitalize ${value === pose ? 'has-selection border-amber-400 text-amber-200' : 'hairline text-zinc-300'}`}>{pose}</button>)}
    </div>
  </div>;
}
