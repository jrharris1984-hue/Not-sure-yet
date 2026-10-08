import { useState } from 'react';
import { CUSTOM_POSE_GROUP_OPTIONS, CUSTOM_CAMERA_OPTIONS, CUSTOM_FRAMING_OPTIONS, CUSTOM_EXPRESSION_OPTIONS } from '@/lib/batchSmartPhotoshoot';

// Choosing a family replaces the captured exact choice for that field only.
export function patchPhotoshootShot(shot, patch) {
  const next = { ...shot, ...patch };
  if (Object.hasOwn(patch, 'pose_group')) { delete next.pose_prompt; delete next.pose_label; }
  if (Object.hasOwn(patch, 'camera_match')) { delete next.camera_pose_angle; delete next.camera_angle; }
  return next;
}

const fields = [
  ['pose_group', 'Pose family', CUSTOM_POSE_GROUP_OPTIONS],
  ['camera_match', 'Camera', CUSTOM_CAMERA_OPTIONS],
  ['framing', 'Framing', CUSTOM_FRAMING_OPTIONS.map(value => [value, value || 'Keep character framing'])],
  ['expression', 'Expression', CUSTOM_EXPRESSION_OPTIONS.map(value => [value, value || 'Keep character expression'])],
];
export default function PhotoshootBulkEditor({ selected, count, onSelect, onApply }) {
  const [patch, setPatch] = useState({});
  const [message, setMessage] = useState('');
  return <div className="mt-3 rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-3" data-testid="photoshoot-bulk-editor">
    <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-300">
      <span className="font-semibold">Edit selected shots · {selected.length} selected</span>
      <button type="button" className="min-h-11 rounded-lg border hairline px-3" onClick={() => { onSelect(Array.from({ length: count }, (_, i) => i)); setMessage(''); }}>Select all shots</button>
      <button type="button" className="min-h-11 rounded-lg border hairline px-3" onClick={() => { onSelect([]); setMessage(''); }}>Clear selection</button>
    </div>
    {selected.length > 0 && <>
      <div className="mt-2 grid gap-2 sm:grid-cols-2 md:grid-cols-4">
        {fields.map(([key, label, options]) => <label key={key} className="text-xs text-zinc-400">{label}
          <select aria-label={`Bulk ${label}`} value={Object.hasOwn(patch, key) ? patch[key] : '__unchanged__'}
            onChange={e => { const value = e.target.value; setPatch(current => { const next = { ...current }; if (value === '__unchanged__') delete next[key]; else next[key] = value; if (key === 'pose_group') { delete next.pose_prompt; delete next.pose_label; } return next; }); setMessage(''); }}
            className="mt-1 min-h-11 w-full rounded-lg border hairline bg-elevated p-2 text-zinc-100">
            <option value="__unchanged__">No change</option>
            {options.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
          </select>
        </label>)}
      </div>
      <label className="mt-3 flex min-h-11 items-center gap-2 text-xs text-zinc-300">
        <input type="checkbox" checked={Object.hasOwn(patch, 'pose_prompt')} onChange={e => {
          const checked = e.target.checked;
          setPatch(current => { const next = { ...current }; if (checked) { delete next.pose_group; next.pose_prompt = ''; next.pose_label = ''; } else { delete next.pose_prompt; delete next.pose_label; } return next; }); setMessage('');
        }} /> Apply an exact pose prompt
      </label>
      {Object.hasOwn(patch, 'pose_prompt') && <textarea aria-label="Bulk exact pose prompt" value={patch.pose_prompt}
        onChange={e => { const value = e.target.value; setPatch(current => ({ ...current, pose_prompt: value, pose_label: value })); setMessage(''); }}
        placeholder="Describe the shared pose. Leave empty to keep each character’s pose."
        className="min-h-20 w-full rounded-lg border hairline bg-elevated p-2 text-sm text-zinc-100" />}
      <button type="button" disabled={!Object.keys(patch).length} onClick={() => { onApply(patch); setMessage(`Applied to ${selected.length} shots. Save the shoot to keep these changes.`); }}
        className="mt-3 min-h-11 rounded-lg bg-cyan-400 px-4 py-2 text-xs font-bold text-black disabled:opacity-40">Apply to {selected.length} shots</button>
    </>}
    <p role="status" className="mt-2 text-xs text-zinc-400">{message || 'Check the shots below. Only fields you change are applied to the selected shots.'}</p>
  </div>;
}
