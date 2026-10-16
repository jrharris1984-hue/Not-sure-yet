import {useEffect,useState} from 'react';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {Link,useParams} from 'react-router-dom';
import {API_BASE,endpoints} from '@/lib/api';

function imageUrl(raw) {
  if(!raw)return '';
  try {
    const url=new URL(raw,window.location.origin),filename=url.searchParams.get('filename');
    if(filename && url.pathname.endsWith('/view'))return `${API_BASE}/comfyui/media?${new URLSearchParams({filename,subfolder:url.searchParams.get('subfolder')||'',type:url.searchParams.get('type')||'output'})}`;
  } catch { /* Render records may also contain ordinary relative image paths. */ }
  return raw;
}

function ComparisonImage({url,label}) {
  const [failed,setFailed]=useState(false);
  useEffect(()=>setFailed(false),[url]);
  return failed?<p className="p-6 text-sm text-amber-200">Image {label} could not load. Open it in Gallery or reload this page before judging.</p>:<img src={url} alt={`Comparison ${label}`} onError={()=>setFailed(true)} className="max-h-[65vh] w-full object-contain"/>;
}

function Preference({comparison}) {
  const [choice,setChoice]=useState(comparison.assessment?.preference || ''),[notes,setNotes]=useState(comparison.assessment?.notes || '');
  const [busy,setBusy]=useState(false),[message,setMessage]=useState('');
  const qc=useQueryClient();
  const save=async()=>{
    setBusy(true);setMessage('');
    try {
      const assessment=await endpoints.saveComparisonPreference(comparison.id,{preference:choice,notes});
      qc.setQueryData(['learning-comparison',comparison.id],current=>current?{...current,assessment}:current);
      qc.invalidateQueries({queryKey:['learning-history']});qc.invalidateQueries({queryKey:['render-comparisons']});
      setMessage('Preference saved. Framing ratings in Gallery are unchanged.');
    } catch(error){setMessage(error?.response?.data?.detail || 'Could not save your preference. Your choice is still here; try again.');}
    finally{setBusy(false);}
  };
  return <section className="pane p-4 space-y-3" aria-label="Comparison preference">
    <h2 className="font-semibold">Which result has better framing?</h2>
    <fieldset disabled={busy || !comparison.ready} className="flex flex-wrap gap-4 text-sm">
      {[['A','Prefer A'],['B','Prefer B'],['tie','Tie'],['neither','Neither']].map(([value,label])=><label key={value} className="flex items-center gap-2"><input type="radio" name="comparison-preference" value={value} checked={choice===value} onChange={()=>{setChoice(value);setMessage('');}}/>{label}</label>)}
    </fieldset>
    <label className="block text-sm">Notes · optional<textarea aria-label="Comparison notes" maxLength={2000} rows={2} disabled={busy || !comparison.ready} value={notes} onChange={event=>setNotes(event.target.value)} className="mt-1 block w-full rounded border hairline bg-elevated p-2"/></label>
    <button type="button" disabled={busy || !choice || !comparison.ready} onClick={save} className="rounded border border-violet-400/40 px-3 py-2 text-sm disabled:opacity-40">{busy?'Saving…':'Save preference'}</button>
    <p role="status" className="text-sm text-zinc-300">{message}</p>
  </section>;
}

export default function LearningComparison() {
  const {id}=useParams();
  const query=useQuery({queryKey:['learning-comparison',id],queryFn:()=>endpoints.getComparison(id),retry:false,
    refetchInterval:state=>{
      const pair=state.state.data;
      return pair && !pair.ready && ['queued','dispatching','running','offline'].includes(pair.sides.B.status)?2000:false;
    }});
  if(query.isPending)return <p className="p-6">Loading comparison…</p>;
  if(query.isError)return <div className="p-6 space-y-3"><p role="alert">Could not load the comparison.</p><button onClick={()=>query.refetch()} className="rounded border hairline px-3 py-2">Try again</button><Link to="/gallery" className="ml-3 text-cyan-200">Gallery</Link></div>;
  const pair=query.data;
  return <main className="mx-auto max-w-6xl space-y-4 p-3 sm:p-6">
    <Link to={`/gallery?render=${encodeURIComponent(pair.source_render_id)}`} className="text-sm text-cyan-200">Back to source image</Link>
    <header><h1 className="text-xl font-semibold">Image-size comparison</h1><p className="mt-1 text-sm text-zinc-400">{pair.workflow_name} · same prompt and seed {pair.seed}. B changes image size. A is the saved source; both show the same output stage ({pair.output_kind || 'output'}).</p></header>
    <div className="grid gap-4 md:grid-cols-2">{['A','B'].map(label=>{
      const side=pair.sides[label],url=imageUrl(side.output_files?.[0]);
      return <section key={label} className="pane overflow-hidden rounded-xl" aria-label={`Image ${label}`}>
        <h2 className="border-b hairline p-3 font-semibold">{label} · {label==='A'?'Saved baseline':'New size'} · canvas {side.dimensions.width} × {side.dimensions.height}</h2>
        <div className="flex min-h-48 items-center justify-center bg-black/30 p-2">{url?<ComparisonImage url={url} label={label}/>:<p className="p-6 text-sm text-zinc-400">{side.status}{side.error?` · ${side.error}`:''}</p>}</div>
        {side.render_id && <Link to={`/gallery?render=${encodeURIComponent(side.render_id)}`} className="block p-3 text-sm text-cyan-200">Open {label} in Gallery</Link>}
      </section>;
    })}</div>
    {!pair.ready && <p role="status" className="pane p-3 text-sm text-amber-200">{pair.sides.B.error || pair.integrity_error} Preference saving is available only when both images form a verified pair. <Link to="/queue" className="underline">Open queue</Link></p>}
    <Preference key={pair.id} comparison={pair}/>
    <p className="text-xs text-zinc-400">Size can change composition even with the same seed. A preference is relative; it does not mark either image as a successful framing match or train an image model.</p>
  </main>;
}
