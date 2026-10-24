// Apply the selected MOSS graph's own baseline only on an explicit model change.
// Restored recipes and subsequent manual adjustments remain user-controlled.
export function mossWorkflowSettings(workflow) {
  if (workflow?.prompt_style !== 'moss_image') return null;
  try {
    const nodes = Object.values(JSON.parse(workflow.json_str));
    const sampler = nodes.find(node => node.class_type === 'KSampler')?.inputs;
    const latent = nodes.find(node => node.class_type === 'EmptyFlux2LatentImage')?.inputs;
    if (!sampler || !latent) return null;
    const result = {width:latent.width, height:latent.height, batchSize:latent.batch_size,
      steps:sampler.steps, cfg:sampler.cfg, sampler:sampler.sampler_name, scheduler:sampler.scheduler};
    if (['width','height','batchSize','steps','cfg'].some(key => typeof result[key] !== 'number' || !Number.isFinite(result[key])) ||
      typeof result.sampler !== 'string' || typeof result.scheduler !== 'string') return null;
    return result;
  } catch { return null; }
}
