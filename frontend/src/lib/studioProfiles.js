// Focused studios share the render engine, DNA schema and unified Create journey.
// Profiles only define specialty controls and presets; navigation lives in createJourney.js.

export const STUDIO_PROFILES = {
  feet: {
    title: "Foot Studio",
    description: "Build a character, choose foot styling, then compose a foot-focused scene.",
    fieldGroups: [
      { label: "Framing", keys: ["composition_mode", "framing", "foot_pose", "sole_presentation", "ground_surface"] },
      { label: "Shape", keys: ["arch", "toe_length", "foot_size", "sole_texture", "toes"] },
      { label: "Styling", keys: ["pedicure", "pedicure_art", "toenail_shape", "hosiery", "foot_accessories", "foot_state"] },
      { label: "Interaction", keys: ["foot_act"] },
    ],
    presets: [
      { name: "Barefoot portrait", description: "Bare feet in a full-length frame", changes: { feet: { framing: "full body", foot_state: ["bare"] }, wardrobe: { footwear: "barefoot" }, pose: { focus: "feet", distance: "full body" } } },
      { name: "Soles close-up", description: "Soles and ankles in focus", changes: { feet: { framing: "sole close-up", sole_presentation: "soles up" }, pose: { focus: "feet", distance: "detail shot" } } },
      { name: "Heels and stockings", description: "Styled footwear with full-body composition", changes: { feet: { framing: "full body", hosiery: "sheer stockings" }, wardrobe: { heel_type: "pointed-toe stilettos", heel_color: "black", hosiery_type: "stay-up stockings" }, pose: { focus: "feet", distance: "full body" } } },
      { name: "Pedicure detail", description: "Nails and toes as the focal point", changes: { feet: { pedicure: "painted red", framing: "pedicure close-up" }, pose: { focus: "feet", distance: "detail shot" } } },
      { name: "Beach footprints", description: "Barefoot outdoor scene", changes: { feet: { framing: "knees-down", foot_state: ["bare"] }, scene: { environment: "beach", indoor_outdoor: "outdoor" }, pose: { focus: "feet", distance: "full body" } } },
      { name: "High arch profile", description: "Side view emphasizing the arches", changes: { feet: { foot_pose: "arches visible in profile", arch: "high arch", framing: "ankle and arch close-up" }, pose: { focus: "feet", angle: "profile", distance: "detail shot" } } },
      { name: "Toe rings", description: "Bare feet with jewelry detail", changes: { feet: { foot_accessories: ["toe ring", "anklet"], framing: "pedicure close-up" }, pose: { focus: "feet", distance: "detail shot" } } },
      { name: "Sandal styling", description: "Strappy heels and polished toes", changes: { feet: { pedicure: "painted pink", foot_pose: "heels raised", framing: "knees-down" }, wardrobe: { heel_type: "strappy sandals", heel_color: "silver" }, pose: { focus: "feet", distance: "full body" } } },
      { name: "Stocking seam", description: "Back-seam stockings and pumps", changes: { feet: { framing: "knees-down", hosiery: "sheer stockings" }, wardrobe: { hosiery_type: "back-seam stockings", hosiery_color: "black", hosiery_denier: "sheer 15 denier", heel_type: "round-toe pumps" }, pose: { focus: "feet", distance: "full body" } } },
      { name: "Spa pedicure", description: "Freshly washed feet on a towel", changes: { feet: { foot_state: ["freshly washed"], pedicure_art: "glossy polish", ground_surface: "velvet cushion", framing: "feet close-up" }, pose: { focus: "feet", distance: "detail shot" } } },
      { name: "Walking barefoot", description: "Full figure and feet on grass", changes: { feet: { foot_pose: "walking barefoot", ground_surface: "grass", framing: "full body" }, scene: { environment: "forest", indoor_outdoor: "outdoor" }, pose: { focus: "feet", distance: "full body" } } },
      { name: "Self foot massage", description: "Seated solo pose with both feet visible", changes: { feet: { foot_act: ["self foot massage"], framing: "knees-down", foot_pose: "one foot lifted" }, pose: { focus: "feet", action: "sitting on edge", distance: "full body" } } },
      { name: "Self foot kiss", description: "Seated pose with one foot raised", changes: { feet: { foot_act: ["self foot kiss"], framing: "feet close-up", foot_pose: "one foot lifted" }, pose: { focus: "feet", action: "sitting legs crossed", distance: "full body" } } },
      { name: "Self sole lick", description: "Seated forward pose with an accessible raised foot", changes: { feet: { foot_act: ["self sole lick"], framing: "sole close-up", sole_presentation: "one sole raised" }, pose: { focus: "feet", action: "sitting on edge", distance: "full body" } } },
    ],
  },
  watersports: {
    title: "Watersports Studio",
    description: "Build a character and set the source, stream, wetness, wardrobe and location.",
    fieldGroups: [
      { label: "Setup", keys: ["source", "self_action", "container", "phase", "stance", "camera_view"] },
      { label: "Flow", keys: ["direction", "self_aim", "stream", "desperation", "flow_appearance"] },
      { label: "Visual detail", keys: ["urine_color", "highlight", "wetness", "aftermath", "garment_detail", "liquid_visibility", "surface", "scene_props", "scene_notes"] },
    ],
    presets: [
      { name: "Private bathroom", description: "Toilet setting, full figure", changes: { watersports: { source: "self", container: "toilet", stream: "steady stream", desperation: "calm" }, scene: { indoor_outdoor: "indoor", background: "private bathroom" }, pose: { distance: "full body" } } },
      { name: "Shower setting", description: "Tiled shower, wet floor", changes: { watersports: { source: "self", container: "shower", direction: ["on floor"], wetness: ["wet floor"] }, scene: { indoor_outdoor: "indoor", background: "tiled shower" }, pose: { distance: "full body" } } },
      { name: "Outdoor setting", description: "Secluded backdrop and wide framing", changes: { watersports: { source: "self", container: "outdoors", stream: "trickle" }, scene: { environment: "forest", indoor_outdoor: "outdoor" }, pose: { distance: "wide shot" } } },
      { name: "Clothing wetness", description: "Clothing and detail framing", changes: { watersports: { source: "self", container: "in jeans", wetness: ["soaked jeans"] }, wardrobe: { material: "denim" }, pose: { distance: "thigh-up" } } },
      { name: "Aftermath detail", description: "Floor puddle and damp clothing", changes: { watersports: { source: "self", direction: ["on floor"], wetness: ["puddle at feet"], aftermath: ["wet clothes"] }, pose: { distance: "detail shot" } } },
      { name: "Before moment", description: "Bathroom setup before the action", changes: { watersports: { source: "self", phase: "before", container: "toilet", desperation: "holding it", scene_props: ["bath mat", "mirror"] }, scene: { indoor_outdoor: "indoor", background: "private bathroom" }, pose: { distance: "full body" } } },
      { name: "Floor-level view", description: "Tiles, reflections and puddle detail", changes: { watersports: { source: "self", direction: ["on floor"], phase: "afterward", surface: "white tile", liquid_visibility: "reflective wet floor", camera_view: "floor-level detail" }, pose: { distance: "detail shot" } } },
      { name: "Seated bathroom", description: "Seated position and indoor setting", changes: { watersports: { source: "self", container: "toilet", stance: "seated", phase: "in progress", surface: "white tile" }, scene: { indoor_outdoor: "indoor" }, pose: { action: "sitting on edge", distance: "full body" } } },
      { name: "Bathtub edge", description: "Side profile with bath detail", changes: { watersports: { source: "self", container: "tub", stance: "seated", surface: "bathtub edge", camera_view: "side profile" }, scene: { indoor_outdoor: "indoor", background: "bathtub" }, pose: { angle: "profile", distance: "full body" } } },
      { name: "Outdoor aftermath", description: "Wide outdoor view after the scene", changes: { watersports: { source: "self", container: "outdoors", phase: "afterward", wetness: ["damp"], surface: "grass" }, scene: { environment: "forest", indoor_outdoor: "outdoor" }, pose: { distance: "wide shot" } } },
      { name: "Wet stockings", description: "Clothing and lower-body detail", changes: { watersports: { source: "self", garment_detail: "wet stockings", liquid_visibility: "visible droplets", camera_view: "waist-down" }, wardrobe: { hosiery_type: "sheer pantyhose" }, pose: { distance: "knees-up" } } },
      { name: "Clear self stream", description: "Single transparent stream with visible landing point", changes: { watersports: { source: "self", self_action: "self urination", phase: "in progress", urine_color: "nearly colorless transparent", flow_appearance: "single continuous gravity-driven stream", self_aim: "onto floor near feet", direction: ["on floor"], highlight: "soft side-lit highlights", surface: "dark tile", camera_view: "three-quarter figure" }, scene: { indoor_outdoor: "indoor", background: "private tiled bathroom" }, pose: { distance: "full body", angle: "3/4" } } },
      { name: "Clear toilet view", description: "Seated scene with subtle fluid color", changes: { watersports: { source: "self", self_action: "seated on toilet", phase: "in progress", container: "toilet", self_aim: "into toilet bowl", urine_color: "clear with a faint straw tint", flow_appearance: "thin gentle stream", highlight: "small specular highlights" }, scene: { indoor_outdoor: "indoor", background: "private bathroom" }, pose: { action: "sitting on edge", distance: "full body" } } },
      { name: "Clear shower drain", description: "Standing scene with a visible path to the drain", changes: { watersports: { source: "self", self_action: "looking down at stream", phase: "in progress", container: "shower", self_aim: "into shower drain", urine_color: "nearly colorless transparent", flow_appearance: "single continuous gravity-driven stream", highlight: "backlit transparent stream", surface: "shower drain" }, scene: { indoor_outdoor: "indoor", background: "tiled shower" }, pose: { action: "standing", distance: "full body" } } },
    ],
  },
};

export function applyStudioPreset(dna, preset) {
  return Object.fromEntries(Object.entries(dna).map(([section, value]) => [
    section, preset.changes[section] ? { ...value, ...preset.changes[section] } : value,
  ]));
}
