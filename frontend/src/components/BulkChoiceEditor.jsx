import { useState } from 'react';
import { parseBulkChoices, mergeBulkChoices, bulkChoiceText } from '@/lib/bulkCatalogChoices';
const inputClass='w-full rounded-lg border hairline bg-elevated px-3 py-2 text-sm';
const buttonClass='rounded-lg border hairline px-3 py-2 text-sm text-cyan-200 disabled:opacity-40';
export default function BulkChoiceEditor({field, getKeywords, onApply}) {
  const [text,setText]=useState(''), [group,setGroup]=useState('');
  const [preview,setPreview]=useState(null), [error,setError]=useState('');
  const changeText=value => {setText(value);setPreview(null);setError('');};
  return <details className="rounded-lg border hairline p-3" data-testid="bulk-choice-editor">
    <summary className="cursor-pointer font-semibold text-cyan-200">Bulk add / update choices</summary>
    <div className="mt-3 space-y-3">
      <p className="text-xs text-zinc-400">Paste one choice name: prompt text per line. Matching names update existing choices; new names add choices. Optional [Group name] headings organize the batch. Wording is kept as entered.</p>
      <button type="button" className={buttonClass} onClick={() => changeText(bulkChoiceText(field.options,getKeywords))}>Load current entries for editing</button>
      <label className="block text-xs">Default group (optional)<input aria-label="Bulk default group" className={inputClass} value={group} onChange={event => {setGroup(event.target.value);setPreview(null);setError('');}} /></label>
      <textarea aria-label="Bulk choice entries" className={`${inputClass} font-mono`} rows={8} value={text} onChange={event => changeText(event.target.value)} placeholder={'[My choices]\nMorning light: soft light from a window\nEvening light: warm late-afternoon sunlight'} />
      {error && <p role="alert" className="text-sm text-red-200">{error}</p>}
      <button type="button" className={buttonClass} disabled={!text.trim()} onClick={() => {
        try {setPreview({...mergeBulkChoices(field.options,parseBulkChoices(text,group)),source:JSON.stringify(field.options)});setError('');}
        catch(err){setPreview(null);setError(err.message);}
      }}>Preview batch</button>
      {preview && <div className="space-y-2 rounded-lg border border-cyan-400/30 p-3" aria-label="Bulk batch preview">
        <p className="text-sm">{preview.changes.filter(change=>change.type==='add').length} new · {preview.changes.filter(change=>change.type==='update').length} updates</p>
        <ul className="max-h-52 space-y-2 overflow-y-auto text-xs">{preview.changes.map(change => <li key={change.option.value}>
          <span className="font-semibold">{change.type==='add'?'Add':'Update'}: {change.option.label}</span>
          {change.option.group && <span className="text-zinc-500"> · {change.option.group}</span>}
          <p className="mt-1 text-zinc-400">{change.option.keywords}</p>
        </li>)}</ul>
        <button type="button" className={buttonClass} onClick={() => {
          if (preview.source !== JSON.stringify(field.options)) {setPreview(null);setError('Choices changed after this preview. Preview the batch again.');return;}
          onApply(preview.options);setPreview(null);setText('');setError('');
        }}>Apply batch to draft</button>
        <p className="text-xs text-zinc-500">Apply updates this draft. Save library makes the changes available in the builder.</p>
      </div>}
    </div>
  </details>;
}
