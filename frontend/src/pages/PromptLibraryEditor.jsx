import BulkChoiceEditor from '@/components/BulkChoiceEditor';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { endpoints } from '@/lib/api';
import { expandPrompt } from '@/lib/promptMap';
import { compileModelPrompts } from '@/lib/modelPromptCompilers';
import { SECTIONS, DEFAULT_DNA } from '@/lib/dna';
import { editableSection, catalogSections, newCatalogKey, setPromptCatalog, validateCatalogDraft } from '@/lib/promptCatalog';
const fieldClass='w-full rounded-lg border hairline bg-elevated px-3 py-2 text-sm';
const buttonClass='rounded-lg border hairline px-3 py-2 text-sm text-cyan-200 disabled:opacity-40';
export default function PromptLibraryEditor() {
  const [draft,setDraft]=useState({sections:[]}), [saved,setSaved]=useState({sections:[]});
  const [sectionKey,setSectionKey]=useState(SECTIONS[0].key), [fieldKey,setFieldKey]=useState(SECTIONS[0].fields[0].key);
  const [loaded,setLoaded]=useState(false);
  const [loading,setLoading]=useState(true), [busy,setBusy]=useState(false), [error,setError]=useState(''), [message,setMessage]=useState('');
  const [filter,setFilter]=useState('');
  const [browseLevel,setBrowseLevel]=useState('categories');
  const [optionKey,setOptionKey]=useState('');
  const [previewStyle,setPreviewStyle]=useState('qwen_image');
  const [promptPreview,setPromptPreview]=useState(null);
  const [provider,setProvider]=useState('AI'), [suggestion,setSuggestion]=useState(null);
  useEffect(() => {let live=true; endpoints.settings().then(settings => {
    if(!live)return;
    const config=settings.prompt_catalog || {sections:[]};setDraft(config);setSaved(config);setLoaded(true);
    setProvider(settings.ai_provider==='ollama'?'Ollama':'AI');
  }).catch(() => live && setError('Could not load the saved prompt library. Reload before editing.')).finally(() => live && setLoading(false));return () => {live=false;};},[]);
  const sections=catalogSections(SECTIONS,draft);
  const section=draft.sections.find(item => item.key===sectionKey) || editableSection(SECTIONS.find(item => item.key===sectionKey) || sections[0]);
  const selectedField=section.fields.find(item => item.key===fieldKey);
  const currentOption=selectedField?.options.find(option => option.value===optionKey) || selectedField?.options[0];
  const defaultKeywords=option => option.value.startsWith('custom_') ? option.label : expandPrompt(sectionKey,fieldKey,option.value);
  const dirty=JSON.stringify(draft)!==JSON.stringify(saved);
  const changeSection = next => {setDraft(current => ({...current,sections:[...current.sections.filter(item => item.key!==next.key),next]}));setMessage('');setSuggestion(null);setPromptPreview(null);};
  const changeField = next => changeSection({...section,fields:section.fields.map(item => item.key===next.key?next:item)});
  const changeOption = (value,patch) => changeField({...selectedField,options:selectedField.options.map(item => item.value===value?{...item,...patch}:item)});
  const chooseSection = key => {setBrowseLevel('subcategories');setOptionKey('');setPromptPreview(null);setFilter('');setSectionKey(key);setFieldKey((draft.sections.find(item => item.key===key) || sections.find(item => item.key===key))?.fields[0]?.key || '');setSuggestion(null);};
  const save = async () => {
    setBusy(true);setError('');
    try {validateCatalogDraft(draft);const result=await endpoints.updateSettings({prompt_catalog:draft});const config=result.prompt_catalog;setDraft(config);setSaved(config);setPromptCatalog(config);setMessage('Prompt library saved. New renders use these changes.');}
    catch(err){setError(err.response?.data?.detail || (err.message && err.message!=='offline' ? err.message : 'Could not save the prompt library. Your draft is still here.'));}
    finally{setBusy(false);}
  };
  const assist = async option => {
    setBusy(true);setError('');setSuggestion(null);
    try {const result=await endpoints.aiPromptLibrary({category:section.title,subcategory:selectedField.label,label:option.label,keywords:option.keywords || defaultKeywords(option)});
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
    <nav aria-label="Prompt library folders" className="flex flex-wrap items-center gap-2 text-sm">
      <button className={buttonClass} onClick={() => {setBrowseLevel('categories');setPromptPreview(null);}}>Categories</button>
      {browseLevel!=='categories' && <><span>›</span><button className={buttonClass} onClick={() => setBrowseLevel('subcategories')}>{section.title}</button></>}
      {['choices','choice'].includes(browseLevel) && selectedField && <><span>›</span><button className={buttonClass} onClick={() => setBrowseLevel('choices')}>{selectedField.label}</button></>}
      {browseLevel==='choice' && currentOption && <span>› {currentOption.label}</span>}
      {browseLevel!=='categories' && <button className={`${buttonClass} ml-auto md:hidden`} onClick={() => setBrowseLevel(browseLevel==='choice'?'choices':browseLevel==='choices'?'subcategories':'categories')}>← Back</button>}
    </nav>
    <div className="flex flex-wrap gap-2">
      <button className={buttonClass} disabled={busy || !dirty} onClick={save}>Save library</button>
      <button className={buttonClass} disabled={busy || !dirty} onClick={() => {setDraft(saved);chooseSection(SECTIONS[0].key);setMessage('Unsaved edits discarded.');setSuggestion(null);}}>Discard edits</button>
      <button className={buttonClass} disabled={busy} onClick={backup}>Download backup</button>
      <label className={buttonClass}>Restore backup<input aria-label="Restore backup" type="file" accept="application/json,.json" disabled={busy} onChange={restore} className="hidden"/></label>
      <button className={buttonClass} disabled={busy} onClick={() => {setDraft({sections:[]});setSectionKey(SECTIONS[0].key);setFieldKey(SECTIONS[0].fields[0].key);setMessage('Default library staged. Save to apply this reset.');setSuggestion(null);}}>Restore defaults</button>
      <span className="self-center text-xs text-zinc-500">{dirty?'Unsaved changes':'Saved library'}</span>
    </div>
    <fieldset disabled={busy} className="grid gap-5 md:grid-cols-[240px_1fr]">
      <aside className={`pane space-y-3 p-4 ${browseLevel==='categories'?'block':'hidden md:block'}`}><h2 className="font-semibold">Categories</h2>
        <div className="max-h-96 space-y-1 overflow-y-auto">{sections.map(item => <button className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${sectionKey===item.key?'bg-cyan-400/15 text-cyan-200':'text-zinc-400'}`} key={item.key} aria-pressed={sectionKey===item.key} onClick={() => chooseSection(item.key)}>{item.title}</button>)}</div>
        <button className={buttonClass} onClick={() => {const key=newCatalogKey();changeSection({key,title:'New category',fields:[]});setSectionKey(key);setFieldKey('');setBrowseLevel('subcategories');}}>Add category</button>
      </aside>
      <section className={`pane space-y-4 p-4 ${browseLevel==='categories'?'hidden md:block':'block'}`}>
        <label className="block">Category name<input aria-label="Category name" className={fieldClass} value={section.title} onChange={event => changeSection({...section,title:event.target.value})}/></label>
        {section.key.startsWith('custom_') && <button className={buttonClass} onClick={() => {setDraft({...draft,sections:draft.sections.filter(item => item.key!==sectionKey)});setSectionKey(SECTIONS[0].key);setFieldKey(SECTIONS[0].fields[0].key);}}>Remove category</button>}
        <div className={`grid grid-cols-2 gap-2 ${['choices','choice'].includes(browseLevel)?'hidden md:grid':'grid'}`}>{section.fields.map(item => <button key={item.key} aria-pressed={item.key===fieldKey} className={buttonClass} onClick={() => {setFieldKey(item.key);setOptionKey('');setSuggestion(null);setPromptPreview(null);setFilter('');setBrowseLevel('choices');}}>📁 {item.label}</button>)}</div>
        <button className={buttonClass} onClick={() => {const key=newCatalogKey();changeSection({...section,fields:[...section.fields,{key,label:'New subcategory',type:'chips',options:[]}]});setFieldKey(key);setOptionKey('');setBrowseLevel('choices');}}>Add subcategory</button>
        {selectedField && <div className={`space-y-3 border-t hairline pt-4 ${browseLevel==='subcategories'?'hidden md:block':'block'}`}>
          <label className="block">Subcategory name<input aria-label="Subcategory name" className={fieldClass} value={selectedField.label} onChange={event => changeField({...selectedField,label:event.target.value})}/></label>
          {selectedField.key.startsWith('custom_') && <><label className="block">Selection mode<select aria-label="Selection mode" className={fieldClass} value={selectedField.type} onChange={event => changeField({...selectedField,type:event.target.value})}><option value="chips">Choose one</option><option value="chips_multi">Choose multiple</option></select></label>
            <button className={buttonClass} onClick={() => {changeSection({...section,fields:section.fields.filter(item => item.key!==fieldKey)});setFieldKey('');}}>Remove subcategory</button></>}
          {['chips','chips_multi','pose_chips'].includes(selectedField.type) ? <>
            <p className="text-xs text-zinc-400">Blank keywords keep the original prompt mapping. For new choices, blank keywords use the display name. Group names create tabs within this subcategory.</p>
            <input aria-label="Find a choice" className={fieldClass} placeholder="Find a choice by name, group or keywords…" value={filter} onChange={event => setFilter(event.target.value)}/>
            <div className={`grid max-h-64 grid-cols-2 gap-2 overflow-y-auto ${browseLevel==='choice'?'hidden md:grid':'grid'}`} aria-label="Choice folders">
              {selectedField.options.filter(option => `${option.label} ${option.group || ''} ${option.keywords || defaultKeywords(option)}`.toLowerCase().includes(filter.toLowerCase())).map(option => <button key={option.value} className={buttonClass} aria-pressed={currentOption?.value===option.value} onClick={() => {setOptionKey(option.value);setBrowseLevel('choice');setSuggestion(null);setPromptPreview(null);}}>{option.label}<span className="block text-xs text-zinc-500">{option.group || 'Choice'}</span></button>)}
            </div>
            {(currentOption ? [currentOption] : []).map(option => <div key={option.value} className={`space-y-2 rounded-lg border hairline p-3 ${browseLevel==='choices'?'hidden md:block':'block'}`}>
              <label className="block">Display name<input aria-label={`Display name ${option.value}`} className={fieldClass} value={option.label} onChange={event => changeOption(option.value,{label:event.target.value})}/></label>
              <label className="block">Group<input aria-label={`Group ${option.value}`} className={fieldClass} value={option.group || ''} onChange={event => changeOption(option.value,{group:event.target.value})}/></label>
              <label className="block">Prompt keywords<textarea aria-label={`Keywords ${option.value}`} className={fieldClass} rows={2} value={option.keywords || defaultKeywords(option)} onChange={event => changeOption(option.value,{keywords:event.target.value})}/></label>
    {suggestion?.value === option.value && <section aria-label="AI keyword suggestion" className="space-y-3 rounded-lg border border-cyan-400/30 bg-cyan-400/5 p-3"><h2 className="font-semibold">Suggestion for {suggestion.label}</h2>
      <textarea aria-label="Suggested keywords" className={fieldClass} rows={3} value={suggestion.keywords} onChange={event => setSuggestion({...suggestion,keywords:event.target.value})}/>
      <div className="flex gap-2"><button className={buttonClass} disabled={!suggestion.keywords.trim()} onClick={() => {changeOption(suggestion.value,{keywords:suggestion.keywords});setSuggestion(null);}}>Apply suggestion</button><button className={buttonClass} onClick={() => setSuggestion(null)}>Discard suggestion</button></div>
      <p className="text-xs text-zinc-400">Applying changes this draft only. Save the library to use it in the builder.</p>
    </section>}
              <p className="text-xs text-zinc-400">{option.keywords ? 'Your custom wording' : 'Current base wording'}: {option.keywords || defaultKeywords(option)}</p>
              <button className={buttonClass} onClick={() => changeOption(option.value,{keywords:''})}>Use default wording</button>
              <div className="flex flex-wrap gap-2"><label className="text-xs">Preview model<select aria-label="Preview model" className={fieldClass} value={previewStyle} onChange={event => {setPreviewStyle(event.target.value);setPromptPreview(null);}}>{[['qwen_image','Qwen Image / AGQI'],['qwen_rapid','Qwen Rapid AIO'],['chroma','Chroma'],['zimage','Z-Image'],['krea2','Krea 2'],['pony','Pony'],['sdxl','SDXL'],['flux2_klein','FLUX.2 Klein']].map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select></label>
              <button className={buttonClass} onClick={() => {const dna=JSON.parse(JSON.stringify(DEFAULT_DNA));dna[sectionKey]={...dna[sectionKey],[fieldKey]:selectedField.type==='chips_multi'?[option.value]:option.value};setPromptPreview({value:option.value,...compileModelPrompts({dna,promptStyle:previewStyle,workflowKind:'image',promptCatalog:draft})});}}>Preview compiled prompt</button></div>
              {promptPreview?.value===option.value && <details open className="rounded-lg border hairline p-3"><summary className="text-sm text-cyan-200">Compiled prompt preview</summary><p className="my-2 text-xs text-zinc-400">Uses a default character and your draft library. Other selections and model-specific priorities can change the final wording.</p><textarea aria-label="Compiled positive preview" className={fieldClass} rows={5} readOnly value={promptPreview.positive}/>{promptPreview.negative && <textarea aria-label="Compiled negative preview" className={fieldClass} rows={3} readOnly value={promptPreview.negative}/>}</details>}
              <div className="flex gap-2"><button className={buttonClass} disabled={!option.label.trim()} onClick={() => assist(option)}>Improve keywords with {provider}</button><button className={buttonClass} onClick={() => changeField({...selectedField,options:selectedField.options.filter(item => item.value!==option.value)})}>Remove choice</button></div>
            </div>)}
            <BulkChoiceEditor key={`${sectionKey}-${fieldKey}`} field={selectedField} getKeywords={defaultKeywords}
              onApply={options => {changeField({...selectedField,options});setFilter('');setMessage('Batch applied to draft. Save library to use these changes.');}} />
            <button className={buttonClass} onClick={() => {const value=newCatalogKey();changeField({...selectedField,options:[...selectedField.options,{value,label:'New choice',keywords:'',group:''}]});setOptionKey(value);setBrowseLevel('choice');setFilter('');}}>Add choice</button>
          </> : <p className="text-xs text-zinc-400">This built-in control keeps its existing behavior and range. You can rename it here.</p>}
        </div>}
      </section>
    </fieldset>
    <details className="pane p-4"><summary className="cursor-pointer font-semibold">Prompt rules &amp; restrictions</summary>
    <fieldset disabled={busy} className="mt-3 space-y-3" aria-label="Prompt rules">
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
    </fieldset></details>

  </div>;
}
