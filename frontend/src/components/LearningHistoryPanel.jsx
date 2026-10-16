import {useEffect, useRef, useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {Link} from 'react-router-dom';
import {endpoints} from '@/lib/api';

export default function LearningHistoryPanel({context, settings, onApply, blocked = ''}) {
  const [open,setOpen] = useState(false);
  const [busy,setBusy] = useState(false);
  const [message,setMessage] = useState('');
  const [undo,setUndo] = useState(null);
  const alive=useRef(true), current=useRef(settings), guard=useRef(blocked);
  current.current=settings;guard.current=blocked;
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
  const history=useQuery({queryKey:['learning-history',context],queryFn:()=>endpoints.learningHistory(context),
    enabled:open, refetchOnWindowFocus:false, retry:false});
  const decide=async(item,action)=>{
    const before={width:current.current.width,height:current.current.height};
    setBusy(true);setMessage('');
    try {
      const response=await endpoints.learningDecision(item.id,{context,action});
      if(!alive.current)return;
      if(action==='applied') {
        if(guard.current) {
          setMessage('Application is blocked for the current setup. No image size was changed.');
        } else if(current.current.width!==before.width || current.current.height!==before.height) {
          setMessage('Image size changed while approving. Review it and apply again.');
        } else {
          const next=response.recommendation.settings;
          setUndo({before,after:next,item});onApply(next);
          setMessage('Image size applied for the next render. Other settings are unchanged.');
        }
      } else setMessage(action==='dismissed'?'Recommendation dismissed.':'Recommendation restored.');
      await history.refetch();
    } catch(error) {
      if(alive.current)setMessage(error?.response?.data?.detail || 'Could not save the decision. Nothing was applied; try again.');
    } finally {if(alive.current)setBusy(false);}
  };
  const canUndo=undo && settings.width===undo.after.width && settings.height===undo.after.height;
  const items=history.data?.recommendations || [];
  return <details className="rounded-lg border border-violet-500/30 bg-violet-500/5 p-3 text-xs" onToggle={event=>setOpen(event.currentTarget.open)} data-testid="learning-history">
    <summary className="cursor-pointer font-semibold text-violet-200">Learning History · framing recommendations</summary>
    <p className="mt-2 text-zinc-400">Learns patterns from your saved Gallery feedback for this workflow, framing and sampling setup. Suggestions change image size only, after you approve them. They never change character selections or locks.</p>
    <p className="mt-2 text-zinc-400">Requires at least 3 matched results across 2 prompts, with at least 75% marked matched at that size. Repeated copies of the same prompt and seed count once. These are observed patterns, not proof that image size caused the result.</p>
    <button type="button" disabled={busy || history.isFetching} onClick={()=>history.refetch()} className="mt-2 rounded border hairline px-2 py-1.5 disabled:opacity-40">{history.isFetching?'Checking history…':'Refresh learning history'}</button>
    {history.isError && <p role="alert" className="mt-2 text-amber-200">Could not load Learning History. Refresh to try again.</p>}
    {history.data && <p className="mt-2 text-zinc-400">{history.data.reviewed_examples} eligible reviewed results for this setup. {history.data.history_limited && 'Checking the most recent 2,000 rated renders.'}</p>}
    {history.data && !items.length && <p className="mt-2">No supported pattern yet. Rate framing in Gallery after rendering. Older renders without recorded workflow context cannot contribute.</p>}
    {blocked && <p className="mt-2 text-amber-200">{blocked}</p>}
    <div className="mt-3 space-y-3">{items.filter(item=>item.decision!=='dismissed').map(item=>{
      const same=settings.width===item.settings.width && settings.height===item.settings.height;
      return <article key={item.id} className="rounded border hairline p-3">
        <h4 className="font-semibold">Try {item.settings.width} × {item.settings.height}</h4>
        <p className="mt-1">Framing matched in {item.matched} of {item.reviewed} reviewed results across {item.distinct_prompts} successful prompts.</p>
        {item.pairwise && <p className="mt-2 text-violet-200">Size comparisons: B preferred {item.pairwise.B} of {item.pairwise.total}; A preferred {item.pairwise.A}, tied {item.pairwise.tie}, neither {item.pairwise.neither}.</p>}
        {item.decision==='applied' && <p className="mt-1 text-violet-200">Previously approved</p>}
        <details className="mt-2"><summary className="cursor-pointer">Evidence and model files</summary>
          <p className="mt-2 break-words text-zinc-400">{item.models.join(', ') || 'Workflow model files'}</p>
          <ul className="mt-2 space-y-1">{item.evidence.map(example=><li key={example.id}><Link to={`/gallery?render=${encodeURIComponent(example.id)}`} className="text-cyan-200 underline">{example.id.slice(0,8)} · {example.rating}</Link></li>)}</ul>
          <p className="mt-2 text-zinc-400">Model grouping uses filenames and workflow settings, not file-content hashes. No image analysis or model training runs here.</p>
        </details>
        <div className="mt-3 flex flex-wrap gap-2"><button type="button" disabled={busy || !!blocked || same} onClick={()=>decide(item,'applied')} className="rounded border border-violet-400/40 px-3 py-2 disabled:opacity-40">{same?'Already selected':'Apply image size'}</button>
          <button type="button" disabled={busy} onClick={()=>decide(item,'dismissed')} className="rounded border hairline px-3 py-2 disabled:opacity-40">Dismiss</button></div>
      </article>;
    })}</div>
    {items.some(item=>item.decision==='dismissed') && <details className="mt-3"><summary className="cursor-pointer">Dismissed recommendations</summary>{items.filter(item=>item.decision==='dismissed').map(item=><div key={item.id} className="mt-2 flex items-center justify-between gap-2"><span>{item.settings.width} × {item.settings.height}</span><button type="button" disabled={busy} onClick={()=>decide(item,'active')} className="rounded border hairline px-2 py-1.5">Restore recommendation</button></div>)}</details>}
    {undo && <button type="button" disabled={!canUndo || busy || !!blocked} onClick={()=>{onApply(undo.before);setUndo(null);setMessage('Previous image size restored.');}} className="mt-3 rounded border hairline px-3 py-2 disabled:opacity-40">Undo image size</button>}
    {undo && !canUndo && <p className="mt-2 text-zinc-400">Image size changed since applying. Undo is disabled to preserve your edits.</p>}
    <div className="mt-3 text-zinc-400"><Link to="/gallery" className="text-cyan-200 underline">Compare a saved render in Gallery</Link><p className="mt-1">Open an image and expand Compare image sizes to test a new size with its saved prompt and seed.</p></div>
    {history.data?.comparison_history_limited && <p className="mt-2 text-zinc-400">Comparison summaries check the most recent 2,000 tests for this setup.</p>}
    {!!history.data?.comparison_history?.length && <details className="mt-3"><summary className="cursor-pointer">Recent size comparisons</summary><ul className="mt-2 space-y-1">{history.data.comparison_history.map(pair=><li key={pair.id}><Link to={`/compare/${pair.id}`} className="text-cyan-200 underline">B {pair.target.width} × {pair.target.height} · {pair.assessment?.preference || 'not assessed'}</Link></li>)}</ul></details>}
    <p role="status" className="mt-2">{message}</p>
  </details>;
}
