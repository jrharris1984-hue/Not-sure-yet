import {useMemo,useState} from 'react';
import {buildPhysiqueComparison} from '@/lib/physiqueComparison3';
export default function PhysiqueComparison3({baseline,current,region}){
 const [seed,setSeed]=useState('12345');
 const [pose,setPose]=useState('standing');
 const [subjectView,setSubjectView]=useState('front');
 const [cameraAngle,setCameraAngle]=useState('eye-level');
 const [workflowId,setWorkflowId]=useState('');
 const [status,setStatus]=useState('');
 const plan=useMemo(()=>buildPhysiqueComparison({baseline,candidate:current,region,seed,pose,subjectView,cameraAngle,workflowId}),[baseline,current,region,seed,pose,subjectView,cameraAngle,workflowId]);
 const copy=async()=>{
  try{await navigator.clipboard.writeText(JSON.stringify(plan,null,2));setStatus('Comparison recipe copied.');}
  catch{setStatus('Clipboard unavailable; select and copy the recipe below.');}
 };
 return <details className="rounded-lg border border-amber-500/40 p-3 space-y-3" data-testid="physique3-comparison">
  <summary className="cursor-pointer font-semibold text-amber-200">A/B Character Comparison Lab</summary>
  <p className="text-xs text-zinc-400 mt-2">Plan two controlled renders with identical seed, pose, camera and workflow. This panel does not queue or generate images yet.</p>
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
   <label className="text-xs">Fixed seed<input type="number" value={seed} onChange={e=>setSeed(e.target.value)} className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 p-2"/></label>
   <label className="text-xs">Workflow ID (optional)<input value={workflowId} onChange={e=>setWorkflowId(e.target.value)} placeholder="Select later at generation" className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 p-2"/></label>
   <label className="text-xs">Fixed pose<select value={pose} onChange={e=>setPose(e.target.value)} className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 p-2">{['standing','seated','walking','side profile standing'].map(x=><option key={x}>{x}</option>)}</select></label>
   <label className="text-xs">Subject view<select value={subjectView} onChange={e=>setSubjectView(e.target.value)} className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 p-2">{['front','back','left profile','right profile','rear left three-quarter','rear right three-quarter'].map(x=><option key={x}>{x}</option>)}</select></label>
   <label className="text-xs">Camera angle<select value={cameraAngle} onChange={e=>setCameraAngle(e.target.value)} className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 p-2">{['eye-level','slightly low','slightly high','knee level'].map(x=><option key={x}>{x}</option>)}</select></label>
  </div>
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
   {plan.frames.map(frame=><div key={frame.id} className="rounded-lg border border-zinc-700 bg-zinc-900 p-3"><strong className="text-sm">{frame.id} · {frame.label}</strong><p className="text-xs text-zinc-400 mt-1">{frame.id==='A'?'Starting values for the selected region':'Current values for the selected region'}</p><div className="mt-2 space-y-1 text-xs">{plan.changes.length?plan.changes.map(row=><div key={row.key} className="flex justify-between gap-2"><span>{row.key.replaceAll('_',' ')}</span><span className="font-mono">{frame.id==='A'?row.before:row.after}</span></div>):<p>No differences to compare.</p>}</div></div>)}
  </div>
  <p className="text-xs text-zinc-400">{plan.changes.length} changed fields in {region}. Both recipes retain the same character DNA outside this region.</p>
  <button type="button" onClick={copy} className="rounded-lg border border-amber-500 px-3 py-2 text-sm text-amber-200">Copy A/B comparison recipe</button>
  {status&&<p role="status" className="text-xs">{status}</p>}
  <details className="mt-2"><summary className="cursor-pointer text-xs text-zinc-400">View comparison JSON</summary><textarea readOnly rows={8} className="w-full mt-2 rounded-lg bg-zinc-950 border border-zinc-700 text-xs p-2" value={JSON.stringify(plan,null,2)}/></details>
 </details>;
}
