// Apply the selected MOSS graph's own baseline only on an explicit model change.
// Restored recipes and subsequent manual adjustments remain user-controlled.
export function mossWorkflowSettings(workflow) {
  if (workflow?.prompt_style !== 'moss_image') return null;
  try {
    const nodes = Object.values(JSON.parse(workflow.json_str));
    const samplers = nodes.filter(node => node.class_type === 'KSampler');
    if (samplers.length !== 1) return null;
    const sampler = samplers[0]?.inputs;
    const latent = nodes.find(node => node.class_type === 'EmptyFlux2LatentImage')?.inputs;
    if (!sampler || !latent) return null;
    const result = {width:latent.width, height:latent.height, batchSize:latent.batch_size,
      steps:sampler.steps, cfg:sampler.cfg, sampler:sampler.sampler_name, scheduler:sampler.scheduler};
    if (['width','height','batchSize','steps','cfg'].some(key => typeof result[key] !== 'number' || !Number.isFinite(result[key])) ||
      typeof result.sampler !== 'string' || typeof result.scheduler !== 'string') return null;
    if (['width','height'].some(key => result[key] < 256 || result[key] > 2048 || result[key] % 16) ||
      result.steps < 1 || result.steps > 100 || !Number.isInteger(result.steps) || result.cfg < 0 || result.cfg > 30 ||
      result.batchSize < 1 || result.batchSize > 8 || !Number.isInteger(result.batchSize) ||
      !result.sampler.trim() || !result.scheduler.trim()) return null;
    return result;
  } catch { return null; }
}
