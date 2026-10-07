// Explicit shot cards, rather than random rotation, keep a reviewed sequence stable.
export const LIFESTYLE_OUTFITS = ['streetwear', 'tailored pantsuit', 'casual home', 'cocktail dress', 'denim jacket and skirt'];
export const LIFESTYLE_VIEWS = [['front', 'Front'], ['3/4', 'Three-quarter'], ['profile', 'Side'], ['back', 'Back']];
export const LIFESTYLE_FRAMING = ['full body', 'wide shot', 'waist-up', 'portrait'];
export const LIFESTYLE_POSES = {
  standing: { label: 'Standing', action: 'standing', direction: '' },
  chair: { label: 'Seated in a chair', action: 'seated hands folded in lap', direction: 'Seated upright in a chair, hands folded in lap.' },
  couch: { label: 'Seated on a couch', action: 'seated hands folded in lap', direction: 'Seated upright on a couch, hands folded in lap.' },
  bed: { label: 'Seated on a bed', action: 'seated hands folded in lap', direction: 'Seated upright on the edge of a bed, fully dressed, hands folded in lap.' },
};
export const LIFESTYLE_SETS = [
  { key: 'views', label: 'Standing · four views', pose: 'standing', views: ['front', '3/4', 'profile', 'back'] },
  { key: 'chair', label: 'Chair portraits', pose: 'chair', views: ['front', '3/4', 'profile'] },
  { key: 'couch', label: 'Couch lifestyle', pose: 'couch', views: ['front', '3/4', 'profile'] },
  { key: 'bed', label: 'Bedroom lifestyle', pose: 'bed', views: ['front', '3/4', 'profile'] },
];
export const MAX_LIFESTYLE_SHOTS = 40;

export function lifestyleSetShots(key, outfit = 'streetwear') {
  const set = LIFESTYLE_SETS.find(item => item.key === key);
  if (!set) return [];
  return set.views.map(view => ({ set_label: set.label, pose: set.pose, view,
    framing: 'full body', camera_height: 'eye-level', outfit }));
}

export function lifestyleFrameControls(shot) {
  const pose = LIFESTYLE_POSES[shot.pose] || LIFESTYLE_POSES.standing;
  return { shot_label: `${shot.set_label} · ${LIFESTYLE_VIEWS.find(([value]) => value === shot.view)?.[1] || 'Front'}`,
    pose_action: pose.action, scene_direction: pose.direction,
    // Clear saved hand/focus choices so a portrait or seated pose cannot fight a rear view.
    pose_overrides: { angle: shot.view, distance: shot.framing, focus: 'full frame', hands: '', body_language: 'relaxed' },
    camera_overrides: { angle: shot.camera_height },
    outfit_overrides: { outfit_preset: shot.outfit }, face_overrides: {},
    lighting_overrides: {}, scene_overrides: {} };
}
