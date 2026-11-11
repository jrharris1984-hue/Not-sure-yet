import { useAssistantResearch, updateAssistantResearch } from '@/lib/assistantResearch';
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { endpoints } from '@/lib/api';
import UniversalLoraPicker from '@/components/UniversalLoraPicker';
import VideoModeLinks from '@/components/VideoModeLinks';
import VideoPromptBuilder from '@/components/VideoPromptBuilder';
import AIResearchPanel from '@/components/AIResearchPanel';
import { WebPromptResearchOptions, PromptResearchNotes } from '@/components/WebPromptResearch';
import { FREEFORM_MODES, freeformPayload, freeformWorkflows } from '@/lib/freeformGeneration';

const field = 'w-full rounded-lg border hairline bg-elevated px-3 py-2 text-sm';
export default function FreeformCreate({ mode = 'image' }) {
  return <FreeformWorkspace key={mode} mode={mode}/>;
}

function FreeformWorkspace({ mode }) {
  const config = FREEFORM_MODES[mode];
  const location = useLocation();
  const galleryInitial = mode === 'video' ? location.state?.galleryReference : null;
  const [galleryOpen,setGalleryOpen] = useState(false);
  const [galleryImages,setGalleryImages] = useState([]);
  const [galleryLoading,setGalleryLoading] = useState(false);
  const [aiProvider, setAiProvider] = useState('AI');
  useEffect(() => {
    let live = true;
    endpoints.settings().then(settings => { if (live) setAiProvider(settings.ai_provider === 'ollama' ? 'Ollama' : 'Venice'); }).catch(() => {});
    return () => { live = false; };
  }, []);
  const [workflows, setWorkflows] = useState([]), [workflowId, setWorkflowId] = useState('');
  const [prompt, setPrompt] = useState(''), [negative, setNegative] = useState('');
  const [source, setSource] = useState(galleryInitial || null), [preview, setPreview] = useState(mode === 'video' ? location.state?.previewUrl || '' : '');
  const [suggestion, setSuggestion] = useState(null), [busy, setBusy] = useState('');
  const [error, setError] = useState(''), [queued, setQueued] = useState(false), [loading, setLoading] = useState(true);
  const [seed, setSeed] = useState(''), [width, setWidth] = useState(640), [height, setHeight] = useState(640);
  const [firstLora, setFirstLora] = useState({name:'',strength:0.8,triggerWords:[]});
  const [secondLora, setSecondLora] = useState({name:'',strength:0.8,triggerWords:[]});
  const [showSecondLora, setShowSecondLora] = useState(false);
  const [frames, setFrames] = useState(81), [fps, setFps] = useState(24);
  const {enabled:useWebResearch,focus:researchFocus}=useAssistantResearch();
  const setUseWebResearch=value=>updateAssistantResearch({enabled:value,result:null});
  const setResearchFocus=value=>updateAssistantResearch({focus:value,result:null});
  // A new Gallery selection can arrive while the video workspace stays mounted.
  useEffect(() => {
    if (mode !== 'video' || !location.state?.galleryReference) return;
    setSource(location.state.galleryReference);
    setPreview(location.state.previewUrl || '');
    setQueued(false);
  }, [mode, location.key, location.state?.galleryReference, location.state?.previewUrl]);
  const previewRef = useRef('');
  const mounted = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    let live = true;
    endpoints.listWorkflows().then(list => {
      if (!live) return;
      const available = freeformWorkflows(list, mode);
      setWorkflows(available); setWorkflowId(available[0]?.id || '');
    }).catch(err => live && setError(err.response?.data?.detail || 'Could not load workflows.'))
      .finally(() => live && setLoading(false));
    return () => { live = false; };
  }, [mode]);
  useEffect(() => () => { if (previewRef.current) URL.revokeObjectURL(previewRef.current); }, []);
  const workflow = workflows.find(item => item.id === workflowId);
  const run = async (action, task) => {
    setBusy(action); setError('');
    try { await task(); } catch (err) { setError(err.response?.data?.detail || err.message || 'The request failed.'); }
    finally { setBusy(''); }
  };
  const assist = () => run('AI', async () => {
    const result = mode === 'image'
      ? await endpoints.aiImproveGeneratedPrompt(prompt, negative, workflow.prompt_style, workflow.name, true, ...(useWebResearch ? [{use_web_research:true,research_focus:researchFocus}] : []))
      : await endpoints.aiVideoPrompt(prompt, mode === 'video' ? 'image' : 'text', ...(useWebResearch ? [{use_web_research:true,research_focus:researchFocus}] : []));
    if (!mounted.current) return;
    const positive = result.positive || result.prompt;
    if (!positive?.trim()) throw new Error('AI returned an empty prompt. Try again.');
    setSuggestion({ ...result, positive, negative: result.negative ?? negative });
  });
  const upload = event => {
    const file = event.target.files?.[0]; event.target.value = ''; if (!file) return;
    run('Upload', async () => {
      const uploaded = await endpoints.uploadReferenceImage(file);
      if (!mounted.current) return;
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
      previewRef.current = URL.createObjectURL(file); setPreview(previewRef.current); setSource(uploaded); setQueued(false);
    });
  };
  const openGallery = async () => {
    setGalleryOpen(true);setGalleryLoading(true);setError('');
    try {
      const items=await endpoints.listRenders();
      setGalleryImages(items.filter(item=>item.status==='done' && (item.output_variants?.enhanced?.[0] || item.output_files?.[0]) && !/\.(mp4|webm|mov)(?:\?|$)/i.test(item.output_variants?.enhanced?.[0] || item.output_files?.[0])));
    }catch(error){setError(error.response?.data?.detail || 'Unable to load Gallery images.');}
    finally{setGalleryLoading(false);}
  };
  const chooseGalleryImage = render => run('Gallery',async()=>{
    const original=render.output_variants?.enhanced?.[0] || render.output_files?.[0];
    const prepared=await endpoints.prepareRenderReference(render.id,original);
    if(!mounted.current)return;
    if(previewRef.current){URL.revokeObjectURL(previewRef.current);previewRef.current='';}
    const url=new URL(original,window.location.origin);
    const query=url.searchParams;
    const display=query.has('filename') ? `${window.location.origin}/api/comfyui/media?${new URLSearchParams({filename:query.get('filename'),subfolder:query.get('subfolder')||'',type:query.get('type')||'output'})}` : original;
    setSource(prepared);setPreview(display);setGalleryOpen(false);setQueued(false);
  });
  const generate = () => run('Generate', async () => {
    setQueued(false);
    const result = await endpoints.dispatchRender(freeformPayload({ mode, workflow, prompt, negative, source, seed, width, height, frames, fps, loras: [firstLora, ...(showSecondLora ? [secondLora] : [])] }));
    if (['failed', 'offline'].includes(result.status)) throw new Error(result.error || 'Generation could not start.');
    setQueued(true);
  });
  return <div className="mx-auto max-w-4xl space-y-5 p-4 sm:p-6" data-testid="freeform-create">
    <Link to="/create" className="text-sm text-cyan-300">← Create</Link>
    <header><h1 className="font-display text-3xl font-bold">{config.title}</h1><p className="mt-2 text-zinc-400">{config.description} Write freely or let AI help refine your prompt.</p></header>
    {mode !== 'image' && <VideoModeLinks mode={mode}/>}
    {error && <p role="alert" className="rounded-lg border border-red-400/30 p-3 text-red-200">{error}</p>}
    <section className="pane space-y-4 p-4">
      <label className="block space-y-1">Workflow<select aria-label="Workflow" className={field} value={workflowId} disabled={!!busy} onChange={e => { setWorkflowId(e.target.value); setSuggestion(null); setFirstLora({name:'',strength:0.8,triggerWords:[]}); setSecondLora({name:'',strength:0.8,triggerWords:[]}); setShowSecondLora(false); setQueued(false); }}>
        {workflows.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
      </select></label>
      {loading ? <p>Loading workflows…</p> : !workflows.length && <p>No compatible workflow is available. <Link to="/settings" className="text-cyan-300 underline">Refresh bundled workflows in Settings</Link>.</p>}
      {mode === 'video' && <div className="space-y-2"><button type="button" className="rounded-lg border border-cyan-400/40 px-3 py-2 text-sm text-cyan-200" disabled={!!busy} onClick={openGallery}>Choose from Gallery</button>{galleryOpen && <div className="rounded-lg border hairline p-3 space-y-3"><div className="flex justify-between"><strong className="text-sm">Select a Gallery image</strong><button type="button" onClick={()=>setGalleryOpen(false)}>Close</button></div>{galleryLoading?<p>Loading images…</p>:<div className="grid max-h-72 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">{galleryImages.map(render=>{const original=render.output_variants?.enhanced?.[0] || render.output_files?.[0];let display=original;try{const u=new URL(original,window.location.origin);if(u.searchParams.has("filename"))display=`${window.location.origin}/api/comfyui/media?${new URLSearchParams({filename:u.searchParams.get("filename"),subfolder:u.searchParams.get("subfolder")||"",type:u.searchParams.get("type")||"output"})}`;}catch{}return <button type="button" key={render.id} disabled={!!busy} onClick={()=>chooseGalleryImage(render)} className="overflow-hidden rounded-lg border hairline"><img src={display} alt="Gallery render" loading="lazy" className="aspect-square w-full object-cover"/></button>;})}</div>}{!galleryLoading&&!galleryImages.length&&<p className="text-xs text-zinc-400">No completed images found.</p>}</div>}<label className="block">Starting image<input aria-label="Starting image" type="file" accept="image/png,image/jpeg,image/webp" disabled={!!busy} onChange={upload} className="block mt-2 text-sm"/></label>
        {preview && <><img src={preview} alt="Starting frame" className="max-h-64 rounded-lg object-contain"/><button disabled={!!busy} onClick={() => { if(previewRef.current) URL.revokeObjectURL(previewRef.current); previewRef.current = ''; setPreview(''); setSource(null); }}>Remove image</button></>}</div>}
      <label className="block space-y-1">{mode === 'video' ? 'Movement and camera prompt' : 'Your prompt'}<textarea aria-label="Your prompt" className={field} rows={7} value={prompt} disabled={!!busy} onChange={e => { setPrompt(e.target.value); setSuggestion(null); setQueued(false); }} placeholder={mode === 'video' ? 'Describe how the subject moves and how the camera follows.' : 'Describe the scene, subjects, style, lighting, and composition.'}/></label>
      {mode !== 'image' && <VideoPromptBuilder mode={mode} disabled={!!busy} onApply={value => {setPrompt(value);setSuggestion(null);setQueued(false);}}/>}
      {mode === 'image' && workflow && <details><summary className="cursor-pointer text-zinc-300">Optional LoRAs · up to two</summary>
        <fieldset disabled={!!busy} className="mt-3 space-y-3">
          <UniversalLoraPicker workflow={workflow} value={firstLora} onChange={setFirstLora} slotLabel="LoRA 1" excludedNames={secondLora.name ? [secondLora.name] : []}/>
          {showSecondLora && <UniversalLoraPicker workflow={workflow} value={secondLora} onChange={setSecondLora} slotLabel="LoRA 2" excludedNames={firstLora.name ? [firstLora.name] : []}/>}
          <button type="button" className="text-sm text-cyan-300" onClick={() => {setShowSecondLora(!showSecondLora); setSecondLora({name:'',strength:0.8,triggerWords:[]});}}>{showSecondLora ? 'Remove second LoRA' : 'Add second LoRA'}</button>
          <p className="text-xs text-zinc-400">Adjust each strength and its trigger words separately. Model-family matching is a guide; confirm compatibility on the model page. Compare a base render with each LoRA individually before combining them.</p>
        </fieldset>
      </details>}
      {mode === 'image' && ['qwen_image','qwen_rapid'].includes(workflow?.prompt_style) && <button disabled={!!busy} className="text-sm text-cyan-300" onClick={() => {setPrompt('Photograph of an adult wearing a fully clothed casual outfit, natural proportions, relaxed standing pose, realistic skin texture, soft daylight, clear hands and feet, simple background.'); setSuggestion(null); setQueued(false);}}>Use clothed portrait test prompt</button>}
      <button className="rounded-lg border border-cyan-400/40 px-4 py-2 text-cyan-200" disabled={!!busy || !prompt.trim() || !workflow} onClick={assist}>Refine with {aiProvider}</button>
      <WebPromptResearchOptions enabled={useWebResearch} onEnabled={setUseWebResearch} focus={researchFocus} onFocus={setResearchFocus} disabled={!!busy}/>
      <p className="text-xs text-zinc-400">Uses your prompt assistant from Settings. Review the suggestion before applying it.</p>
      {suggestion && <section className="space-y-3 rounded-lg border border-cyan-400/30 p-3" aria-label="AI suggestion"><h2 className="font-semibold">AI suggestion</h2><textarea aria-label="Suggested prompt" className={field} rows={6} value={suggestion.positive} onChange={e => setSuggestion({ ...suggestion, positive: e.target.value })}/>
        <PromptResearchNotes result={suggestion}/>
        {suggestion.negative !== negative && <label className="block">Suggested negative prompt<textarea aria-label="Suggested negative prompt" className={field} value={suggestion.negative} onChange={e => setSuggestion({ ...suggestion, negative: e.target.value })}/></label>}
        <div className="flex gap-3"><button disabled={!!busy || !suggestion.positive.trim()} onClick={() => { setPrompt(suggestion.positive); setNegative(suggestion.negative); setSuggestion(null); setQueued(false); }}>Apply suggestion</button><button disabled={!!busy} onClick={() => setSuggestion(null)}>Discard</button></div></section>}
      <details><summary className="cursor-pointer text-zinc-300">Output settings & negative prompt</summary><div className="mt-3 space-y-3">
        <label className="block">Negative prompt (optional)<textarea aria-label="Negative prompt" className={field} value={negative} disabled={!!busy} onChange={e => setNegative(e.target.value)}/></label>
        <p className="text-xs text-zinc-400">Some workflows use zeroed negative conditioning; their negative text has no effect. Sampling settings come from the selected workflow.</p>
        <div className="grid grid-cols-2 gap-3">{[['Width', width, setWidth], ['Height', height, setHeight]].map(([label, value, setter]) => <label key={label}>{label}<select aria-label={label} className={field} value={value} disabled={!!busy} onChange={e => setter(Number(e.target.value))}>{[512,640,768,1024].map(size => <option key={size} value={size}>{size}</option>)}</select></label>)}</div>
        <label className="block">Seed (blank = random)<input aria-label="Seed" className={field} value={seed} disabled={!!busy} onChange={e => setSeed(e.target.value)}/></label>
        {mode !== 'image' && <div className="grid grid-cols-2 gap-3"><label>Duration<select aria-label="Duration" className={field} disabled={!!busy} value={frames} onChange={e => setFrames(Number(e.target.value))}>{[41,81,121,161,201,241].map(n => <option key={n} value={n}>{((n-1)/fps).toFixed(1)} seconds · {n} frames</option>)}</select></label><label>Playback FPS<select aria-label="Playback FPS" className={field} disabled={!!busy} value={fps} onChange={e => setFps(Number(e.target.value))}>{[16,20,24,30].map(n => <option key={n}>{n}</option>)}</select></label></div>}
      </div></details>
      <button className="rounded-lg bg-cyan-400 px-5 py-2 font-semibold text-black disabled:opacity-40" disabled={!!busy || !workflow || !prompt.trim() || (mode === 'video' && !source)} onClick={generate}>{busy ? `${busy}…` : 'Generate'}</button>
      {queued && <p role="status" className="text-emerald-300">Queued. <Link to="/queue" className="underline">View progress</Link> · <Link to="/gallery" className="underline">Open Gallery</Link></p>}
    </section>
    <AIResearchPanel context={prompt} onApply={value => {setPrompt(value);setSuggestion(null);setQueued(false);}} />
  </div>;
}
