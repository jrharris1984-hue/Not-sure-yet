export const QWEN_CAMERA_DEFAULTS = { azimuth: 'front view', elevation: 'eye-level shot', distance: 'medium shot' };
export const QWEN_CAMERA_OPTIONS = {
  azimuth: ['front view', 'front-right quarter view', 'right side view', 'back-right quarter view', 'back view', 'back-left quarter view', 'left side view', 'front-left quarter view'],
  elevation: ['low-angle shot', 'eye-level shot', 'elevated shot', 'high-angle shot'],
  distance: ['close-up', 'medium shot', 'wide shot'],
};
const preservation = 'Preserve the same person from image 1: facial identity, age, hairstyle, body proportions, exact clothing, clothing coverage and accessories. Keep the original photographic appearance, lighting and environment. Do not borrow identity, clothing or background from another reference.';
export function qwenReferenceInstruction(variant, notes = '', camera = QWEN_CAMERA_DEFAULTS) {
  const direction = variant === 'pose'
    ? 'Make the person in image 1 do the pose of the person in image 2. Use image 2 only for body positioning, head tilt, gaze and framing. Keep the background of image 1; reconstruct only areas revealed by the new pose. '
    : `<sks> ${camera.azimuth} ${camera.elevation} ${camera.distance}. Change only the camera viewpoint. Keep the original body pose. `;
  return direction + preservation + (notes.trim() ? ` Additional direction: ${notes.trim()}` : '');
}
