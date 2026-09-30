// Focused studios share the render engine and DNA schema, while keeping their
// own guided steps and local draft. Presets only modify the listed fields.
const step = (id, label, hint, sections, simpleSections = sections) => ({
  id, label, shortLabel: label, hint, sections, simpleSections,
});

export const STUDIO_PROFILES = {
  feet: {
    title: "Foot Studio",
    description: "Build a character, choose foot styling, then compose a foot-focused scene.",
    fieldGroups: [
      { label: "Framing", keys: ["framing", "foot_pose", "sole_presentation", "ground_surface"] },
      { label: "Shape", keys: ["arch", "toe_length", "foot_size", "sole_texture", "toes"] },
      { label: "Styling", keys: ["pedicure", "pedicure_art", "toenail_shape", "hosiery", "foot_accessories", "foot_state"] },
      { label: "Interaction", keys: ["foot_act"] },
    ],
    steps: [
      step("start", "People", "Cast, scenario & age", ["identity", "scenario"], ["identity"]),
      step("character", "Character", "Body & appearance", ["physique", "face", "hair", "skin"], ["physique", "face", "hair"]),
      step("focus", "Feet", "Details & presentation", ["feet"], ["feet"]),
      step("scene", "Scene", "Shoes, pose & camera", ["wardrobe", "pose", "scene", "lighting", "camera", "style"], ["wardrobe", "pose", "scene"]),
      step("create", "Create", "Review & render", []),
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
    ],
  },
  watersports: {
    title: "Watersports Studio",
    description: "Build a character and set the source, stream, wetness, wardrobe and location.",
    fieldGroups: [
      { label: "Setup", keys: ["source", "container", "phase", "stance", "camera_view"] },
      { label: "Flow", keys: ["direction", "stream", "desperation"] },
      { label: "Visual detail", keys: ["wetness", "aftermath", "garment_detail", "liquid_visibility", "surface", "scene_props", "scene_notes"] },
    ],
    steps: [
      step("start", "People", "Cast, scenario & age", ["identity", "scenario"], ["identity"]),
      step("character", "Character", "Body & appearance", ["physique", "face", "hair", "skin"], ["physique", "face", "hair"]),
      step("focus", "Water", "Scene-specific details", ["watersports"], ["watersports"]),
      step("scene", "Scene", "Wardrobe, pose & setting", ["wardrobe", "pose", "scene", "lighting", "camera", "style"], ["wardrobe", "pose", "scene"]),
      step("create", "Create", "Review & render", []),
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
    ],
  },
};

export function applyStudioPreset(dna, preset) {
  return Object.fromEntries(Object.entries(dna).map(([section, value]) => [
    section, preset.changes[section] ? { ...value, ...preset.changes[section] } : value,
  ]));
}
