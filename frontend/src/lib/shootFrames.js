import { wardrobeMode } from "./wardrobeMode";
// A shoot outfit replaces the saved character's clothing for this frame only.
// Leaving a saved outfit set, garment, or high nudity value in place can hide
// the selected preset from the prompt compiler.
export function shootFrameDna(baseDna = {}, { poseAction = "", outfitPreset = "", faceOverrides = {}, wardrobeOverrides = {}, poseOverrides = {}, lightingOverrides = {}, sceneOverrides = {}, lockScenario = true } = {}) {
  const wardrobe = { ...(baseDna.wardrobe || {}) };
  if (outfitPreset) {
    Object.assign(wardrobe, {
      outfit_mode: "custom", outfit_set: "", outfit_set_color: "", set_lingerie: "", dress_style: "", skirt_style: "",
      top: "none", bottom: "none", underwear: "none", nudity_level: 0,
      nudity_outfit: "", exposure_mode: "use selected outfit", state: "", material: "", garment_color: "",
      garment_pattern: "", palette: "", fit: "", outfit_preset: outfitPreset,
    });
  }
  if (wardrobeOverrides.exposure_mode && wardrobe.outfit_set && wardrobeMode(wardrobe) === "full") wardrobe.outfit_mode = "full";
  if (wardrobeOverrides.garment_color && wardrobe.outfit_set) wardrobe.outfit_set_color = wardrobeOverrides.garment_color;
  return {
    ...baseDna,
    lighting: { ...(baseDna.lighting || {}), ...lightingOverrides },
    scene: { ...(baseDna.scene || {}), ...(!lockScenario ? sceneOverrides : {}) },
    pose: { ...(baseDna.pose || {}), ...poseOverrides, ...(poseAction ? { action: poseAction } : {}) },
    wardrobe: { ...wardrobe, ...wardrobeOverrides },
    face: { ...(baseDna.face || {}), ...faceOverrides },
  };
}
