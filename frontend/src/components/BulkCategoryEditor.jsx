import {useRef, useState} from 'react';
import {CATEGORY_CHOICE_TYPES, exportCategoryBatch, importCategoryBatch} from '@/lib/bulkCatalogCategory';
import {validateCatalogDraft} from '@/lib/promptCatalog';
const inputClass = 'w-full rounded-lg border hairline bg-elevated px-3 py-2 text-sm';
const buttonClass = 'rounded-lg border hairline px-3 py-2 text-sm text-cyan-200 disabled:opacity-40';
const wording = [['keywords', 'Detailed prompt'], ['short', 'Compact prompt'], ['short_tags', 'Compact tags']];

export default function BulkCategoryEditor({section, getKeywords, onApply}) {
  const [working, setWorking] = useState(null), [source, setSource] = useState('');
  const [filter, setFilter] = useState(''), [error, setError] = useState('');
  const [json, setJson] = useState(''), [showJson, setShowJson] = useState(false);
  const fileInput = useRef(null);
  const updateField = (key, patch) => setWorking(current => ({...current, fields: current.fields.map(field => field.key === key ? {...field, ...patch} : field)}));
  const updateChoice = (field, value, key, text) => updateField(field.key, {options: field.options.map(option => option.value === value ? {...option, [key]: text} : option)});
  const batchText = () => JSON.stringify(exportCategoryBatch(working, getKeywords), null, 2);
  const stageJson = text => {
    try {setWorking(importCategoryBatch(text, working)); setError(''); setShowJson(false);}
    catch(err) {setError(`Could not import category: ${err.message}`);}
  };
  if (!working) return <button type="button" className={buttonClass} onClick={() => {
    setWorking(JSON.parse(JSON.stringify(section))); setSource(JSON.stringify(section)); setError(''); setFilter('');
  }}>Bulk edit category</button>;
  const stale = source !== JSON.stringify(section);
  const search = filter.trim().toLowerCase();
  return <div className="space-y-3 rounded-xl border border-cyan-400/30 p-3" aria-label="Category bulk editor">
    <h2 className="font-semibold text-cyan-200">Bulk edit {working.title}</h2>
    <p className="text-xs text-zinc-400">Edit all subcategories here, or download JSON and import your edits. Apply category to draft, then Save library. Blank prompts keep the original mapping; compact fields let you update shorter render wording too.</p>
    {stale && <p role="alert" className="text-sm text-amber-200">This category changed while the bulk editor was open. Close and reopen it to load the latest draft before applying.</p>}
    <label className="block text-xs">Category name<input aria-label="Bulk category name" className={inputClass} maxLength={200} value={working.title} onChange={event => setWorking({...working, title:event.target.value})}/></label>
    <div className="flex flex-wrap gap-2">
      <button type="button" className={buttonClass} onClick={() => {
        const url = URL.createObjectURL(new Blob([batchText()], {type:'application/json'}));
        const anchor = document.createElement('a'); anchor.href=url; anchor.download=`ultra-studio-category-${working.key}.json`; anchor.click(); URL.revokeObjectURL(url);
      }}>Download category JSON</button>
      <button type="button" className={buttonClass} onClick={() => fileInput.current.click()}>Import category JSON</button>
      <input ref={fileInput} type="file" accept=".json,application/json" className="hidden" aria-label="Import bulk category file" onChange={async event => {
        const file=event.target.files?.[0]; event.target.value=''; if (!file) return;
        if (file.size > 2000000) {setError('Use a category JSON file smaller than 2 MB.'); return;}
        try {stageJson(await file.text());} catch(err) {setError(`Could not read category: ${err.message}`);}
      }}/>
      <button type="button" className={buttonClass} onClick={() => {setJson(batchText());setShowJson(true);}}>Edit / paste category JSON</button>
      <button type="button" className={buttonClass} onClick={() => {setWorking(null);setShowJson(false);}}>Close bulk editor</button>
    </div>
    {showJson && <div className="space-y-2">
      <p className="text-xs text-zinc-400">Keep identifiers and all entries. Edit names, keywords, short, short_tags and group. default_keywords shows the original mapping for reference.</p>
      <textarea aria-label="Bulk category JSON" className={`${inputClass} font-mono`} rows={12} value={json} onChange={event => setJson(event.target.value)}/>
      <button type="button" className={buttonClass} onClick={() => stageJson(json)}>Load JSON edits</button>
      <button type="button" className={buttonClass} onClick={() => setShowJson(false)}>Cancel JSON edits</button>
    </div>}
    <input aria-label="Find bulk category prompts" className={inputClass} placeholder="Find a subcategory, choice or prompt…" value={filter} onChange={event => setFilter(event.target.value)}/>
    <div className="max-h-[65vh] space-y-4 overflow-y-auto">
      {working.fields.map(field => {
        const wholeField = !search || field.label.toLowerCase().includes(search);
        const options = CATEGORY_CHOICE_TYPES.includes(field.type) ? field.options.filter(option => wholeField || [option.label, option.group, option.keywords || getKeywords(field,option), option.short, option.short_tags].some(value => String(value || '').toLowerCase().includes(search))) : [];
        if (!wholeField && !options.length) return null;
        return <div key={field.key} className="space-y-3 rounded-lg border hairline p-3">
          <label className="block text-xs">Subcategory name<input aria-label={`Bulk subcategory ${field.key}`} className={inputClass} value={field.label} maxLength={200} onChange={event => updateField(field.key, {label:event.target.value})}/></label>
          {!CATEGORY_CHOICE_TYPES.includes(field.type) && <p className="text-xs text-zinc-500">This control keeps its existing range and behavior.</p>}
          {options.map(option => <div key={option.value} className="space-y-2 border-t hairline pt-3">
            <div className="grid gap-2 sm:grid-cols-2">{[['label','Choice name'],['group','Group']].map(([key,label]) => <label key={key} className="block text-xs">{label}<input aria-label={`Bulk ${key} ${field.key} ${option.value}`} className={inputClass} maxLength={200} value={option[key] || ''} onChange={event => updateChoice(field, option.value, key, event.target.value)}/></label>)}</div>
            {wording.map(([key,label]) => <label key={key} className="block text-xs">{label}<textarea aria-label={`Bulk ${key} ${field.key} ${option.value}`} className={inputClass} rows={key==='keywords'?3:2} maxLength={key==='keywords'?1500:500} value={option[key] || ''} placeholder={key==='keywords'?getKeywords(field,option):'Use automatic compact wording'} onChange={event => updateChoice(field, option.value, key, event.target.value)}/></label>)}
          </div>)}
        </div>;
      })}
    </div>
    {error && <p role="alert" className="text-sm text-red-200">{error}</p>}
    <button type="button" className={buttonClass} disabled={stale || showJson} onClick={() => {
      try {validateCatalogDraft({sections:[working]});onApply(working);setWorking(null);setError('');}
      catch(err) {setError(err.message);}
    }}>Apply category to draft</button>
  </div>;
}
