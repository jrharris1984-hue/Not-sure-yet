import {useEffect,useRef,useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {Link,useNavigate} from 'react-router-dom';
import {endpoints} from '@/lib/api';

export default function FramingComparisonPanel({render}) {
  const smaller=value=>Math.max(256,Math.min(2048,Math.round((Number(value)||1024)*.875/8)*8));
  const [open,setOpen]=useState(false),[width,setWidth]=useState(()=>smaller(render.generation_settings?.width)),[height,setHeight]=useState(()=>smaller(render.generation_settings?.height));
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  const request=useRef(null),alive=useRef(true),nav=useNavigate();
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
  const history=useQuery({queryKey:['render-comparisons',render.id],queryFn:()=>endpoints.renderComparisons(render.id),enabled:open,retry:false});
  const options=useQuery({queryKey:['comparison-options',render.id],queryFn:()=>endpoints.comparisonOptions(render.id),enabled:open,retry:false});
  const settings=render.generation_settings || {};
  const create=async()=>{
    const key=JSON.stringify([render.id,width,height]);
    if(request.current?.key!==key)request.current={key,id:globalThis.crypto?.randomUUID?.() || 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,character=>{const value=Math.floor(Math.random()*16);return (character==='x'?value:(value&3|8)).toString(16);})};
    setBusy(true);setError('');
    try {
      const comparison=await endpoints.createComparison({request_id:request.current.id,source_render_id:render.id,width:Number(width),height:Number(height)});
      if(alive.current)nav(`/compare/${comparison.id}`);
    } catch(error){if(alive.current)setError(error?.response?.data?.detail || 'Could not start the comparison. Retry to recover the same request.');}
    finally{if(alive.current)setBusy(false);}
  };
  if(!render.learning_context || !render.render_recipe || render.status!=='done' || (render.workflow_type && render.workflow_type!=='image'))return null;
  return <details className="rounded-lg border border-violet-400/30 bg-violet-500/5 p-3 text-xs" data-testid="framing-comparison-setup" onToggle={event=>setOpen(event.currentTarget.open)}>
    <summary className="cursor-pointer font-semibold text-violet-200">Compare image sizes · A/B test</summary>
    <p className="mt-2 text-zinc-400">A uses this saved image at {settings.width} × {settings.height}. Generate B with the same prompt, seed and sampling settings at a different size. Only B is queued; A is preserved.</p>
    {!!options.data?.recommendations?.length && <label className="mt-3 block">Try a Learning History recommendation<select aria-label="Recommended comparison size" disabled={busy} defaultValue="" onChange={event=>{if(event.target.value){const item=options.data.recommendations.find(item=>item.id===event.target.value);if(item){setWidth(item.settings.width);setHeight(item.settings.height);}}}} className="mt-1 block w-full rounded border hairline bg-elevated p-2"><option value="">Choose a recommended size</option>{options.data.recommendations.map(item=><option key={item.id} value={item.id}>{item.settings.width} × {item.settings.height} · {item.matched}/{item.reviewed} framing matches</option>)}</select></label>}
    <div className="mt-3 flex flex-wrap gap-3"><label>B width<input aria-label="Comparison B width" type="number" min="256" max="2048" step="8" value={width} disabled={busy} onChange={event=>setWidth(Number(event.target.value))} className="mt-1 block w-24 rounded border hairline bg-elevated p-2"/></label>
      <label>B height<input aria-label="Comparison B height" type="number" min="256" max="2048" step="8" value={height} disabled={busy} onChange={event=>setHeight(Number(event.target.value))} className="mt-1 block w-24 rounded border hairline bg-elevated p-2"/></label></div>
    <p className="mt-2 text-zinc-400">Keep any selected camera aspect ratio. Changing size can change composition and details even with the same seed.</p>
    <button type="button" disabled={busy || !Number.isInteger(width) || !Number.isInteger(height) || width<256 || width>2048 || height<256 || height>2048 || width%8!==0 || height%8!==0 || (width===settings.width && height===settings.height)} onClick={create} className="mt-3 rounded border border-violet-400/40 px-3 py-2 disabled:opacity-40">{busy?'Preparing B…':'Generate B and compare'}</button>
    {error && <p role="alert" className="mt-2 text-amber-200">{error}</p>}
    {history.isError && <p className="mt-2 text-amber-200">Could not load previous comparisons.</p>}
    {!!history.data?.length && <div className="mt-3"><p>Previous comparisons</p><ul className="mt-1 space-y-1">{history.data.map(item=><li key={item.id}><Link to={`/compare/${item.id}`} className="text-cyan-200 underline">B {item.target.width} × {item.target.height}{item.assessment?` · ${item.assessment.preference}`:''}</Link></li>)}</ul></div>}
  </details>;
}
