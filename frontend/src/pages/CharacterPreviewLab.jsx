import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { endpoints } from '@/lib/api';
import { SECTIONS, DEFAULT_DNA, randomizeSection, resetSection } from '@/lib/dna';
import { catalogSections, usePromptCatalog } from '@/lib/promptCatalog';
import { resolveBuilderControls } from '@/lib/builderControlResolution';
import { analyzePromptQuality } from '@/lib/promptQuality';
import { characterPreviewPayload, CHARACTER_PREVIEW_DRAFT_KEY } from '@/lib/characterPreview';
import { builderCatalogWorkflows } from '@/lib/workflowCatalog';
import { previewWorkflows } from '@/lib/characterPreview';
import useCharacterPreview from '@/hooks/useCharacterPreview';
import DnaSection from '@/components/DnaSection';
import UniversalLoraPicker from '@/components/UniversalLoraPicker';
import CharacterPreviewPanel from '@/components/CharacterPreviewPanel';

const newDna = () => JSON.parse(JSON.stringify(DEFAULT_DNA));
const readDraft = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(CHARACTER_PREVIEW_DRAFT_KEY));
    return saved?.identity && typeof saved.identity === 'object' ? { ...newDna(), ...saved } : newDna();
  } catch { return newDna(); }
};

export default function CharacterPreviewLab() {
  const [dna, setDna] = useState(readDraft);
  const [sectionKey, setSectionKey] = useState('identity');
  const [workflowId, setWorkflowId] = useState('');
  const [lora, setLora] = useState({ name: '', strength: 0.8, triggerWords: [] });
  const [locks, setLocks] = useState({});
  const [fieldLocks, setFieldLocks] = useState({});
  const [collapsed, setCollapsed] = useState(false);
  const promptCatalog = usePromptCatalog();
  const { data: workflows = [], isLoading, error: workflowError } = useQuery({ queryKey: ['workflows'], queryFn: endpoints.listWorkflows });
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: endpoints.settings });
  const available = previewWorkflows(builderCatalogWorkflows(workflows, settings?.default_workflow_id, workflowId, settings?.builder_hidden_workflow_ids));
  const workflow = available.find(item => item.id === workflowId) || available.find(item => item.id === settings?.default_workflow_id) || available[0];
  const sections = useMemo(() => catalogSections(SECTIONS, promptCatalog).filter(section => section.key !== 'scenario'), [promptCatalog]);
  const section = sections.find(item => item.key === sectionKey) || sections[0];
  const payload = useMemo(() => workflow ? characterPreviewPayload({ dna, workflow, promptCatalog, lora, locks, fieldLocks }) : null,
    [dna, workflow, promptCatalog, lora, locks, fieldLocks]);
  const requestKey = JSON.stringify([payload, workflow?.json_str]);
  const preview = useCharacterPreview(requestKey);
  const analysis = payload ? analyzePromptQuality({ positive: payload.prompt_positive, dna, workflow }) : null;
  const reason = workflowError ? 'Could not load workflows. Refresh the page to retry.'
    : isLoading ? 'Loading your workflows…'
      : !workflow ? 'Add a still-image workflow in Settings to try the preview.' : analysis?.blockers?.[0]?.message || '';
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
            onClick={() => { setDna(newDna()); setLocks({}); setFieldLocks({}); }}>Reset lab character</button>
          {workflow && <details><summary className="min-h-11 cursor-pointer py-3 text-xs text-zinc-300">Optional preview LoRA</summary>
            <UniversalLoraPicker key={workflow.id} workflow={workflow} value={lora} onChange={setLora} slotLabel="Preview LoRA" />
          </details>}
        </section>
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
        <CharacterPreviewPanel preview={preview} onUpdate={() => payload && preview.update(payload)} disabled={!!reason}
          reason={reason} width={payload?.width} height={payload?.height} />
      </aside>
    </div>
  </div>;
}
