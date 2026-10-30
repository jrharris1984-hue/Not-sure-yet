import {randomizePhotoSubjects} from './photoRandomizer';
// Read the executable graph, never infer sampler settings from a marketing name.
export function workflowSampling(workflow) {
  if(workflow?.kind!=='image')return null;
  try {
    const nodes=Object.values(JSON.parse(workflow.json_str));
    const samplers=nodes.filter(node=>node.class_type==='KSampler');
    if(samplers.length!==1)return null;
    const {steps,cfg,sampler_name,scheduler}=samplers[0].inputs || {};
    if(!Number.isInteger(steps)||steps<1||steps>100||!Number.isFinite(cfg)||cfg<0||cfg>30||typeof sampler_name!=='string'||!sampler_name||typeof scheduler!=='string'||!scheduler)return null;
    return {steps,cfg,sampler:sampler_name,scheduler};
  }catch{return null;}
}
export function prepareStudioSurprise(subjects,locks) {
  // Preserve identity, wardrobe, custom text and all locks; vary the photographic setup.
  const scene=randomizePhotoSubjects(subjects,'scene',locks);
  const pose=randomizePhotoSubjects(scene.subjects,'pose',locks);
  return {subjects:pose.subjects,issues:[...new Set([...scene.issues,...pose.issues])]};
}
