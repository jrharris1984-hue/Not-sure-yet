// Queue-time checks shared by guided image and video creation.
// These checks do not replace ComfyUI graph/model validation.
const VIDEO_WORKFLOW_KINDS = new Set(['video', 'text_video', 'image_to_video', 'text_to_video']);
const SOURCE_IMAGE_KINDS = new Set(['image_to_video', 'image_edit', 'edit']);

export const normalizeGenerationKind3 = value => {
  const kind = String(value || 'image').trim().toLowerCase().replace(/[ -]+/g, '_');
  if (['i2v', 'image2video'].includes(kind)) return 'image_to_video';
  if (['t2v', 'text2video'].includes(kind)) return 'text_to_video';
  if (['img2img', 'imageedit'].includes(kind)) return 'image_edit';
  return kind;
};

export const workflowCompatibility3 = (workflow, requestedKind = 'image') => {
  const requested = normalizeGenerationKind3(requestedKind);
  const actual = normalizeGenerationKind3(workflow?.kind);
  if (!actual) return { compatible: true, requested, actual: '', reason: '' };
  const expectsVideo = VIDEO_WORKFLOW_KINDS.has(requested);
  const isVideo = VIDEO_WORKFLOW_KINDS.has(actual);
  const compatible = expectsVideo === isVideo;
  return {
    compatible,
    requested,
    actual,
    reason: compatible ? '' : expectsVideo
      ? 'Choose a video workflow for this video generation.'
      : 'Choose an image workflow for this image generation.'
  };
};

export const generationPreflight3 = ({workflow,seed,kind='image',comfyOnline=true,sourceImage,requiresSourceImage=false}={}) => {
  const errors = [];
  const warnings = [];
  const requested = normalizeGenerationKind3(kind);
  if (!workflow?.id) errors.push('Select a workflow.');
  else {
    const compatibility = workflowCompatibility3(workflow, requested);
    if (!compatibility.compatible) errors.push(compatibility.reason);
  }
  if (seed !== undefined && seed !== null && seed !== '' && (!Number.isSafeInteger(Number(seed)) || Number(seed) < 0)) {
    errors.push('Seed must be a nonnegative integer.');
  }
  if ((requiresSourceImage || SOURCE_IMAGE_KINDS.has(requested)) && !String(sourceImage || '').trim()) {
    errors.push(requested === 'image_to_video'
      ? 'Choose a starting image for image-to-video generation.'
      : 'Choose a source image for this workflow.');
  }
  if (!comfyOnline) warnings.push('ComfyUI is offline; the queue may wait.');
  return {ready: errors.length === 0, errors, warnings};
};
