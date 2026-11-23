// Video timeline draft. Video generation is delegated to existing workflows.
export const videoTimeline3=({sourceImage='',fps=24}={})=>({version:1,sourceImage,fps,clips:[]});
export const addVideoClip3=(timeline,clip={})=>{
 const frames=Math.max(1,Math.trunc(Number(clip.frames)||41));
 const next={id:'clip-'+(timeline.clips.reduce((m,c)=>Math.max(m,Number(c.id.split('-')[1])||0),0)+1),frames,motion:'',prompt:'',...clip,frames};
 return {...timeline,clips:[...timeline.clips,next]};
};
export const timelineDuration3=timeline=>(timeline.clips||[]).reduce((n,c)=>n+c.frames,0)/Math.max(1,timeline.fps||24);
export const validateVideoTimeline3=timeline=>(timeline.clips||[]).flatMap(c=>c.frames<1?[`${c.id}: invalid frame count`]:[]);
