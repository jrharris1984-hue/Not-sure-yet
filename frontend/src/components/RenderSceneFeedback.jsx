import { useState } from 'react';
import { endpoints } from '@/lib/api';
import SceneReviewPanel from './SceneReviewPanel';

const dimensions = [['likeness','Likeness'], ['pose','Pose'], ['outfit','Outfit'], ['framing','Framing'], ['scene','Scene and lighting']];

// Gallery keys this component by render id so drafts cannot leak between images.
export default function RenderSceneFeedback({render, onSaved}) {
  const [ratings, setRatings] = useState(render.scene_feedback?.ratings || {});
  const [notes, setNotes] = useState(render.scene_feedback?.notes || '');
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const plan = render.scene_review || render.render_recipe?.scene_review;
  const save = async () => {
    setSaving(true); setStatus('');
    try {
      const feedback = await endpoints.saveSceneFeedback(render.id, {ratings, notes});
      onSaved?.(feedback); setStatus('Feedback saved.');
    } catch { setStatus('Could not save feedback. Your changes are still here; try again.'); }
    finally { setSaving(false); }
  };
  return <section className="space-y-3 rounded-lg border hairline p-3" aria-label="Scene result feedback">
    {plan ? <SceneReviewPanel plan={plan} saved/> : <p className="text-xs text-zinc-400">No scene intentions were saved for this render. You can still record feedback.</p>}
    <details><summary className="cursor-pointer text-xs font-semibold">How did this result match?</summary>
      <p className="mt-2 text-xs text-zinc-400">Record your assessment beside this image. Feedback does not change prompts or train a model.</p>
      <div className="mt-3 space-y-2">{dimensions.map(([key,label]) => <label key={key} className="flex items-center justify-between gap-2 text-xs">
        {label}<select aria-label={`${label} result`} disabled={saving} value={ratings[key] || ''} onChange={event => {setRatings({...ratings,[key]:event.target.value});setStatus('');}} className="rounded border hairline bg-elevated p-1.5">
          <option value="">Not assessed</option><option value="matched">Matched</option><option value="missed">Missed</option><option value="not_applicable">Not applicable</option>
        </select>
      </label>)}</div>
      <label className="mt-3 block text-xs">Notes<textarea aria-label="Result feedback notes" maxLength={2000} rows={3} disabled={saving} value={notes} onChange={event => {setNotes(event.target.value);setStatus('');}} className="mt-1 w-full rounded border hairline bg-elevated p-2"/></label>
      <button type="button" onClick={save} disabled={saving} className="mt-2 rounded border hairline px-3 py-2 text-xs disabled:opacity-40">{saving ? 'Saving feedback…' : 'Save feedback'}</button>
      <p role="status" className="mt-2 text-xs text-zinc-300">{status}</p>
    </details>
  </section>;
}
