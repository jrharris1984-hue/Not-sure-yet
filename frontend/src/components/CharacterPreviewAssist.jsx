import { useEffect, useRef, useState } from 'react';
import { endpoints } from '@/lib/api';
import { previewAiChanges, applyPreviewAiChanges } from '@/lib/characterPreview';

export default function CharacterPreviewAssist({ dna, onApply, sections, section, locks, fieldLocks, provider, disabled }) {
  const [instruction, setInstruction] = useState('');
  const [busy, setBusy] = useState(false);
  const [review, setReview] = useState(null);
  const [error, setError] = useState('');
  const mounted = useRef(false);
  const inFlight = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const dnaKey = JSON.stringify(dna);
  const request = async mode => {
    if (inFlight.current || disabled || (mode === 'refine' && !instruction.trim())) return;
    inFlight.current = true; setBusy(true); setError(''); setReview(null);
    const baseKey = dnaKey;
    try {
      const response = mode === 'refine' ? await endpoints.aiRefine(dna, instruction.trim()) : await endpoints.aiSuggest(section.key, dna);
      const candidates = mode === 'refine' ? [response.dna] : (response.options || []).map(option => ({ [section.key]: option }));
      const usable = candidates.filter(suggestion => previewAiChanges(dna, suggestion, sections, locks, fieldLocks).length);
      if (!usable.length) throw new Error('AI returned no changes for unlocked fields. Try another instruction or unlock a field.');
      if (mounted.current) setReview({ candidates: usable, index: 0, baseKey });
    } catch (failure) {
      if (mounted.current) setError(failure?.response?.data?.detail || failure.message || 'AI Assist could not prepare a suggestion.');
    } finally {
      inFlight.current = false; if (mounted.current) setBusy(false);
    }
  };
  const changes = review ? previewAiChanges(dna, review.candidates[review.index], sections, locks, fieldLocks) : [];
  const stale = review && review.baseKey !== dnaKey;
  const show = value => Array.isArray(value) ? value.join(', ') : String(value ?? 'Unset');
  return <details className="pane p-4" data-testid="character-preview-assist">
    <summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold text-amber-200">AI Assist · {provider || 'AI'}</summary>
    <p className="mt-2 text-xs text-zinc-400">Describe changes to this character, or ask for category ideas. Review and apply the suggestion, then update the preview. Locked fields stay fixed.</p>
    <label className="mt-3 block text-xs text-zinc-300">What would you like to change?
      <textarea aria-label="Character AI instruction" value={instruction} maxLength={20000} onChange={event => setInstruction(event.target.value)}
        placeholder="For example: silver hair, a tailored jacket, and warmer lighting"
        className="mt-2 min-h-24 w-full rounded-xl border hairline bg-elevated p-3 text-base text-zinc-100 sm:text-sm" />
    </label>
    <div className="mt-3 flex flex-wrap gap-2">
      <button type="button" onClick={() => request('refine')} disabled={disabled || busy || !instruction.trim()}
        className="min-h-11 rounded-lg bg-amber-400 px-4 text-xs font-semibold text-black disabled:opacity-40">{busy ? 'Preparing suggestions…' : 'Suggest character changes'}</button>
      <button type="button" onClick={() => request('category')} disabled={disabled || busy || !!locks[section.key]}
        className="min-h-11 rounded-lg border hairline px-4 text-xs text-amber-200 disabled:opacity-40">Ideas for {section.title}</button>
    </div>
    {error && <p role="alert" className="mt-3 text-xs text-rose-300">{error}</p>}
    {review && <div className="mt-3 space-y-3 rounded-xl border border-cyan-500/30 p-3">
      {review.candidates.length > 1 && <label className="block text-xs text-zinc-300">Suggestion
        <select aria-label="AI suggestion option" value={review.index} onChange={event => setReview(current => ({ ...current, index: Number(event.target.value) }))}
          className="mt-1 min-h-11 w-full rounded-lg border hairline bg-elevated px-3">
          {review.candidates.map((_, index) => <option key={index} value={index}>Option {index + 1}</option>)}
        </select>
      </label>}
      <p className="text-xs font-semibold text-cyan-200">Review {changes.length} proposed changes</p>
      <div className="max-h-56 space-y-2 overflow-y-auto text-xs text-zinc-300">
        {changes.map(change => <div key={`${change.section}.${change.field}`}>
          <span className="block text-zinc-500">{change.label}</span><span className="break-words">{show(change.previous)} → {show(change.value)}</span>
        </div>)}
      </div>
      {stale && <p className="text-xs text-amber-200">Character changed while reviewing. Request a fresh suggestion.</p>}
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={disabled || stale || !changes.length} onClick={() => { onApply(applyPreviewAiChanges(dna, changes, locks, fieldLocks)); setReview(null); }}
          className="min-h-11 rounded-lg bg-cyan-400 px-4 text-xs font-semibold text-black disabled:opacity-40">Apply AI changes</button>
        <button type="button" onClick={() => setReview(null)} className="min-h-11 rounded-lg border hairline px-4 text-xs text-zinc-300">Discard suggestion</button>
      </div>
    </div>}
  </details>;
}
