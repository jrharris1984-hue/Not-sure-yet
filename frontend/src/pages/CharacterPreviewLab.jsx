import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { endpoints } from '@/lib/api';
import { SECTIONS, DEFAULT_DNA, randomizeSection, resetSection } from '@/lib/dna';
import { catalogSections, usePromptCatalog } from '@/lib/promptCatalog';
import { resolveBuilderControls } from '@/lib/builderControlResolution';
import { analyzePromptQuality } from '@/lib/promptQuality';
import { characterPreviewPayload, characterPreviewRequestKey, validPreviewSeed, nextPreviewSeed, CHARACTER_PREVIEW_SEED, CHARACTER_PREVIEW_OPTIONS_KEY, CHARACTER_CAPTURE_JOB_KEY, CHARACTER_PREVIEW_DRAFT_KEY } from '@/lib/characterPreview';
import { builderCatalogWorkflows } from '@/lib/workflowCatalog';
import { previewWorkflows } from '@/lib/characterPreview';
import useCharacterPreview from '@/hooks/useCharacterPreview';
import DnaSection from '@/components/DnaSection';
import UniversalLoraPicker from '@/components/UniversalLoraPicker';
import CharacterPreviewPanel from '@/components/CharacterPreviewPanel';
import CharacterPreviewAssist from '@/components/CharacterPreviewAssist';
import { mediaUrl } from '@/lib/media';

const newDna = () => JSON.parse(JSON.stringify(DEFAULT_DNA));
const readDraft = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(CHARACTER_PREVIEW_DRAFT_KEY));
    return saved?.identity && typeof saved.identity === 'object' ? { ...newDna(), ...saved } : newDna();
  } catch { return newDna(); }
};

const readOptions = () => {
  try { return JSON.parse(localStorage.getItem(CHARACTER_PREVIEW_OPTIONS_KEY)) || {}; } catch { return {}; }
};

