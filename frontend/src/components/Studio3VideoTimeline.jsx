import {useEffect,useState} from 'react';
import {addVideoClip3,moveVideoClip3,removeVideoClip3,timelineDuration3,updateVideoClip3,validateVideoTimeline3,videoTimeline3} from '@/lib/studio3VideoTimeline';

const storageKey=(mode,workflowId)=>'ultrastudio3:video-timeline:'+mode+':'+(workflowId||'default');
const readTimeline=key=>{try{const value=JSON.parse(window.localStorage.getItem(key)||'null');return value?.version===1&&Array.isArray(value.clips)?value:videoTimeline3();}catch{return videoTimeline3();}};
const prettyDuration=seconds=>seconds<60?seconds.toFixed(1)+' sec':Math.floor(seconds/60)+' min '+Math.round(seconds%60)+' sec';
export default function Studio3VideoTimeline({mode,workflow,sourceImage='',disabled=false,onUseClip}){
 const key=storageKey(mode,workflow?.id);
 const [timeline,setTimeline]=useState(()=>readTimeline(key));
 useEffect(()=>{setTimeline(readTimeline(key));},[key]);
 useEffect(()=>{try{window.localStorage.setItem(key,JSON.stringify({...timeline,sourceImage,workflowId:workflow?.id||''}));}catch{/* Timeline storage is optional. */}},[key,timeline,sourceImage,workflow?.id]);
 const errors=validateVideoTimeline3(timeline);
 const patch=(id,changes)=>setTimeline(current=>updateVideoClip3(current,id,changes));
 return <section className="rounded-xl border border-cyan-400/25 bg-zinc-900/40 p-4 space-y-3" aria-label="Video production timeline" data-testid="studio3-video-timeline">
  <div className="flex flex-wrap items-center justify-between gap-2"><div><h2 className="font-semibold text-cyan-200">Video timeline</h2><p className="text-xs text-zinc-400">Edit a sequence of video clips. Queue clips separately with the existing video workflow.</p></div><div className="text-xs text-zinc-300">{timeline.clips.length} clips · {prettyDuration(timelineDuration3(timeline))}</div></div>
  <label className="block text-xs text-zinc-400">Frame rate<select aria-label="Timeline frame rate" className="ml-2 rounded border border-zinc-700 bg-zinc-950 p-2 text-sm text-white" value={timeline.fps} disabled={disabled} onChange={event=>setTimeline(current=>({...current,fps:Number(event.target.value)}))}>{[12,24,30,48,60].map(fps=><option key={fps} value={fps}>{fps} fps</option>)}</select></label>
  {!timeline.clips.length&&<p className="text-xs text-zinc-400">Add a clip to start arranging the sequence.</p>}
  <div className="grid grid-cols-1 gap-3">{timeline.clips.map((clip,index)=><article key={clip.id} className="rounded-lg border border-zinc-700 p-3 space-y-2">
   <div className="flex items-center gap-2"><label className="min-w-0 flex-1 text-sm">Clip name<input aria-label={clip.label+' name'} className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 p-2" value={clip.label} disabled={disabled} onChange={event=>patch(clip.id,{label:event.target.value})}/></label>
    <label className="w-24 text-xs">Frames<input aria-label={clip.label+' frames'} type="number" min="1" max="240" className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 p-2 text-sm" value={clip.frames} disabled={disabled} onChange={event=>patch(clip.id,{frames:event.target.value})}/></label>
    <div className="flex gap-1 pt-4"><button type="button" className="chip" aria-label={'Move '+clip.label+' earlier'} disabled={disabled||index===0} onClick={()=>setTimeline(current=>moveVideoClip3(current,index,index-1))}>↑</button><button type="button" className="chip" aria-label={'Move '+clip.label+' later'} disabled={disabled||index===timeline.clips.length-1} onClick={()=>setTimeline(current=>moveVideoClip3(current,index,index+1))}>↓</button><button type="button" className="chip" aria-label={'Remove '+clip.label} disabled={disabled} onClick={()=>setTimeline(current=>removeVideoClip3(current,clip.id))}>×</button></div>
   </div>
   <label className="block text-sm">Clip prompt<textarea aria-label={clip.label+' prompt'} rows={2} className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 p-2" value={clip.prompt} disabled={disabled} onChange={event=>patch(clip.id,{prompt:event.target.value})} placeholder="Describe this segment."/></label>
   <label className="block text-sm">Motion and camera<textarea aria-label={clip.label+' motion'} rows={2} className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 p-2" value={clip.motion} disabled={disabled} onChange={event=>patch(clip.id,{motion:event.target.value})} placeholder="Describe movement, timing, or camera direction."/></label>
   <button type="button" className="rounded-lg border border-cyan-400/40 px-3 py-2 text-sm text-cyan-200" disabled={disabled||!clip.prompt.trim()&&!clip.motion.trim()} onClick={()=>onUseClip([clip.prompt.trim(),clip.motion.trim()].filter(Boolean).join('\n'),clip.frames)}>Use this clip in the generation form</button>
  </article>)}</div>
  {errors.map(error=><p key={error} role="status" className="text-xs text-amber-200">{error}</p>)}
  <button type="button" className="chip" disabled={disabled||timeline.clips.length>=20} onClick={()=>setTimeline(current=>addVideoClip3(current))}>Add clip</button>
 </section>;
}
