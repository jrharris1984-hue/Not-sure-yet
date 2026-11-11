import { useEffect, useMemo, useState } from 'react';
import { endpoints } from '@/lib/api';
import { VIDEO_LIBRARY, VIDEO_PRESETS, videoDefaults, videoOptions, composeVideoPrompt } from '@/lib/videoPromptLibrary';
const FIELD='w-full rounded-lg border hairline bg-elevated px-3 py-2 text-sm';
const clean=value=>String(value||'').trim();
const readPresets=catalog=>(catalog?.sections?.find(section=>section.key==='video_saved_presets')?.fields?.find(field=>field.key==='choices')?.options||[]).flatMap(item=>{try{const parsed=JSON.parse(item.keywords);return [{...parsed,id:item.value,label:item.label}];}catch{return [];}});
const makeKey=()=> 'custom_'+(globalThis.crypto?.randomUUID?.() || Date.now().toString(36)).replace(/-/g,'');
export default function VideoPromptBuilder({mode,onApply,disabled=false}) {
  const [catalog,setCatalog]=useState({sections:[]}),[loading,setLoading]=useState(true);
  const [selected,setSelected]=useState(videoDefaults),[intensity,setIntensity]=useState('subtle');
  const [scene,setScene]=useState(''),[custom,setCustom]=useState(''),[shared,setShared]=useState('');
  const [steps,setSteps]=useState([]),[stepText,setStepText]=useState('');
  const [search,setSearch]=useState(''),[category,setCategory]=useState('motion');
  const [newLabel,setNewLabel]=useState(''),[newKeywords,setNewKeywords]=useState('');
  const [presetName,setPresetName]=useState(''),[userPresets,setUserPresets]=useState([]);
  const [busy,setBusy]=useState(false),[message,setMessage]=useState('');
  useEffect(()=>{let live=true;endpoints.settings().then(settings=>{if(!live)return;setCatalog(settings.prompt_catalog||{sections:[]});setUserPresets(readPresets(settings.prompt_catalog));}).catch(()=>live&&setMessage('Saved catalog unavailable; built-in choices are available.')).finally(()=>live&&setLoading(false));return()=>{live=false;};},[]);
  const sharedChoices=useMemo(()=> (catalog.sections||[]).filter(section=>!section.key.startsWith('video_')&&['scenario','pose','wardrobe','lighting','camera'].includes(section.key)).flatMap(section=>(section.fields||[]).flatMap(field=>(field.options||[]).map(option=>({id:[section.key,field.key,option.value].join(':'),label:[section.title,field.label,option.label].join(' / '),keywords:clean(option.keywords)||clean(option.label)})))).filter(item=>item.keywords),[catalog]);
  const preview=composeVideoPrompt({mode,scene,shared:sharedChoices.find(item=>item.id===shared)?.keywords||'',selected,catalog,steps,intensity,custom});
  const saveCatalog=async modify=>{
    setBusy(true);setMessage('');
    try {
      const latest=await endpoints.settings();
      const original=latest.prompt_catalog||{sections:[]};
      const updated=modify(original);
      const result=await endpoints.updateSettings({prompt_catalog:updated});
      const saved=result.prompt_catalog||updated;
      setCatalog(saved);setUserPresets(readPresets(saved));
      setMessage('Saved to the shared prompt library.');
    }catch(error){setMessage(error.response?.data?.detail||error.message||'Unable to save. Existing choices were not reset.');}
    finally{setBusy(false);}
  };
  const saveChoice=()=>{
    if(!clean(newLabel)||!clean(newKeywords)){setMessage('Enter a preset name and instructions.');return;}
    const key='video_'+category,value=makeKey();
    saveCatalog(original=>{
      const section=original.sections?.find(item=>item.key===key);
      const field=section?.fields?.find(item=>item.key==='choices');
      const options=field?.options||[];
      const next={key,title:VIDEO_LIBRARY[category].title,exact_fields:true,fields:[{key:'choices',label:'Choices',type:'chips',options:[...options,{value,label:clean(newLabel),keywords:clean(newKeywords),group:'Custom'}]}]};
      return {...original,sections:[...(original.sections||[]).filter(item=>item.key!==key),next]};
    });
    setSelected(current=>({...current,[category]:value}));setNewLabel('');setNewKeywords('');
  };
  const savePreset=()=>{
    if(!clean(presetName)){setMessage('Name your video preset first.');return;}
    const preset={id:makeKey(),label:clean(presetName),choices:{...selected},intensity,steps:[...steps],custom};
    saveCatalog(original=>{const key='video_saved_presets';const existing=original.sections?.find(section=>section.key===key);const options=existing?.fields?.find(field=>field.key==='choices')?.options||[];const section={key,title:'Saved Video Presets',exact_fields:true,fields:[{key:'choices',label:'Presets',type:'chips',options:[...options,{value:preset.id,label:preset.label,keywords:JSON.stringify(preset),group:'Custom'}]}]};return {...original,sections:[...(original.sections||[]).filter(item=>item.key!==key),section]};});
    setPresetName('');
  };
  const applyPreset=preset=>{setSelected(current=>({...current,...preset.choices}));setIntensity(preset.intensity||'subtle');setSteps(preset.steps||[]);setCustom(preset.custom||'');setMessage('Preset loaded. Review the prompt before applying.');};
  return <details className="rounded-xl border hairline bg-elevated/40 p-4" data-testid="video-prompt-builder">
    <summary className="cursor-pointer font-semibold text-cyan-200">Video Prompt Studio · guided builder</summary>
    <p className="mt-2 text-xs text-zinc-400">Build motion, camera, and scene instructions. Reuse image-library choices, save your own video presets, then apply the preview.</p>
    {loading?<p className="mt-3 text-sm">Loading library…</p>:<div className="mt-4 space-y-4">
      <div className="space-y-2"><p className="text-sm font-medium">Quick video presets</p><div className="flex flex-wrap gap-2">{[...VIDEO_PRESETS,...userPresets].map(preset=><button type="button" key={preset.id} disabled={disabled} onClick={()=>applyPreset(preset)} className="rounded-lg border hairline px-3 py-2 text-xs text-cyan-200">{preset.label}</button>)}</div></div>
      {mode==='text_video'&&<label className="block text-sm">Scene and subject<textarea className={FIELD} rows={2} value={scene} onChange={event=>setScene(event.target.value)} placeholder="Subject, wardrobe, lighting, and location"/></label>}
      {!!sharedChoices.length&&<label className="block text-sm">Existing image-library detail (optional)<select className={FIELD} value={shared} onChange={event=>setShared(event.target.value)}><option value="">No additional detail</option>{sharedChoices.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select></label>}
      <label className="block text-sm">Search video categories and choices<input className={FIELD} value={search} onChange={event=>setSearch(event.target.value)} placeholder="Walking, dolly, fabric, expression…"/></label>
      <div className="grid gap-3 sm:grid-cols-2">{Object.entries(VIDEO_LIBRARY).map(([key,section])=>{
        const choices=videoOptions(catalog,key);
        const matches=choices.filter(item=>(section.title+' '+item.label+' '+item.keywords).toLowerCase().includes(search.toLowerCase()));
        if(search&&!matches.length)return null;
        return <label key={key} className="block text-sm">{section.title}<select className={FIELD} value={selected[key]} onChange={event=>setSelected(current=>({...current,[key]:event.target.value}))}>{choices.map(item=><option key={item.value} value={item.value}>{item.label}</option>)}</select></label>;
      })}</div>
      <label className="block text-sm">Motion intensity<select className={FIELD} value={intensity} onChange={event=>setIntensity(event.target.value)}>{['very subtle','subtle','natural','dynamic','highly dynamic'].map(value=><option key={value}>{value}</option>)}</select></label>
      <div className="space-y-2"><p className="text-sm font-medium">Action sequence (optional)</p><p className="text-xs text-zinc-400">When set, these ordered actions replace the single body movement choice.</p>{steps.map((step,index)=><div className="flex items-center gap-2" key={index}><span className="min-w-0 flex-1 text-sm">{index+1}. {step}</span><button type="button" className="text-xs text-cyan-200" onClick={()=>setSteps(current=>current.filter((_,i)=>i!==index))}>Remove</button></div>)}<div className="flex gap-2"><input className={FIELD} aria-label="Next action" value={stepText} onChange={event=>setStepText(event.target.value)} placeholder="Next action…"/><button type="button" className="rounded-lg border hairline px-3 text-sm text-cyan-200" onClick={()=>{if(clean(stepText)){setSteps(current=>[...current,clean(stepText)]);setStepText('');}}}>Add</button></div></div>
      <label className="block text-sm">Additional instructions<textarea className={FIELD} rows={2} value={custom} onChange={event=>setCustom(event.target.value)} placeholder="Timing, gestures, model-specific notes…"/></label>
      <div className="rounded-lg border hairline p-3"><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Compiled prompt preview</p><p className="whitespace-pre-wrap text-sm">{preview}</p></div>
      <button type="button" disabled={disabled} className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-black disabled:opacity-40" onClick={()=>onApply(preview)}>Use this video prompt</button>
      <details className="border-t border-zinc-700/50 pt-3"><summary className="cursor-pointer text-sm text-cyan-200">Save complete video preset</summary><div className="mt-2 flex gap-2"><input aria-label="Video preset name" className={FIELD} value={presetName} onChange={event=>setPresetName(event.target.value)} placeholder="My video preset"/><button type="button" disabled={busy||disabled} className="rounded-lg border hairline px-3 text-sm text-cyan-200" onClick={savePreset}>Save</button></div></details>
      <details className="border-t border-zinc-700/50 pt-3"><summary className="cursor-pointer text-sm text-cyan-200">Add a custom choice to the database</summary><div className="mt-3 space-y-2"><label className="block text-sm">Category<select className={FIELD} value={category} onChange={event=>setCategory(event.target.value)}>{Object.entries(VIDEO_LIBRARY).map(([key,value])=><option key={key} value={key}>{value.title}</option>)}</select></label><input aria-label="Custom choice name" className={FIELD} value={newLabel} onChange={event=>setNewLabel(event.target.value)} placeholder="Choice name"/><textarea aria-label="Custom choice instructions" className={FIELD} value={newKeywords} onChange={event=>setNewKeywords(event.target.value)} placeholder="Describe the action"/><button type="button" disabled={busy||disabled} className="rounded-lg border hairline px-3 py-2 text-sm text-cyan-200" onClick={saveChoice}>Save choice</button></div></details>
      {message&&<p role="status" className="text-xs text-zinc-300">{message}</p>}
    </div>}
  </details>;
}
