import {useState} from 'react';
import {useQueryClient} from '@tanstack/react-query';
import {preferredPhysiquePatch3} from '@/lib/physiqueComparisonPreference3';
import {useQuery} from '@tanstack/react-query';
import {endpoints} from '@/lib/api';
import {comparisonImageUrl,comparisonJobStatus} from '@/lib/physiqueComparisonResults3';
export default function PhysiqueResults3({jobs=[],character,region}){
 const [zoom,setZoom]=useState(false);
 const [preferred,setPreferred]=useState('');
 const [saving,setSaving]=useState('');
 const [saveError,setSaveError]=useState('');
 const queryClient=useQueryClient();
 const {data:queue=[],isError}=useQuery({queryKey:['physique3-comparison-queue',jobs.map(j=>j.id).join(':')],queryFn:endpoints.listQueue,enabled:jobs.some(j=>j.id),refetchInterval:5000});
 const results=comparisonJobStatus(jobs,queue);
 const savePreference=async job=>{
  if(!character?.id||!region||!job?.dna)return;
  setSaving(job.id);setSaveError('');
  try{
   const latest=await endpoints.getCharacter(character.id);
   await endpoints.updateCharacter(character.id,preferredPhysiquePatch3(latest,job.dna,region));
   setPreferred(job.id);await Promise.all([queryClient.invalidateQueries({queryKey:['character',character.id]}),queryClient.invalidateQueries({queryKey:['characters']})]);
  }catch(error){setSaveError(error?.response?.data?.detail||error.message||'Could not save the preferred physique.');}
  finally{setSaving('');}
 };
 return <section className="mt-3 space-y-3" aria-label="A/B comparison results">
  <div className="flex items-center justify-between gap-2"><strong className="text-sm">A/B Render Results</strong><label className="text-xs"><input type="checkbox" checked={zoom} onChange={e=>setZoom(e.target.checked)}/> Zoom images</label></div>
  {isError&&<p className="text-xs text-amber-300">Queue status is temporarily unavailable.</p>}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{results.map((job,i)=>{
   const url=comparisonImageUrl(job);
   return <article key={job.id||i} className="rounded-lg border border-zinc-700 bg-zinc-950 p-2 space-y-2">
    <div className="flex justify-between text-xs"><strong>{job.label}</strong><span>{job.status||'submitted'}</span></div>
    {url?<div className={`overflow-auto rounded-lg bg-zinc-900 ${zoom?'max-h-[65vh]':'max-h-96'}`}><img src={url} alt={`${job.label} comparison result`} className={zoom?'max-w-none w-[150%]':'w-full object-contain'} loading="lazy"/></div>:<div className="h-40 flex items-center justify-center rounded-lg border border-dashed border-zinc-700 text-xs text-zinc-500">{job.error||'Waiting for image output'}</div>}
    {url&&<button type="button" disabled={!character?.id||saving===job.id} className={`rounded-lg border px-3 py-2 text-xs disabled:opacity-50 ${preferred===job.id?'border-amber-400 text-amber-200':'border-zinc-600'}`} onClick={()=>savePreference(job)}>{saving===job.id?'Saving…':preferred===job.id?'Saved as preferred physique':'Save as preferred physique'}</button>}
   </article>;
  })}</div>
  {preferred&&<p role="status" className="text-xs text-emerald-300">Preferred {region} settings were saved to {character?.name||'the selected character'}.</p>}{saveError&&<p role="alert" className="text-xs text-red-300">{saveError}</p>}
 </section>;
}
