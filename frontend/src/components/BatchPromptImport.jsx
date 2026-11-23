import { useMemo, useState } from 'react';
import { applyBatchPromptRows, parseBatchPromptInput, prepareBatchPromptRows } from '@/lib/batchPromptImport';

const inputClass='w-full rounded-lg border hairline bg-elevated px-3 py-2 text-sm';
const buttonClass='rounded-lg border hairline px-3 py-2 text-sm text-cyan-200 disabled:opacity-40';
const location=(section,field)=>`${section.key}::${field.key}`;

export default function BatchPromptImport({catalog,sections,onApply,onClose}) {
  const [text,setText]=useState(''),[rows,setRows]=useState([]),[source,setSource]=useState(''),[error,setError]=useState('');
  const destinations=useMemo(()=>sections.flatMap(section=>section.fields.map(field=>({value:location(section,field),label:`${section.title} › ${field.label}`}))),[sections]);
  const stage=value=>{
    try {
      const entries=parseBatchPromptInput(value);
      setRows(prepareBatchPromptRows(entries,sections));setSource(JSON.stringify(catalog));setError('');
    } catch(err){setRows([]);setError(err.message||'Could not read this prompt batch.');}
  };
  const update=(index,patch)=>setRows(current=>current.map((row,i)=>i===index?{...row,...patch}:row));
  const apply=()=>{
    if(source!==JSON.stringify(catalog)){setError('The prompt library changed while this review was open. Review the batch again before applying.');return;}
    try{const result=applyBatchPromptRows(catalog,rows,sections);onApply(result);setRows([]);setText('');setError('');}
    catch(err){setError(err.message||'The prompt batch could not be applied.');}
  };
  return <section className="pane space-y-3 p-4" aria-label="Batch prompt import">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold text-cyan-200">Batch import and smart filing</h2><p className="mt-1 max-w-3xl text-xs text-zinc-400">Paste prompts or import JSON, CSV or plain text. Ultra Studio suggests a category and control from the wording, then lets you review every destination before staging the changes.</p></div>
      <button type="button" className={buttonClass} onClick={onClose}>Close</button></div>
    <label className="block text-xs">Prompt batch<input aria-label="Import prompt batch file" type="file" accept=".json,.csv,.txt,application/json,text/csv,text/plain" className="mt-1 block w-full" onChange={async event=>{const file=event.target.files?.[0];event.target.value='';if(!file)return;if(file.size>2000000){setError('Prompt batch is too large (maximum 2 MB).');return;}const value=await file.text();setText(value);stage(value);}}/></label>
    <label className="block text-xs">Paste prompts<textarea aria-label="Prompt batch text" className={`${inputClass} mt-1 font-mono`} rows={6} value={text} onChange={event=>{setText(event.target.value);setRows([]);setError('');}} placeholder={'Golden window light: warm window light with soft shadows\nWalking side by side: two adults walking in step with natural posture\n{"prompts":[{"label":"Linen suit","category":"Wardrobe","subcategory":"Outfit set","prompt":"A relaxed ivory linen suit with a fitted waist"}]}'}/></label>
    <div className="flex flex-wrap gap-2"><button type="button" className={buttonClass} disabled={!text.trim()} onClick={()=>stage(text)}>Analyze batch</button><span className="self-center text-xs text-zinc-500">One prompt per line, CSV, or JSON with a prompts/items array · max 1,000 rows</span></div>
    {error&&<p role="alert" className="text-sm text-red-200">{error}</p>}
    {rows.length>0&&<div className="space-y-3" aria-label="Prompt batch review"><p className="text-sm">Review {rows.length} rows · {rows.filter(row=>row.change==='add'&&!row.skip).length} additions · {rows.filter(row=>row.change==='update'&&!row.skip).length} matching names will update wording</p>
      <div className="max-h-[32rem] space-y-2 overflow-y-auto">{rows.map((row,index)=><article key={`${index}-${row.label}`} className="grid gap-2 rounded-lg border hairline p-3 md:grid-cols-[minmax(0,1fr)_minmax(12rem,0.8fr)]">
        <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><strong className="truncate text-sm">{row.label}</strong><span className="text-[10px] uppercase text-zinc-500">{row.skip?'Skipped':row.change}</span><span className="text-[10px] text-zinc-500">{Math.round(row.confidence*100)}% suggestion</span></div><p className="mt-1 break-words text-xs text-zinc-400">{row.prompt}</p><p className="mt-1 text-[10px] text-zinc-500">{row.reason}</p></div>
        <div className="flex items-center gap-2"><select aria-label={`Destination for ${row.label}`} className={inputClass} value={row.destination} onChange={event=>update(index,{destination:event.target.value,change:'add'})}><option value="__custom__">Custom imported prompts</option>{destinations.map(item=><option key={item.value} value={item.value}>{item.label}</option>)}</select><label className="flex shrink-0 items-center gap-1 text-xs"><input type="checkbox" checked={!!row.skip} onChange={event=>update(index,{skip:event.target.checked})}/>Skip</label></div>
      </article>)}</div>
      <div className="flex flex-wrap gap-2"><button type="button" className={buttonClass} onClick={apply}>Stage reviewed prompts</button><button type="button" className={buttonClass} onClick={()=>{setRows([]);setError('');}}>Discard batch</button></div>
      <p className="text-xs text-zinc-500">Staging updates the editable library draft. Save library to apply it to new generations. Matching labels update the prompt text; other fields are preserved.</p>
    </div>}
  </section>;
}
