import { SECTIONS } from './dna';

export const SHOT_CONTROLS = [
  ['pose_action', 'Pose', 'pose', 'action'],
  ['framing', 'Framing', 'pose', 'distance'],
  ['view', 'View', 'pose', 'angle'],
  ['expression', 'Expression', 'face', 'expression'],
  ['outfit_preset', 'Outfit', 'wardrobe', 'outfit_preset'],
  ['outfit_color', 'Outfit color', 'wardrobe', 'garment_color'],
  ['lighting_source', 'Light source', 'lighting', 'source'],
  ['lighting_temperature', 'Light temperature', 'lighting', 'color_temp'],
  ['environment', 'Location', 'scene', 'environment'],
  ['background', 'Background details', 'scene', 'background'],
];
export const SHOT_CATALOG = Object.fromEntries(SHOT_CONTROLS.map(([key, , section, field]) => {
  const control = SECTIONS.find(s => s.key === section)?.fields.find(f => f.key === field);
  return [key, control?.groups?.flatMap(group => group.options) || control?.options || []];
}));

export function plannedFrameControls(shot = {}, lockScenario = true) {
  const frame = { pose_action: shot.pose_action || '', outfit_overrides: {}, face_overrides: {},
    pose_overrides: {}, lighting_overrides: {}, scene_overrides: {} };
  SHOT_CONTROLS.forEach(([key, , section, field]) => {
    const value = shot[key];
    if (!value || (section === 'scene' && lockScenario)) return;
    if (key !== 'background' && !SHOT_CATALOG[key].includes(value)) return;
    if (section === 'wardrobe') frame.outfit_overrides[field] = value;
    else frame[`${section}_overrides`][field] = value;
  });
  return frame;
}