export default function CharacterPreviewLab() {
  const [initialOptions] = useState(readOptions);
  const [seed, setSeed] = useState(validPreviewSeed(initialOptions.seed) ? Number(initialOptions.seed) : CHARACTER_PREVIEW_SEED);
  const [seedLocked, setSeedLocked] = useState(initialOptions.seedLocked !== false);
  const [name, setName] = useState(typeof initialOptions.name === 'string' ? initialOptions.name : '');
  const [characterId, setCharacterId] = useState(typeof initialOptions.characterId === 'string' ? initialOptions.characterId : '');
  const [savedKey, setSavedKey] = useState(initialOptions.savedKey || '');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [captureTier, setCaptureTier] = useState(initialOptions.captureTier === 'balanced' ? 'balanced' : 'quality');
  const saveInFlight = useRef(false);
  const actionInFlight = useRef(false);
  const mounted = useRef(false);
  const qc = useQueryClient();
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const [dna, setDna] = useState(readDraft);
  const [sectionKey, setSectionKey] = useState('identity');
  const [workflowId, setWorkflowId] = useState(initialOptions.workflowId || '');
  const [lora, setLora] = useState(initialOptions.lora || { name: '', strength: 0.8, triggerWords: [] });
  const [locks, setLocks] = useState(initialOptions.locks || {});
  const [fieldLocks, setFieldLocks] = useState(initialOptions.fieldLocks || {});
  const [collapsed, setCollapsed] = useState(false);
  const promptCatalog = usePromptCatalog();
  const { data: workflows = [], isLoading, error: workflowError } = useQuery({ queryKey: ['workflows'], queryFn: endpoints.listWorkflows });
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: endpoints.settings });
  const available = previewWorkflows(builderCatalogWorkflows(workflows, settings?.default_workflow_id, workflowId, settings?.builder_hidden_workflow_ids));
  const workflow = available.find(item => item.id === workflowId) || available.find(item => item.id === settings?.default_workflow_id) || available[0];
  const sections = useMemo(() => catalogSections(SECTIONS, promptCatalog).filter(section => section.key !== 'scenario'), [promptCatalog]);
  const section = sections.find(item => item.key === sectionKey) || sections[0];
  const payload = useMemo(() => workflow && validPreviewSeed(seed) ? characterPreviewPayload({ dna, workflow, promptCatalog, lora, locks, fieldLocks, seed }) : null,
    [dna, workflow, promptCatalog, lora, locks, fieldLocks, seed]);
  const requestKey = characterPreviewRequestKey(payload, workflow);
  const preview = useCharacterPreview(requestKey);
  const capturePayload = useMemo(() => payload ? characterPreviewPayload({ dna, workflow, promptCatalog, lora, locks, fieldLocks, seed, capture: true, qualityTier: captureTier }) : null,
    [payload, dna, workflow, promptCatalog, lora, locks, fieldLocks, seed, captureTier]);
  const capture = useCharacterPreview(characterPreviewRequestKey(capturePayload, workflow), CHARACTER_CAPTURE_JOB_KEY, 'Capture');
  const characterPayload = useMemo(() => ({ name: name.trim() || 'Lab character', dna, locks, field_locks: fieldLocks,
    subjects: [{ id: 'preview-subject-a', label: 'A', dna, field_locks: fieldLocks }], active_subject_id: 'preview-subject-a',
    prompt_positive: payload?.prompt_positive || '', prompt_negative: payload?.prompt_negative || '' }), [name, dna, locks, fieldLocks, payload]);
  const saveKey = JSON.stringify(characterPayload);
  const saveCharacter = async () => {
    if (saveInFlight.current) return;
    saveInFlight.current = true; setSaving(true); setSaveError('');
    const submittedKey = saveKey;
    try {
      const saved = characterId ? await endpoints.updateCharacter(characterId, characterPayload) : await endpoints.createCharacter(characterPayload);
      if (!saved?.id) throw new Error('The character save did not return an identifier.');
      qc.invalidateQueries({ queryKey: ['characters'] });
      if (mounted.current) { setCharacterId(saved.id); setSavedKey(submittedKey); }
    } catch (failure) {
      if (mounted.current) setSaveError(failure?.response?.data?.detail || failure.message || 'Character could not be saved.');
    } finally { saveInFlight.current = false; if (mounted.current) setSaving(false); }
  };
  const updatePreview = async () => {
    if (!payload || preview.busy || capture.busy || actionInFlight.current) return;
    actionInFlight.current = true;
    const usedSeed = seedLocked ? Number(seed) : nextPreviewSeed(seed);
    const submitted = { ...payload, seed: usedSeed };
    setSeed(usedSeed);
    try { await preview.update({ ...submitted, ...(characterId ? { character_id: characterId } : {}) }, characterPreviewRequestKey(submitted, workflow)); }
    finally { actionInFlight.current = false; }
  };
  const captureFullSize = async () => {
    if (!capturePayload || !preview.image || preview.stale || preview.busy || capture.busy || actionInFlight.current) return;
    actionInFlight.current = true;
    const submitted = { ...capturePayload, ...(characterId ? { character_id: characterId } : {}),
      ...(preview.imageRender?.id ? { parent_render_id: preview.imageRender.id } : {}) };
    try { await capture.update(submitted, characterPreviewRequestKey(capturePayload, workflow)); }
    finally { actionInFlight.current = false; }
  };
  useEffect(() => {
    if (capture.render?.status === 'done') {
      qc.invalidateQueries({ queryKey: ['renders'] }); qc.invalidateQueries({ queryKey: ['characters'] });
    }
  }, [capture.render?.id, capture.render?.status, qc]);
  useEffect(() => {
    try { localStorage.setItem(CHARACTER_PREVIEW_OPTIONS_KEY, JSON.stringify({ seed, seedLocked, name, characterId, savedKey, workflowId: workflow?.id || workflowId, lora, locks, fieldLocks, captureTier })); } catch { /* Storage is optional. */ }
  }, [seed, seedLocked, name, characterId, savedKey, workflow, workflowId, lora, locks, fieldLocks, captureTier]);
  const analysis = payload ? analyzePromptQuality({ positive: payload.prompt_positive, dna, workflow }) : null;
  const reason = workflowError ? 'Could not load workflows. Refresh the page to retry.'
    : isLoading ? 'Loading your workflows…'
      : !workflow ? 'Add a still-image workflow in Settings to try the preview.' : !validPreviewSeed(seed) ? 'Seed must be a whole number from 0 to 2147483646.' : analysis?.blockers?.[0]?.message || '';
  useEffect(() => {
    try { localStorage.setItem(CHARACTER_PREVIEW_DRAFT_KEY, JSON.stringify(dna)); } catch { /* Draft saving is optional. */ }
  }, [dna]);
  const setSection = value => setDna(current => ({ ...current, [section.key]: value }));

  return <div className="character-preview-lab mx-auto max-w-7xl space-y-5 p-4 sm:p-6" data-testid="character-preview-lab">
    <header>
      <Link to="/" className="text-sm text-cyan-300">← Home</Link>
      <div className="section-label mt-4">Experimental studio</div>
      <h1 className="mt-1 font-display text-3xl font-bold">Character Preview Lab</h1>
      <p className="mt-2 max-w-2xl text-sm text-zinc-400">Build one character and test small AI previews before a full render. This lab keeps its own draft; your regular character editor stays separate.</p>
    </header>
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-4">
        <section className="pane space-y-3 p-4">
          <label className="block text-xs text-zinc-300">Preview workflow
            <select aria-label="Preview workflow" value={workflow?.id || ''} disabled={isLoading || preview.busy}
              onChange={event => { setWorkflowId(event.target.value); setLora({ name: '', strength: 0.8, triggerWords: [] }); }}
              className="mt-2 min-h-11 w-full rounded-xl border hairline bg-elevated px-3 text-base sm:text-sm">
              {!available.length && <option value="">No still-image workflow available</option>}
              {available.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <button type="button" className="min-h-11 rounded-lg border hairline px-3 text-xs text-zinc-300"
            disabled={saving} onClick={() => { setDna(newDna()); setLocks({}); setFieldLocks({}); setCharacterId(''); setName(''); setSavedKey(''); setSaveError(''); }}>Reset lab character</button>
          {workflow && <details><summary className="min-h-11 cursor-pointer py-3 text-xs text-zinc-300">Optional preview LoRA</summary>
            <UniversalLoraPicker key={workflow.id} workflow={workflow} value={lora} onChange={setLora} slotLabel="Preview LoRA" />
          </details>}
        </section>
        <CharacterPreviewAssist dna={dna} onApply={setDna} sections={sections} section={section} locks={locks} fieldLocks={fieldLocks}
          provider={settings?.ai_provider === 'ollama' ? 'Ollama' : ['openrouter', 'venice'].includes(settings?.ai_provider) ? 'Venice' : 'AI'} disabled={saving || preview.busy || capture.busy} />
        <label className="block text-xs text-zinc-300">Character category
          <select aria-label="Character category" value={section.key} onChange={event => { setSectionKey(event.target.value); setCollapsed(false); }}
            className="mt-2 min-h-11 w-full rounded-xl border hairline bg-elevated px-3 text-base sm:text-sm">
            {sections.map(item => <option key={item.key} value={item.key}>{item.title}</option>)}
          </select>
        </label>
        <DnaSection key={section.key} section={section} value={dna[section.key] || {}} onChange={setSection}
          locked={!!locks[section.key]} onToggleLock={() => setLocks(current => ({ ...current, [section.key]: !current[section.key] }))}
          fieldLocks={fieldLocks[section.key] || {}} onToggleFieldLock={field => setFieldLocks(current => ({ ...current,
            [section.key]: { ...current[section.key], [field]: !current[section.key]?.[field] } }))}
          collapsed={collapsed} onToggleCollapsed={() => setCollapsed(value => !value)}
          onRandomize={() => { if (!locks[section.key]) setSection(section.key.startsWith('custom_')
            ? Object.fromEntries(section.fields.map(field => [field.key, fieldLocks[section.key]?.[field.key]
              ? dna[section.key]?.[field.key] : field.type === 'chips_multi' ? []
                : field.options?.[Math.floor(Math.random() * field.options.length)] || '']))
            : randomizeSection(section.key, dna[section.key], fieldLocks[section.key])); }}
          onReset={() => { if (!locks[section.key]) setSection(resetSection(section.key)); }}
          controlNotes={resolveBuilderControls(dna).notes.filter(note => note.section === section.key).map(note => note.text)} />
        {payload && <details className="pane p-4"><summary className="min-h-11 cursor-pointer text-xs text-zinc-300">Preview prompt</summary>
          <p className="mt-3 whitespace-pre-wrap text-xs text-zinc-400">{payload.prompt_positive}</p>
        </details>}
      </div>
      <aside className="order-first lg:order-last lg:sticky lg:top-20">
        <CharacterPreviewPanel preview={preview} onUpdate={updatePreview} disabled={!!reason || capture.busy}
          reason={reason} width={payload?.width} height={payload?.height} seed={seed} seedLocked={seedLocked}
          onSeedChange={setSeed} onToggleSeedLock={() => setSeedLocked(value => !value)} onNewSeed={() => setSeed(nextPreviewSeed(seed))} controlsDisabled={preview.busy || capture.busy} />
        <details className="pane mt-4 p-4" aria-label="Save character and capture">
          <summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold text-emerald-200">Save character & Gallery capture{capture.busy ? ' · Capturing…' : ''}</summary>
          <div className="mt-3 space-y-3">
          <label className="block text-xs text-zinc-300">Character name
            <input aria-label="Lab character name" value={name} maxLength={120} placeholder="Lab character" onChange={event => setName(event.target.value)}
              className="mt-2 min-h-11 w-full rounded-xl border hairline bg-elevated px-3 text-base sm:text-sm" />
          </label>
          <button type="button" onClick={saveCharacter} disabled={saving || !payload}
            className="min-h-11 w-full rounded-xl border border-emerald-500/40 px-4 text-sm font-semibold text-emerald-200 disabled:opacity-40">
            {saving ? 'Saving character…' : characterId ? 'Save character changes' : 'Save character'}
          </button>
          {characterId && <p className="text-xs text-zinc-400">{savedKey === saveKey ? 'Character saved. ' : 'Character has unsaved changes. '}<Link to={`/character/${characterId}`} className="text-cyan-300 underline">Open saved character</Link></p>}
          {saveError && <p role="alert" className="text-xs text-rose-300">{saveError}</p>}
          <div className="border-t hairline pt-3">
            <label className="block text-xs text-zinc-300">Full-size capture
              <select aria-label="Capture quality" value={captureTier} disabled={capture.busy} onChange={event => setCaptureTier(event.target.value)}
                className="mt-2 min-h-11 w-full rounded-xl border hairline bg-elevated px-3 text-sm">
                <option value="balanced">Balanced</option><option value="quality">Quality</option>
              </select>
            </label>
            <p className="mt-2 text-xs text-zinc-400">{capturePayload ? `${capturePayload.width} × ${capturePayload.height} · ` : ''}Uses the preview’s seed and current selections. The larger render may vary. Completed captures appear in Gallery.</p>
            <button type="button" onClick={captureFullSize} disabled={!!reason || saving || !preview.image || preview.stale || preview.busy || capture.busy}
              className="mt-3 min-h-11 w-full rounded-xl bg-emerald-400 px-4 text-sm font-semibold text-black disabled:opacity-40">
              {capture.busy ? 'Capturing full size…' : 'Capture full size to Gallery'}
            </button>
            {preview.stale && <p className="mt-2 text-xs text-amber-200">Update the preview before capturing these changes.</p>}
            <div role="status" className="mt-2 text-xs text-zinc-400">{capture.busy ? `Capture ${capture.render?.status || 'submitting'}${capture.render?.queue_position ? ` · queue position ${capture.render.queue_position}` : ''}` : capture.image ? `Full-size capture completed.${capture.stale ? ' Earlier selections.' : ''}` : ''}</div>
            {capture.error && <p role="alert" className="mt-2 text-xs text-rose-300">{capture.error}</p>}
            {capture.image && <a href={mediaUrl(capture.image)} target="_blank" rel="noreferrer" className="mt-3 block text-xs text-cyan-300">
              <img src={mediaUrl(capture.image)} alt="Full-size character capture" className="max-h-40 w-full object-contain" />Open full-size capture
            </a>}
            <Link to="/gallery" className="mt-3 inline-block min-h-11 py-3 text-xs text-cyan-300">Open Gallery →</Link>
          </div>
          </div>
        </details>
      </aside>
    </div>
  </div>;
}
