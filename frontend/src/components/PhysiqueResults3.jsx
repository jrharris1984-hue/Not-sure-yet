import {useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {endpoints} from '@/lib/api';
import {comparisonImageUrl,comparisonJobStatus} from '@/lib/physiqueComparisonResults3';
export default function PhysiqueResults3({jobs=[]}){
 const [zoom,setZoom]=useState(false);
 const [preferred,setPreferred]=useState('');
 const {data:queue=[],isError}=useQuery({queryKey:['physique3-comparison-queue',jobs.map(j=>j.id).join(':')],queryFn:endpoints.listQueue,enabled:jobs.some(j=>j.id),refetchInterval:5000});
 const results=comparisonJobStatus(jobs,queue);
 return <section className="mt-3 space-y-3" aria-label="A/B comparison results">
  <div className="flex items-center justify-between gap-2"><strong className="text-sm">A/B Render Results</strong><label className="text-xs"><input type="checkbox" checked={zoom} onChange={e=>setZoom(e.target.checked)}/> Zoom images</label></div>
  {isError&&<p className="text-xs text-amber-300">Queue status is temporarily unavailable.</p>}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{results.map((job,i)=>{
   const url=comparisonImageUrl(job);
   return <article key={job.id||i} className="rounded-lg border border-zinc-700 bg-zinc-950 p-2 space-y-2">
    <div className="flex justify-between text-xs"><strong>{job.label}</strong><span>{job.status||'submitted'}</span></div>
    {url?<div className={`overflow-auto rounded-lg bg-zinc-900 ${zoom?'max-h-[65vh]':'max-h-96'}`}><img src={url} alt={`${job.label} comparison result`} className={zoom?'max-w-none w-[150%]':'w-full object-contain'} loading="lazy"/></div>:<div className="h-40 flex items-center justify-center rounded-lg border border-dashed border-zinc-700 text-xs text-zinc-500">{job.error||'Waiting for image output'}</div>}
    {url&&<button type="button" className={`rounded-lg border px-3 py-2 text-xs ${preferred===job.id?'border-amber-400 text-amber-200':'border-zinc-600'}`} onClick={()=>setPreferred(job.id)}> {preferred===job.id?'Preferred in this session':'Prefer this result'}</button>}
   </article>;
  })}</div>
  {preferred&&<p className="text-xs text-zinc-400">Preference is local to this comparison view; it is not yet saved to character DNA.</p>}
 </section>;
}
