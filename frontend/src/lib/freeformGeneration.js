import { compatibleInstalledLoras } from './loraRegistry';
import { workflowCatalog } from './workflowCatalog';

export const FREEFORM_MODES = {
  image: { title: 'Text to image', kind: 'image', description: 'Describe any image you want to create.' },
  video: { title: 'Image to video', kind: 'video', description: 'Upload a starting image and describe its movement.' },
  text_video: { title: 'Text to video', kind: 'text_video', description: 'Describe a scene, its action over time, and camera movement.' },
};
export function freeformWorkflows(workflows, mode) {
  return workflowCatalog(workflows).primary.filter(workflow => workflow.kind === FREEFORM_MODES[mode]?.kind);
}
export function freeformPayload({ mode, workflow, prompt, negative = '', source, seed = '', width = 640, height = 640, frames = 81, fps = 24, loras = [] }) {
  if (!FREEFORM_MODES[mode] || !workflow || workflow.kind !== FREEFORM_MODES[mode].kind) throw new Error('Select a compatible workflow.');
  if (!prompt.trim()) throw new Error('Describe what you want to create.');
  if (mode === 'video' && !source?.name) throw new Error('Upload a starting image.');
  if (seed !== '' && (!Number.isSafeInteger(Number(seed)) || Number(seed) < 0)) throw new Error('Use a whole-number seed or leave it blank.');
  const selected = mode === 'image' ? loras.filter(item => item?.name) : [];
  const names = selected.map(item => item.name.replace(/\\/g, '/').split('/').pop().toLowerCase());
  if (selected.length > 2 || new Set(names).size !== names.length) throw new Error('Select up to two different LoRAs.');
  for (const item of selected) {
    if (!compatibleInstalledLoras(workflow, [item.name]).length) throw new Error('Select a LoRA matched to this workflow’s model family.');
    if (!Number.isFinite(item.strength) || item.strength < 0 || item.strength > 2) throw new Error('Use a LoRA strength between 0 and 2.');
  }
  return {
    ...(selected.length ? { selected_loras: selected.map(item => ({name: item.name, strength: item.strength, triggers: item.triggerWords || []})) } : {}),
    workflow_id: workflow.id, workflow_type: workflow.kind,
    prompt_positive: prompt.trim(), prompt_negative: negative.trim(),
    ...(seed !== '' ? { seed: Number(seed) } : {}),
    ...(mode === 'image' ? { width, height, batch_size: 1 } : {
      video_instruction: prompt.trim(), video_frames: frames, video_fps: fps,
      video_width: width, video_height: height,
      ...(mode === 'video' ? { reference_image: [source.subfolder, source.name].filter(Boolean).join('/') } : {}),
    }),
  };
}
