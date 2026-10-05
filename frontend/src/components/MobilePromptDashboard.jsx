import { WebPromptResearchOptions } from "./WebPromptResearch";
import { useEffect, useRef, useState } from 'react';
import { Search, X, ChevronUp, Settings2, Lock } from 'lucide-react';
import DnaSection from './DnaSection';
import { fieldGroups, selectedOptions, clearOption } from '@/lib/mobilePromptGrid';

const shortTitles = { identity: 'Base', physique: 'Body', wardrobe: 'Clothes' };

export default function MobilePromptDashboard({ sections, dna, sectionKey, onSection, onChange,
  locks = {}, fieldLocks = {}, onToggleFieldLock, subjects = [], activeSubjectId, onSubject,
  workflows = [], workflowId, onWorkflow, name, onName, onSave, saving, onReview, onAddSubject, onRemoveSubject, onRandomize, onClearAll, onToggleSectionLock }) {
  const [fieldKey, setFieldKey] = useState('');
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedOpen, setSelectedOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const scrollRef = useRef(null);
  const dialogRef = useRef(null);
  const selectedButtonRef = useRef(null);
  const section = sections.find(item => item.key === sectionKey) || sections[0];
  const groups = fieldGroups(section);
  const group = groups.find(item => item.key === fieldKey) || groups[0];
  const selected = selectedOptions(sections, dna);
  const locked = item => locks[item.section] || fieldLocks[item.section]?.[item.field];
  useEffect(() => { scrollRef.current?.scrollTo?.(0, 0); }, [section.key, group?.key, query]);
  useEffect(() => {
    if (!selectedOpen) return;
    const prior = document.activeElement;
    const escape = event => {
      if (event.key === 'Escape') setSelectedOpen(false);
      if (event.key !== 'Tab') return;
      const buttons = Array.from(dialogRef.current?.querySelectorAll('button:not(:disabled), input, select') || []);
      const first = buttons[0], last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('keydown', escape); (prior?.isConnected ? prior : selectedButtonRef.current)?.focus(); };
  }, [selectedOpen]);
  const changeCategory = key => { setFieldKey(''); setQuery(''); onSection(key); };
  const remove = item => {
    if (locked(item)) return;
    const source = sections.find(s => s.key === item.section);
    onChange(item.section, clearOption(source, item.field, dna[item.section] || {}, item.value));
  };
  const clearCurrent = () => {
    let value = { ...(dna[section.key] || {}) };
    selected.filter(item => item.section === section.key && !locked(item)).forEach(item => {
      value = clearOption(section, item.field, value, item.value);
    });
    onChange(section.key, value);
  };
  const searchGroups = query.trim() ? sections.flatMap(s => fieldGroups(s).filter(g => g.fields.some(f =>
    [...(f.options || []), ...(f.groups || []).flatMap(x => x.options || [])].some(opt => `${opt} ${f.optionLabels?.[opt] || ''}`.toLowerCase().includes(query.trim().toLowerCase()))
  )).map(g => ({ section: s, group: g }))) : [{ section, group }];
  return <section className="mobile-prompt-dashboard md:hidden" aria-label="Character selection dashboard" data-testid="mobile-prompt-dashboard">
    <div className="shrink-0 space-y-2 border-b border-zinc-800 pb-3">
      <div className="flex items-center gap-2">
        <h1 className="min-w-0 flex-1 truncate text-base font-semibold">{name || 'New character'}</h1>
        {subjects.length > 1 && <select aria-label="Active character" value={activeSubjectId} onChange={e => onSubject(e.target.value)} className="max-w-28 rounded-lg bg-zinc-900 px-2 py-2 text-xs">
          {subjects.map(s => <option key={s.id} value={s.id}>Subject {s.label}</option>)}
        </select>}
        <button type="button" aria-label="Search choices" aria-expanded={searchOpen} onClick={() => { setSearchOpen(!searchOpen); setQuery(''); }} className="grid h-10 w-10 place-items-center rounded-lg border border-zinc-800"><Search className="h-4 w-4" /></button>
        <button type="button" aria-label="Character settings" aria-expanded={toolsOpen} onClick={() => setToolsOpen(!toolsOpen)} className="grid h-10 w-10 place-items-center rounded-lg border border-zinc-800"><Settings2 className="h-4 w-4" /></button>
      </div>
      {toolsOpen && <div className="grid max-h-[30dvh] gap-2 overflow-y-auto rounded-xl bg-zinc-900 p-3">
        <label className="text-xs">Character name<input aria-label="Character name" value={name} onChange={e => onName(e.target.value)} className="mt-1 w-full rounded-lg bg-zinc-800 p-2" /></label>
        <label className="text-xs">Workflow<select aria-label="Workflow" value={workflowId} onChange={e => onWorkflow(e.target.value)} className="mt-1 w-full rounded-lg bg-zinc-800 p-2">
          {workflows.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select></label>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onAddSubject} disabled={subjects.length >= 4} className="rounded-lg border border-zinc-700 px-3 py-2 text-xs disabled:opacity-40">Add subject</button>
          {subjects.length > 1 && <button type="button" onClick={() => onRemoveSubject(activeSubjectId)} className="rounded-lg border border-zinc-700 px-3 py-2 text-xs">Remove subject</button>}
          <button type="button" onClick={onRandomize} className="rounded-lg border border-zinc-700 px-3 py-2 text-xs">Randomize person</button>
        </div>
        <button type="button" onClick={() => onToggleSectionLock(section.key)} className="rounded-lg border border-zinc-700 p-2 text-xs">{locks[section.key] ? 'Unlock' : 'Lock'} {section.title}</button>
        <details className="text-xs text-zinc-400"><summary className="cursor-pointer py-2">AI research options</summary><WebPromptResearchOptions /></details>
        <button type="button" onClick={onSave} disabled={saving} className="rounded-lg border border-cyan-700 p-2 text-xs text-cyan-100">{saving ? 'Saving…' : 'Save character'}</button>
      </div>}
      {searchOpen && <input autoFocus aria-label="Search all choices" type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search all choices…" className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm" />}
      <nav className="flex gap-2 overflow-x-auto pb-1" aria-label="Main categories">
        {sections.map(s => <button key={s.key} type="button" aria-pressed={s.key === section.key} onClick={() => changeCategory(s.key)} className={`min-h-10 shrink-0 rounded-lg px-3 text-xs font-semibold ${s.key === section.key ? 'bg-cyan-400 text-zinc-950' : 'bg-zinc-900 text-zinc-400'}`}>{shortTitles[s.key] || s.title}</button>)}
      </nav>
      {!query.trim() && <nav className="flex gap-2 overflow-x-auto pb-1" aria-label="Subcategories">
        {groups.map(g => <button key={g.key} type="button" aria-pressed={g.key === group?.key} onClick={() => setFieldKey(g.key)} className={`min-h-10 shrink-0 rounded-full border px-3 text-xs ${g.key === group?.key ? 'border-cyan-400 text-cyan-100' : 'border-zinc-800 text-zinc-400'}`}>{g.label}</button>)}
      </nav>}
    </div>
    <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-3" data-testid="mobile-choice-scroll">
      {searchGroups.map(({ section: s, group: g }) => g && <div key={`${s.key}-${g.key}`} className="mb-4">
        {query.trim() && <div className="mb-2 text-xs font-semibold text-cyan-200">{s.title} · {g.label}</div>}
        <DnaSection section={{ ...s, fields: g.fields }} value={dna[s.key] || {}}
          onChange={value => onChange(s.key, value)} locked={!!locks[s.key]} fieldLocks={fieldLocks[s.key] || {}}
          onToggleFieldLock={key => onToggleFieldLock(s.key, key)} tileMode tileQuery={query} />
      </div>)}
      {!searchGroups.length && <p className="py-8 text-center text-sm text-zinc-500">No choices match “{query}”.</p>}
    </div>
    <footer className="shrink-0 space-y-2 border-t border-zinc-800 bg-[#111017] pt-2">
      <button ref={selectedButtonRef} type="button" onClick={() => setSelectedOpen(true)} className="flex min-h-10 w-full items-center justify-center gap-2 rounded-full border border-zinc-700 text-xs text-zinc-300"><ChevronUp className="h-4 w-4" /> View selected ({selected.length})</button>
      <div className="flex gap-2">
        <button type="button" onClick={clearCurrent} disabled={!!locks[section.key]} className="min-h-11 rounded-xl border border-zinc-700 px-3 text-xs disabled:opacity-40">Clear category</button>
        <button type="button" onClick={onReview} className="min-h-11 flex-1 rounded-xl bg-cyan-400 px-3 text-sm font-semibold text-zinc-950">Review & generate</button>
      </div>
    </footer>
    {selectedOpen && <div className="fixed inset-0 z-50 flex items-end bg-black/70" onClick={() => setSelectedOpen(false)}>
      <section ref={dialogRef} role="dialog" aria-modal="true" aria-label="Selected choices" onClick={e => e.stopPropagation()} onKeyDown={e => { if (e.key === 'Escape') setSelectedOpen(false); }} className="max-h-[75dvh] w-full overflow-y-auto rounded-t-2xl border border-zinc-700 bg-[#16161f] p-4 pb-8">
        <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">Selected choices ({selected.length})</h2><button autoFocus type="button" aria-label="Close selected choices" onClick={() => setSelectedOpen(false)} className="grid h-11 w-11 place-items-center"><X className="h-5 w-5" /></button></div>
        <button type="button" onClick={onClearAll} disabled={!selected.some(item => !locked(item))} className="mb-3 rounded-lg border border-zinc-700 px-3 py-2 text-xs disabled:opacity-40">Clear all unlocked choices</button>
        {!selected.length && <p className="py-6 text-sm text-zinc-500">No choices selected.</p>}
        {selected.map(item => <div key={`${item.section}-${item.field}-${item.value}`} className="flex items-center gap-2 border-b border-zinc-800 py-2 text-xs"><span className="min-w-0 flex-1"><span className="text-zinc-500">{sections.find(s => s.key === item.section)?.title} · </span>{item.label}</span><button type="button" aria-label={`Remove ${item.label}`} disabled={!!locked(item)} onClick={() => remove(item)} className="grid h-11 w-11 shrink-0 place-items-center disabled:opacity-40">{locked(item) ? <Lock className="h-4 w-4" /> : <X className="h-4 w-4" />}</button></div>)}
      </section>
    </div>}
  </section>;
}
