// Studio 3 video timeline draft and immutable clip operations.
const clampFrames=value=>Math.max(1,Math.min(240,Math.trunc(Number(value)||41)));
const clampFps=value=>Math.max(1,Math.min(120,Math.trunc(Number(value)||24)));
export const videoTimeline3=({sourceImage='',fps=24,workflowId='',name='Untitled sequence'}={})=>({version:1,name,sourceImage,fps:clampFps(fps),workflowId,clips:[]});
export const addVideoClip3=(timeline,clip={})=>{
 const clips=Array.isArray(timeline?.clips)?timeline.clips:[];
 const nextNumber=clips.reduce((max,item)=>Math.max(max,Number(String(item.id||'').match(/^clip-(\d+)$/)?.[1])||0),0)+1;
 const id=clip.id||'clip-'+nextNumber;
 const next={id,label:'Clip '+nextNumber,frames:41,motion:'',prompt:'',enabled:true,...clip,frames:clampFrames(clip.frames)};
 return {...timeline,clips:[...clips,next]};
};
export const updateVideoClip3=(timeline,id,patch={})=>({...timeline,clips:(timeline?.clips||[]).map(clip=>clip.id===id?{...clip,...patch,...(patch.frames!==undefined?{frames:clampFrames(patch.frames)}:{})}:clip)});
export const removeVideoClip3=(timeline,id)=>({...timeline,clips:(timeline?.clips||[]).filter(clip=>clip.id!==id)});
export const moveVideoClip3=(timeline,from,to)=>{
 const clips=[...(timeline?.clips||[])];
 if(!Number.isInteger(from)||!Number.isInteger(to)||from<0||to<0||from>=clips.length||to>=clips.length||from===to)return timeline;
 const [clip]=clips.splice(from,1);clips.splice(to,0,clip);return {...timeline,clips};
};
export const timelineDuration3=timeline=>(timeline?.clips||[]).filter(clip=>clip.enabled!==false).reduce((sum,clip)=>sum+clampFrames(clip.frames),0)/clampFps(timeline?.fps);
export const queueableVideoClips3=(timeline,sequenceId)=>{
 const clips=Array.isArray(timeline?.clips)?timeline.clips:[];
 const active=clips.filter(clip=>clip.enabled!==false);
 if(!active.length||validateVideoTimeline3({...timeline,clips:active}).length)return [];
 return clips.flatMap((clip,index)=>{
  if(clip.enabled===false)return [];
  const instruction=[clip.prompt,clip.motion].map(value=>String(value||'').trim()).filter(Boolean).join('\n');
  if(!instruction)return [];
  return [{sequenceId,sequenceLabel:String(timeline.name||'Untitled sequence').trim().slice(0,80)||'Untitled sequence',
   clipId:String(clip.id||''),clipLabel:String(clip.label||('Clip '+(index+1))).trim().slice(0,80)||('Clip '+(index+1)),
   clipIndex:index,instruction,frames:clampFrames(clip.frames),fps:clampFps(timeline.fps)}];
 });
};
export const validateVideoTimeline3=timeline=>{
 const errors=[];const clips=Array.isArray(timeline?.clips)?timeline.clips:[];const fps=Number(timeline?.fps);
 if(!Number.isInteger(fps)||fps<1||fps>120)errors.push('Frame rate must be a whole number from 1 to 120.');
 clips.forEach((clip,index)=>{
  if(!Number.isInteger(Number(clip.frames))||Number(clip.frames)<1||Number(clip.frames)>240)errors.push((clip.label||'Clip '+(index+1))+': frame count must be between 1 and 240.');
  if(clip.enabled!==false&&!String(clip.prompt||'').trim()&&!String(clip.motion||'').trim())errors.push((clip.label||'Clip '+(index+1))+': add a prompt or motion description.');
 });
 return errors;
};
