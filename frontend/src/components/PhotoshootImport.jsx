import { useMemo, useRef, useState } from 'react';
import { parsePhotoshootImport, mergePhotoshootImport, PHOTOSHOOT_IMPORT_EXAMPLE } from '@/lib/bulkPhotoshootImport';

export default function PhotoshootImport({ presets, onSave, disabled }) {
  const [source, setSource] = useState('');
  const [review, setReview] = useState(null);
  const [mode, setMode] = useState('skip');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const inFlight = useRef(false);
  const inputVersion = useRef(0);
  const changeSource = value => { inputVersion.current += 1; setSource(value); setReview(null); setError(''); setMessage(''); };
  const merged = useMemo(() => {
    if (!review) return null;
    try { return mergePhotoshootImport(presets, review, mode); } catch (failure) { return { error: failure.message }; }
  }, [presets, review, mode]);
  const saveCount = (merged?.added?.length || 0) + (merged?.updated?.length || 0);
  const loadFile = async event => {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file) return;
    const version = ++inputVersion.current;
    setReview(null); setError(''); setMessage('');
    try {
      if (file.size > 10 * 1024 * 1024) throw new Error('Choose a JSON file under 10 MB.');
      const value = await file.text();
      if (version === inputVersion.current) changeSource(value);
    } catch (failure) { if (version === inputVersion.current) setError(failure.message || 'Could not read this file.'); }
  };
  const save = async () => {
    if (inFlight.current || !saveCount || merged.error || disabled) return;
    inFlight.current = true; setSaving(true); setError(''); setMessage('');
    try {
      const result = await onSave(review, mode);
      setSource(''); setReview(null);
      setMessage(`Added ${result.added.length} shoots · updated ${result.updated.length}${result.skipped.length ? ` · skipped ${result.skipped.length}` : ''}. Find them in My saved shoots and the director’s Shoot style menu.`);
    } catch (failure) { setError(typeof failure?.response?.data?.detail === 'string' ? failure.response.data.detail : failure.message || 'Could not import the shoots. Please retry.'); }
    finally { inFlight.current = false; setSaving(false); }
  };
  return <details className="mt-3 rounded-xl border hairline p-3" data-testid="photoshoot-import">
    <summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold text-cyan-200">Bulk add / update shoots (JSON)</summary>
    <p className="mt-2 text-xs text-zinc-400">Paste several shoots as JSON or upload a JSON file. Each shoot needs a label and a sequence of shot objects with titles. Review before saving. Download the Library to inspect or edit existing shoots. Keep a shoot’s key unchanged to update it; use a new key to add a separate shoot. Built-in edits are stored as overrides. Up to 100 saved shoots and overrides, with 20 shots each.</p>
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <button type="button" disabled={saving} onClick={() => changeSource(PHOTOSHOOT_IMPORT_EXAMPLE)} className="min-h-11 rounded-lg border hairline px-3 text-xs text-zinc-300">Load example</button>
      <label className="min-h-11 rounded-lg border hairline px-3 py-3 text-xs text-zinc-300">Upload JSON
        <input aria-label="Upload photoshoot JSON" type="file" accept=".json,application/json" disabled={saving} onChange={loadFile} className="mt-2 block max-w-full text-xs" />
      </label>
    </div>
    <label className="mt-3 block text-xs text-zinc-300">Shoot JSON
      <textarea aria-label="Bulk photoshoot JSON" value={source} disabled={saving} maxLength={10 * 1024 * 1024} onChange={event => changeSource(event.target.value)}
        placeholder='[{ "label": "My shoot", "sequence": [{ "title": "Hero", "framing": "full body" }] }]'
        className="mt-2 min-h-48 w-full rounded-lg border hairline bg-elevated p-3 font-mono text-sm text-zinc-100" />
    </label>
    <button type="button" disabled={saving || disabled || !source.trim()} onClick={() => { try { setReview(parsePhotoshootImport(source)); setError(''); setMessage(''); } catch (failure) { setReview(null); setError(failure.message); } }}
      className="mt-3 min-h-11 rounded-lg border border-cyan-500/40 px-4 text-xs font-semibold text-cyan-200 disabled:opacity-40">Review import</button>
    {review && <div className="mt-3 space-y-3 rounded-lg border hairline p-3">
      <label className="block text-xs text-zinc-300">When a shoot key already exists
        <select aria-label="Photoshoot import duplicates" value={mode} disabled={saving} onChange={event => { setMode(event.target.value); setError(''); }} className="mt-2 min-h-11 w-full rounded-lg border hairline bg-elevated px-3 text-sm">
          <option value="skip">Skip existing keys</option><option value="copy">Add as new copies</option><option value="update">Update matching shoots</option>
        </select>
      </label>
      <div className="max-h-60 space-y-2 overflow-y-auto text-xs text-zinc-300">
        {review.map((preset, index) => <div key={preset.key} className="rounded-lg border hairline p-2">
          <span className="font-semibold">{preset.label}</span> · {preset.category} · {preset.sequence.length} shots
          <span className="block text-zinc-500">{preset.key} · {merged?.actions?.[index] || 'Review import size below'}</span>
        </div>)}
      </div>
      {merged?.error ? <p role="alert" className="text-xs text-rose-300">{merged.error}</p> : <p className="text-xs text-zinc-400">{merged?.added.length} shoots to add · {merged?.updated.length} to update · {merged?.skipped.length} to skip</p>}
      <button type="button" disabled={saving || disabled || !!merged?.error || !saveCount} onClick={save}
        className="min-h-11 rounded-lg bg-emerald-400 px-4 text-xs font-bold text-black disabled:opacity-40">{saving ? 'Importing…' : `Save ${saveCount} ${saveCount === 1 ? 'shoot' : 'shoots'}`}</button>
    </div>}
    {error && <p role="alert" className="mt-3 text-xs text-rose-300">{error}</p>}
    {message && <p role="status" className="mt-3 text-xs text-emerald-200">{message}</p>}
  </details>;
}
