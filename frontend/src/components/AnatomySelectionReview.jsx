import { anatomySelectionReview, cleanUpAnatomySelections, normalizeAnatomyDetails } from '@/lib/anatomyDetailControls';
export default function AnatomySelectionReview({ value, catalog, fields, locks, locked, onChange }) {
  const review = anatomySelectionReview(value, catalog, locks);
  if (!review.length) return null;
  const label = key => fields.find(field => field.key === key)?.label || key.replace(/_/g, ' ');
  const effective = normalizeAnatomyDetails({intimate:value}, catalog).intimate;
  const targets = [...new Set(review.flatMap(item => Object.keys(item.details)))];
  return <details className="rounded-xl border border-amber-400/30 p-3 text-xs" open={review.some(item => item.conflicts.length > 0)}>
    <summary className="cursor-pointer min-h-11 content-center font-semibold text-amber-200">{review.some(item => item.conflicts.length) ? 'Overlapping selections found' : 'Older preset selections'} · review</summary>
    <p className="text-zinc-400 my-2">Individual choices take priority. Cleanup fills missing details and removes recognized combined presets. Your saved choices change only when you apply it.</p>
    <ul className="space-y-2">{review.map(item => <li key={item.field}>
      <strong>{label(item.field)}: {item.selected}</strong>
      {item.conflicts.length > 0 && <span> · Individual choices win for {item.conflicts.map(label).join(', ')}.</span>}
      {(locked || item.blocked) && <span className="block text-amber-200">Unlock the preset and its affected controls to clean up this selection.</span>}
    </li>)}</ul>
    <p className="mt-3 text-zinc-400">Effective anatomy choices: {targets.map(key => `${label(key)}: ${effective[key]}`).join(' · ')}</p>
    <button type="button" className="chip min-h-11 mt-3" disabled={locked || review.every(item => item.blocked)} onClick={() => onChange(cleanUpAnatomySelections(value, catalog, locks))}>Apply cleanup</button>
  </details>;
}
