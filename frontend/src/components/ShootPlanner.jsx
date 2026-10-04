import { useEffect, useRef, useState } from 'react';
import { endpoints } from '@/lib/api';
import { SHOT_CONTROLS, SHOT_CATALOG } from '@/lib/shootPlanner';

export default function ShootPlanner({ characterId, workflow, count, lockScenario, appliedFrames, onApply }) {
  const [instruction, setInstruction] = useState('');
  const [draft, setDraft] = useState(null);
  const [selected, setSelected] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const contextKey = `${characterId}|${workflow?.id}|${count}|${lockScenario}`;
  const liveContext = useRef(contextKey);
  liveContext.current = contextKey;
  useEffect(() => { setDraft(null); setSelected([]); setWarnings([]); setError(''); }, [contextKey]);
  const [requestKey, setRequestKey] = useState('');
  const currentDraft = draft || appliedFrames;
  const compatible = workflow?.kind === 'image' || ['txt2img', 'text_to_image'].includes(workflow?.kind);
  const generate = async () => {
    setBusy(true); setError(''); setRequestKey(contextKey);
    try {
      const indexes = selected.length && currentDraft ? selected : Array.from({ length: count }, (_, i) => i);
      const result = await endpoints.aiShootPlan({ character_id: characterId, workflow_id: workflow.id,
        instruction: selected.length ? `Revise only these selected shots: ${instruction}` : instruction,
        count: indexes.length, shot_numbers: indexes.map(index => index + 1),
        lock_scenario: lockScenario, catalog: SHOT_CATALOG,
        current_frames: currentDraft ? indexes.map(i => currentDraft[i]) : [],
      });
      if (liveContext.current !== contextKey) return;
      const next = currentDraft ? currentDraft.map(frame => ({ ...frame })) : Array.from({ length: count }, () => ({}));
      indexes.forEach((index, i) => { next[index] = result.frames[i]; });
      setDraft(next); setWarnings(result.warnings || []);
    } catch (e) { if (liveContext.current !== contextKey) return; setError(e?.response?.data?.detail || e.message || 'Could not plan the shoot. Try again.'); }
    finally { setBusy(false); }
  };
  // A response produced for another workflow/count/location setting cannot be applied.
  const stale = draft && requestKey !== contextKey;
  const edit = (index, key, value) => {
    const next = currentDraft.map(frame => ({ ...frame }));
    next[index][key] = value; setDraft(next); setRequestKey(contextKey);
  };
  return <section className="pane p-4 sm:p-6 space-y-4" data-testid="shoot-ai-planner">
    <div><div className="section-label">Plan my shoot with AI</div>
      <p className="text-xs text-zinc-400 mt-1">Describe the shoot, review the shot cards, then apply. Uses the prompt assistant selected in Settings. Planning does not render images.</p></div>
    <label className="block text-sm">Shoot brief or changes
      <textarea value={instruction} onChange={e => setInstruction(e.target.value)} maxLength={3000} rows={3}
        placeholder="Fashion shots on a staircase, warm lighting, varied full-body poses. Keep the character and outfit."
        className="mt-2 w-full bg-elevated border border-hairline rounded-lg p-3 text-sm" /></label>
    {!compatible && <p className="text-xs text-amber-200">Choose a text-to-image workflow to plan a photo shoot.</p>}
    <p className="text-xs text-zinc-400">{lockScenario ? 'Location is locked; AI keeps the saved setting.' : 'Location changes are allowed.'} Appearance and subject count stay saved. Empty choices keep the saved setting; outfit changes apply to every subject.</p>
    <button type="button" onClick={generate} disabled={busy || !compatible || !instruction.trim()}
      className="chip disabled:opacity-40">{busy ? 'Planning…' : selected.length ? `Revise ${selected.length} selected shots` : currentDraft ? 'Revise whole plan' : `Draft ${count} shots`}</button>
    {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
    {warnings.map(warning => <p key={warning} className="text-xs text-amber-200">{warning}</p>)}
    {currentDraft && !stale && <>
      <div className="grid gap-3 sm:grid-cols-2 max-h-[600px] overflow-y-auto">
        {currentDraft.map((shot, index) => <div key={index} className="rounded-lg border border-hairline p-3 space-y-2">
          <label className="flex gap-2 items-center text-sm font-semibold"><input type="checkbox" checked={selected.includes(index)} disabled={busy}
            onChange={e => setSelected(cur => e.target.checked ? [...cur, index] : cur.filter(i => i !== index))} />Shot {index + 1}</label>
          {SHOT_CONTROLS.filter(([, , section]) => section !== 'scene' || !lockScenario).map(([key, label]) => <label key={key} className="block text-xs text-zinc-400">{label}
            {key === 'background' ? <input value={shot[key] || ''} maxLength={500} disabled={busy} onChange={e => edit(index, key, e.target.value)} className="w-full mt-1 bg-elevated rounded border border-hairline p-2" />
              : <select value={shot[key] || ''} disabled={busy} onChange={e => edit(index, key, e.target.value)} className="w-full mt-1 bg-elevated rounded border border-hairline p-2">
                <option value="">Keep saved setting</option>{SHOT_CATALOG[key].map(value => <option key={value} value={value}>{value}</option>)}
              </select>}
          </label>)}
        </div>)}
      </div>
      <div className="flex flex-wrap gap-2"><button type="button" disabled={busy} className="chip active" onClick={() => onApply(currentDraft)}>Apply reviewed plan</button>
        <button type="button" disabled={busy} className="chip" onClick={() => { setDraft(null); setWarnings([]); setSelected([]); }}>Discard draft</button>
      </div>
      <p className="text-xs text-zinc-400">Edits take effect after Apply reviewed plan. Start shoot queues the applied plan.</p>
    </>}
  </section>;
}
