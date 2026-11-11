import { useEffect, useMemo, useState } from 'react';
import { endpoints } from '@/lib/api';

const FIELD = 'w-full rounded-lg border hairline bg-elevated px-3 py-2 text-sm';
const DEFAULTS = {
  motion: [{value:'shift',label:'Shift weight',keywords:'shifts weight naturally from one leg to the other'},{value:'walk',label:'Walk',keywords:'walks forward at a relaxed pace'},{value:'turn',label:'Turn',keywords:'slowly turns toward the camera'},{value:'pose',label:'Change pose',keywords:'changes position in a relaxed, natural way'}],
  expression: [{value:'neutral',label:'Relaxed',keywords:'maintains a relaxed expression'},{value:'smile',label:'Smile',keywords:'gradually smiles'},{value:'glance',label:'Look aside',keywords:'briefly glances to the side'}],
  camera: [{value:'still',label:'Stationary',keywords:'The camera remains stationary'},{value:'track',label:'Tracking',keywords:'The camera tracks the subject smoothly'},{value:'orbit',label:'Slow orbit',keywords:'The camera slowly orbits the subject'}],
  environment: [{value:'none',label:'No added movement',keywords:''},{value:'breeze',label:'Gentle breeze',keywords:'A gentle breeze moves hair and loose clothing'},{value:'light',label:'Changing light',keywords:'Ambient light changes subtly'}],
};
const VIDEO_KEYS = {motion:'video_motion',expression:'video_expression',camera:'video_camera',environment:'video_environment'};
const SECTION_LABELS = {motion:'Body movement',expression:'Expression',camera:'Camera movement',environment:'Environment'};
const clean = value => String(value || '').trim();
function savedOptions(catalog, key) {
  const section = catalog?.sections?.find(item => item.key === VIDEO_KEYS[key]);
  const field = section?.fields?.find(item => item.key === 'choices');
  return Array.isArray(field?.options) ? field.options.filter(item => item?.value && item?.label).map(item => ({...item,keywords:clean(item.keywords) || item.label})) : null;
}
function sharedChoices(catalog) {
  return (catalog?.sections || []).filter(section => !section.key.startsWith('video_') && ['scenario','pose','wardrobe','lighting','camera'].includes(section.key)).flatMap(section =>
    (section.fields || []).flatMap(field => (field.options || []).slice(0,40).map(option => ({
      id:section.key+':'+field.key+':'+option.value,
      label:section.title+' / '+field.label+' / '+option.label,
      text:clean(option.keywords) || clean(option.label),
    })))).filter(option => option.text);
}
export function compileVideoPrompt({mode,scene,motion,expression,camera,environment,intensity,custom}) {
  const pieces = [];
  if (mode === 'text_video' && clean(scene)) pieces.push(clean(scene).replace(/[. ]+$/, '') + '.');
  pieces.push(mode === 'video' ? 'Animate the subject in the supplied image.' : 'Create a continuous photorealistic video.');
  if (clean(motion)) pieces.push('The subject '+clean(motion).replace(/[. ]+$/, '')+'.');
  if (clean(expression)) pieces.push(clean(expression).replace(/[. ]+$/, '')+'.');
  if (clean(camera)) pieces.push(clean(camera).replace(/[. ]+$/, '')+'.');
  if (clean(environment)) pieces.push(clean(environment).replace(/[. ]+$/, '')+'.');
  pieces.push('Movement is '+intensity+', smooth, and physically realistic.');
  if (clean(custom)) pieces.push(clean(custom).replace(/[. ]+$/, '')+'.');
  if (mode === 'video') pieces.push('Preserve the original subject identity, appearance, clothing, proportions, background, and lighting.');
  pieces.push('Keep the action continuous with no abrupt scene changes.');
  return pieces.join(' ');
}
export default function VideoPromptBuilder({mode,onApply,disabled=false}) {
  const [catalog,setCatalog] = useState({sections:[]});
  const [loading,setLoading] = useState(true);
  const [selection,setSelection] = useState({motion:'shift',expression:'neutral',camera:'still',environment:'none'});
  const [intensity,setIntensity] = useState('subtle');
  const [shared,setShared] = useState('');
  const [scene,setScene] = useState('');
  const [custom,setCustom] = useState('');
  const [category,setCategory] = useState('motion');
  const [newLabel,setNewLabel] = useState('');
  const [newKeywords,setNewKeywords] = useState('');
  const [busy,setBusy] = useState(false);
  const [message,setMessage] = useState('');
  useEffect(()=>{let active=true;endpoints.settings().then(result=>{if(active)setCatalog(result.prompt_catalog || {sections:[]});}).catch(()=>{if(active)setMessage('Saved library unavailable; built-in video choices remain available.');}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[]);
  const options = useMemo(()=>Object.fromEntries(Object.keys(DEFAULTS).map(key=>[key,savedOptions(catalog,key) || DEFAULTS[key]])),[catalog]);
  const sharedOptions = useMemo(()=>sharedChoices(catalog),[catalog]);
  const picked = key => options[key].find(item=>item.value===selection[key]) || options[key][0];
  const preview = compileVideoPrompt({mode,scene: [scene,sharedOptions.find(item=>item.id===shared)?.text].filter(Boolean).join('. '),motion:picked('motion')?.keywords,expression:picked('expression')?.keywords,camera:picked('camera')?.keywords,environment:picked('environment')?.keywords,intensity,custom});
  const saveChoice = async () => {
    if (!clean(newLabel) || !clean(newKeywords)) {setMessage('Enter a name and movement instructions.');return;}
    setBusy(true);setMessage('');
    try {
      // Re-read to preserve edits made in the existing image prompt library.
      const latest = await endpoints.settings();
      const original = latest.prompt_catalog || {sections:[]};
      const key = VIDEO_KEYS[category];
      const existing = original.sections.find(item=>item.key===key);
      const base = existing?.fields?.find(item=>item.key==='choices')?.options || DEFAULTS[category];
      const value = 'custom_'+Date.now().toString(36);
      const updated = {key,title:SECTION_LABELS[category],exact_fields:true,fields:[{key:'choices',label:'Choices',type:'chips',options:[...base,{value,label:clean(newLabel),keywords:clean(newKeywords),group:'Custom'}]}]};
      const next = {...original,sections:[...original.sections.filter(item=>item.key!==key),updated]};
      const response = await endpoints.updateSettings({prompt_catalog:next});
      setCatalog(response.prompt_catalog || next);
      setSelection(prev=>({...prev,[category]:value}));
      setNewLabel('');setNewKeywords('');setMessage('Saved to your existing prompt library.');
    } catch(error) {setMessage(error.response?.data?.detail || 'Could not save this preset. Your existing library was not reset.');}
    finally {setBusy(false);}
  };
  return <details className="rounded-xl border hairline bg-elevated/40 p-4" data-testid="video-prompt-builder">
    <summary className="cursor-pointer font-semibold text-cyan-200">Video Prompt Library · guided builder</summary>
    <p className="mt-2 text-xs text-zinc-400">Uses the existing image prompt library for scene details and stores video movement choices alongside it. Nothing is added to your prompt until you apply it.</p>
    {loading ? <p className="mt-3 text-sm">Loading library…</p> : <div className="mt-4 space-y-4">
      {mode==='text_video' && <label className="block space-y-1 text-sm">Scene / subject description<textarea className={FIELD} rows={2} value={scene} onChange={event=>setScene(event.target.value)} placeholder="Describe the subject, wardrobe and location…"/></label>}
      {sharedOptions.length>0 && <label className="block space-y-1 text-sm">Reuse an existing image-library choice (optional)<select className={FIELD} value={shared} onChange={event=>setShared(event.target.value)}><option value="">No shared choice</option>{sharedOptions.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select></label>}
      <div className="grid gap-3 sm:grid-cols-2">{Object.keys(DEFAULTS).map(key=><label key={key} className="block space-y-1 text-sm">{SECTION_LABELS[key]}<select className={FIELD} value={selection[key]} onChange={event=>setSelection(prev=>({...prev,[key]:event.target.value}))}>{options[key].map(item=><option key={item.value} value={item.value}>{item.label}</option>)}</select></label>)}</div>
      <label className="block space-y-1 text-sm">Motion intensity<select className={FIELD} value={intensity} onChange={event=>setIntensity(event.target.value)}>{['subtle','natural','dynamic'].map(item=><option key={item}>{item}</option>)}</select></label>
      <label className="block space-y-1 text-sm">Additional instructions<textarea className={FIELD} rows={2} value={custom} onChange={event=>setCustom(event.target.value)} placeholder="Optional timing, gestures, or other details…"/></label>
      <div className="rounded-lg border hairline p-3"><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Preview</p><p className="text-sm whitespace-pre-wrap">{preview}</p></div>
      <button type="button" className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-black disabled:opacity-40" disabled={disabled} onClick={()=>onApply(preview)}>Use this prompt</button>
      <details className="border-t border-zinc-700/50 pt-3"><summary className="cursor-pointer text-sm text-cyan-200">Save a custom video choice</summary><div className="mt-3 grid gap-2"><label className="text-sm">Category<select className={FIELD} value={category} onChange={event=>setCategory(event.target.value)}>{Object.keys(DEFAULTS).map(key=><option value={key} key={key}>{SECTION_LABELS[key]}</option>)}</select></label><input className={FIELD} aria-label="Preset name" placeholder="Preset name" value={newLabel} onChange={event=>setNewLabel(event.target.value)}/><textarea className={FIELD} aria-label="Preset instructions" placeholder="What should happen in the video?" value={newKeywords} onChange={event=>setNewKeywords(event.target.value)}/><button type="button" className="rounded-lg border hairline px-3 py-2 text-sm text-cyan-200 disabled:opacity-40" disabled={busy||disabled} onClick={saveChoice}>{busy?'Saving…':'Save to prompt library'}</button></div></details>
      {message && <p role="status" className="text-xs text-zinc-300">{message}</p>}
    </div>}
  </details>;
}
