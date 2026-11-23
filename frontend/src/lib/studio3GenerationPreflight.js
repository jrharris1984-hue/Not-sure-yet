// Compatibility diagnostics only. Real support is determined by installed ComfyUI workflows.
export const generationPreflight3=({workflow,seed,kind='image',comfyOnline=true}={})=>{
 const errors=[];const warnings=[];
 if(!workflow?.id)errors.push('Select a workflow.');
 if(workflow?.kind&&kind==='image'&&!['image','pony'].includes(workflow.kind))errors.push('Workflow is not an image workflow.');
 if(seed!==undefined&&(!Number.isSafeInteger(Number(seed))||Number(seed)<0))errors.push('Seed must be a nonnegative integer.');
 if(!comfyOnline)warnings.push('ComfyUI is offline; the queue may wait.');
 return {ready:errors.length===0,errors,warnings};
};
