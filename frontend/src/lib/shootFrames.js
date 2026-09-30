// A shoot outfit replaces the saved character's clothing for this frame only.
// Leaving a saved outfit set, garment, or high nudity value in place can hide
// the selected preset from the prompt compiler.
export function shootFrameDna(baseDna = {}, { poseAction = "", outfitPreset = "", faceOverrides = {} } = {}) {
  const wardrobe = { ...(baseDna.wardrobe || {}) };
  if (outfitPreset) {
    Object.assign(wardrobe, {
      outfit_set: "", outfit_set_color: "", dress_style: "", skirt_style: "",
      top: "none", bottom: "none", underwear: "none", nudity_level: 0,
      nudity_outfit: "", state: "", material: "", garment_color: "",
      garment_pattern: "", palette: "", fit: "", outfit_preset: outfitPreset,
    });
  }
  return {
    ...baseDna,
    pose: { ...(baseDna.pose || {}), ...(poseAction ? { action: poseAction } : {}) },
    wardrobe,
    face: { ...(baseDna.face || {}), ...faceOverrides },
  };
}
