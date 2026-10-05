import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { endpoints } from '@/lib/api';
import { SECTIONS } from '@/lib/dna';
import { editableSection, catalogSections, newCatalogKey, setPromptCatalog, validateCatalogDraft } from '@/lib/promptCatalog';
const fieldClass='w-full rounded-lg border hairline bg-elevated px-3 py-2 text-sm';
const buttonClass='rounded-lg border hairline px-3 py-2 text-sm text-cyan-200 disabled:opacity-40';
export default function PromptLibraryEditor() {
  const [draft,setDraft]=useState({sections:[]}), [saved,setSaved]=useState({sections:[]});
  const [sectionKey,setSectionKey]=useState(SECTIONS[0].key), [fieldKey,setFieldKey]=useState(SECTIONS[0].fields[0].key);
  const [loaded,setLoaded]=useState(false);
  const [loading,setLoading]=useState(true), [busy,setBusy]=useState(false), [error,setError]=useState(''), [message,setMessage]=useState('');
  const [filter,setFilter]=useState('');
  const [provider,setProvider]=useState('AI'), [suggestion,setSuggestion]=useState(null);
  useEffect(() => {let live=true; endpoints.settings().then(settings => {
    if(!live)return;
    const config=settings.prompt_catalog || {sections:[]};setDraft(config);setSaved(config);setLoaded(true);
    setProvider(settings.ai_provider==='ollama'?'Ollama':'AI');
  }).catch(() => live && setError('Could not load the saved prompt library. Reload before editing.')).finally(() => live && setLoading(false));return () => {live=false;};},[]);
  const sections=catalogSections(SECTIONS,draft);
  const section=draft.sections.find(item => item.key===sectionKey) || editableSection(SECTIONS.find(item => item.key===sectionKey) || sections[0]);
  const selectedField=section.fields.find(item => item.key===fieldKey);
  const dirty=JSON.stringify(draft)!==JSON.stringify(saved);
  const changeSection = next => {setDraft(current => ({...current,sections:[...current.sections.filter(item => item.key!==next.key),next]}));setMessage('');setSuggestion(null);};
  const changeField = next => changeSection({...section,fields:section.fields.map(item => item.key===next.key?next:item)});
  const changeOption = (value,patch) => changeField({...selectedField,options:selectedField.options.map(item => item.value===value?{...item,...patch}:item)});
  const chooseSection = key => {setFilter('');setSectionKey(key);setFieldKey((draft.sections.find(item => item.key===key) || sections.find(item => item.key===key))?.fields[0]?.key || '');setSuggestion(null);};
  const save = async () => {
    setBusy(true);setError('');
    try {validateCatalogDraft(draft);const result=await endpoints.updateSettings({prompt_catalog:draft});const config=result.prompt_catalog;setDraft(config);setSaved(config);setPromptCatalog(config);setMessage('Prompt library saved. New renders use these changes.');}
    catch(err){setError(err.response?.data?.detail || (err.message && err.message!=='offline' ? err.message : 'Could not save the prompt library. Your draft is still here.'));}
    finally{setBusy(false);}
  };
  const assist = async option => {
    setBusy(true);setError('');setSuggestion(null);
    try {const result=await endpoints.aiPromptLibrary({category:section.title,subcategory:selectedField.label,label:option.label,keywords:option.keywords});
      if(!result.keywords?.trim())throw new Error('AI returned an empty suggestion.');
      setSuggestion({value:option.value,label:option.label,keywords:result.keywords});
    }catch(err){setError(err.response?.data?.detail || err.message || 'The assistant is unavailable.');}finally{setBusy(false);}
  };
  const backup = () => {const blob=new Blob([JSON.stringify(draft,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='ultra-studio-prompt-library.json';link.click();URL.revokeObjectURL(url);};
  const restore = async event => {const file=event.target.files?.[0];event.target.value='';if(!file)return;
    try {if(file.size>500000)throw new Error('Backup is too large.');const config=validateCatalogDraft(JSON.parse(await file.text()));
      if(!Array.isArray(config.sections) || config.sections.some(section => !section?.key || !section?.title || !Array.isArray(section.fields) || section.fields.some(field => !field?.key || !field?.label || !Array.isArray(field.options))))throw new Error('Choose a valid prompt library backup.');
      setDraft(config);setSectionKey(config.sections[0]?.key || SECTIONS[0].key);setFieldKey(config.sections[0]?.fields[0]?.key || SECTIONS[0].fields[0].key);setMessage('Backup loaded for review. Save to apply it.');setSuggestion(null);
    }catch(err){setError(err.message || 'Could not read the backup.');}
  };
  if(loading)return <p className="p-6">Loading prompt library…</p>;
  if(!loaded)return <div className="p-6"><p role="alert">{error}</p><Link to="/settings">Return to Settings</Link></div>;
  return <div className="mx-auto max-w-6xl space-y-5 p-4 sm:p-6">
    <Link to="/settings" className="text-sm text-cyan-200">← Settings</Link>
    <header><h1 className="font-display text-3xl font-bold">Prompt Library editor</h1><p className="mt-2 text-zinc-400">Edit categories and choices without coding. Display names appear in the builder; keywords describe what you want the image model to produce.</p></header>
    {error && <p role="alert" className="text-red-200">{error}</p>}{message && <p role="status" className="text-emerald-200">{message}</p>}
    <div className="flex flex-wrap gap-2">
      <button className={buttonClass} disabled={busy || !dirty} onClick={save}>Save library</button>
      <button className={buttonClass} disabled={busy || !dirty} onClick={() => {setDraft(saved);chooseSection(SECTIONS[0].key);setMessage('Unsaved edits discarded.');setSuggestion(null);}}>Discard edits</button>
      <button className={buttonClass} disabled={busy} onClick={backup}>Download backup</button>
      <label className={buttonClass}>Restore backup<input aria-label="Restore backup" type="file" accept="application/json,.json" disabled={busy} onChange={restore} className="hidden"/></label>
      <button className={buttonClass} disabled={busy} onClick={() => {setDraft({sections:[]});setSectionKey(SECTIONS[0].key);setFieldKey(SECTIONS[0].fields[0].key);setMessage('Default library staged. Save to apply this reset.');setSuggestion(null);}}>Restore defaults</button>
      <span className="self-center text-xs text-zinc-500">{dirty?'Unsaved changes':'Saved library'}</span>
    </div>
    <fieldset disabled={busy} className="grid gap-5 md:grid-cols-[240px_1fr]">
      <aside className="pane space-y-3 p-4"><h2 className="font-semibold">Categories</h2>
        <div className="max-h-96 space-y-1 overflow-y-auto">{sections.map(item => <button className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${sectionKey===item.key?'bg-cyan-400/15 text-cyan-200':'text-zinc-400'}`} key={item.key} aria-pressed={sectionKey===item.key} onClick={() => chooseSection(item.key)}>{item.title}</button>)}</div>
        <button className={buttonClass} onClick={() => {const key=newCatalogKey();changeSection({key,title:'New category',fields:[]});setSectionKey(key);setFieldKey('');}}>Add category</button>
      </aside>
      <section className="pane space-y-4 p-4">
        <label className="block">Category name<input aria-label="Category name" className={fieldClass} value={section.title} onChange={event => changeSection({...section,title:event.target.value})}/></label>
        {section.key.startsWith('custom_') && <button className={buttonClass} onClick={() => {setDraft({...draft,sections:draft.sections.filter(item => item.key!==sectionKey)});setSectionKey(SECTIONS[0].key);setFieldKey(SECTIONS[0].fields[0].key);}}>Remove category</button>}
        <div className="flex flex-wrap gap-2">{section.fields.map(item => <button key={item.key} aria-pressed={item.key===fieldKey} className={buttonClass} onClick={() => {setFieldKey(item.key);setSuggestion(null);setFilter('');}}>{item.label}</button>)}</div>
        <button className={buttonClass} onClick={() => {const key=newCatalogKey();changeSection({...section,fields:[...section.fields,{key,label:'New subcategory',type:'chips',options:[]}]});setFieldKey(key);}}>Add subcategory</button>
        {selectedField && <div className="space-y-3 border-t hairline pt-4">
          <label className="block">Subcategory name<input aria-label="Subcategory name" className={fieldClass} value={selectedField.label} onChange={event => changeField({...selectedField,label:event.target.value})}/></label>
          {selectedField.key.startsWith('custom_') && <><label className="block">Selection mode<select aria-label="Selection mode" className={fieldClass} value={selectedField.type} onChange={event => changeField({...selectedField,type:event.target.value})}><option value="chips">Choose one</option><option value="chips_multi">Choose multiple</option></select></label>
            <button className={buttonClass} onClick={() => {changeSection({...section,fields:section.fields.filter(item => item.key!==fieldKey)});setFieldKey('');}}>Remove subcategory</button></>}
          {['chips','chips_multi','pose_chips'].includes(selectedField.type) ? <>
            <p className="text-xs text-zinc-400">Blank keywords keep the original prompt mapping. For new choices, blank keywords use the display name. Group names create tabs within this subcategory.</p>
            <input aria-label="Find a choice" className={fieldClass} placeholder="Find a choice by name, group or keywords…" value={filter} onChange={event => setFilter(event.target.value)}/>
            {selectedField.options.filter(option => `${option.label} ${option.group} ${option.keywords}`.toLowerCase().includes(filter.toLowerCase())).map(option => <div key={option.value} className="space-y-2 rounded-lg border hairline p-3">
              <label className="block">Display name<input aria-label={`Display name ${option.value}`} className={fieldClass} value={option.label} onChange={event => changeOption(option.value,{label:event.target.value})}/></label>
              <label className="block">Group<input aria-label={`Group ${option.value}`} className={fieldClass} value={option.group || ''} onChange={event => changeOption(option.value,{group:event.target.value})}/></label>
              <label className="block">Prompt keywords<textarea aria-label={`Keywords ${option.value}`} className={fieldClass} rows={2} value={option.keywords} onChange={event => changeOption(option.value,{keywords:event.target.value})}/></label>
              <p className="text-xs text-zinc-400">Keyword preview: {option.keywords || (option.value.startsWith('custom_')?option.label:'Original model-specific wording')}</p>
              <div className="flex gap-2"><button className={buttonClass} disabled={!option.label.trim()} onClick={() => assist(option)}>Improve keywords with {provider}</button><button className={buttonClass} onClick={() => changeField({...selectedField,options:selectedField.options.filter(item => item.value!==option.value)})}>Remove choice</button></div>
            </div>)}
            <button className={buttonClass} onClick={() => changeField({...selectedField,options:[...selectedField.options,{value:newCatalogKey(),label:'New choice',keywords:'',group:''}]})}>Add choice</button>
          </> : <p className="text-xs text-zinc-400">This built-in control keeps its existing behavior and range. You can rename it here.</p>}
        </div>}
      </section>
    </fieldset>
    <fieldset disabled={busy} className="pane space-y-3 p-4" aria-label="Prompt rules">
      <h2 className="font-semibold">Your prompt rules & restrictions</h2>
      <p className="text-xs text-zinc-400">Write requirements or things to avoid, then toggle each rule on or off. These apply to new compiled builder prompts and freeform generations. Negative rules only affect workflows that use negative conditioning.</p>
      {(draft.rules || []).map(rule => <div key={rule.key} className="space-y-2 rounded-lg border hairline p-3">
        <label className="flex items-center gap-2"><input aria-label={`Enable rule ${rule.key}`} type="checkbox" checked={rule.enabled} onChange={event => {setDraft({...draft,rules:draft.rules.map(item => item.key===rule.key?{...item,enabled:event.target.checked}:item)});setMessage('');}}/>Enabled</label>
        <label className="block">Rule name<input aria-label={`Rule name ${rule.key}`} className={fieldClass} value={rule.label} onChange={event => {setDraft({...draft,rules:draft.rules.map(item => item.key===rule.key?{...item,label:event.target.value}:item)});setMessage('');}}/></label>
        <label className="block">Rule wording<textarea aria-label={`Rule wording ${rule.key}`} className={fieldClass} value={rule.text} onChange={event => {setDraft({...draft,rules:draft.rules.map(item => item.key===rule.key?{...item,text:event.target.value}:item)});setMessage('');}}/></label>
        <div className="grid grid-cols-2 gap-2"><label>Prompt placement<select aria-label={`Rule placement ${rule.key}`} className={fieldClass} value={rule.kind} onChange={event => setDraft({...draft,rules:draft.rules.map(item => item.key===rule.key?{...item,kind:event.target.value}:item)})}><option value="positive">Positive · requirements</option><option value="negative">Negative · things to avoid</option></select></label>
        <label>Apply to<select aria-label={`Rule scope ${rule.key}`} className={fieldClass} value={rule.scope} onChange={event => setDraft({...draft,rules:draft.rules.map(item => item.key===rule.key?{...item,scope:event.target.value}:item)})}>{[['all','All generation types'],['image','Text to image'],['edit','Image editing'],['video','Image to video'],['text_video','Text to video']].map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label></div>
        <button className={buttonClass} onClick={() => setDraft({...draft,rules:draft.rules.filter(item => item.key!==rule.key)})}>Remove rule</button>
      </div>)}
      <button className={buttonClass} onClick={() => {setDraft({...draft,rules:[...(draft.rules || []),{key:newCatalogKey(),label:'New rule',text:'',kind:'positive',scope:'all',enabled:true}]});setMessage('');}}>Add rule</button>
    </fieldset>
    {suggestion && <section aria-label="AI keyword suggestion" className="pane space-y-3 p-4"><h2 className="font-semibold">Suggestion for {suggestion.label}</h2>
      <textarea aria-label="Suggested keywords" className={fieldClass} rows={3} value={suggestion.keywords} onChange={event => setSuggestion({...suggestion,keywords:event.target.value})}/>
      <div className="flex gap-2"><button className={buttonClass} disabled={!suggestion.keywords.trim()} onClick={() => {changeOption(suggestion.value,{keywords:suggestion.keywords});setSuggestion(null);}}>Apply suggestion</button><button className={buttonClass} onClick={() => setSuggestion(null)}>Discard suggestion</button></div>
      <p className="text-xs text-zinc-400">Applying changes this draft only. Save the library to use it in the builder.</p>
    </section>}
  </div>;
}
