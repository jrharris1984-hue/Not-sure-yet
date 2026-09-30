// Focused studios share the render engine and DNA schema, while keeping their
// own guided steps and local draft. Presets only modify the listed fields.
const step = (id, label, hint, sections, simpleSections = sections) => ({
  id, label, shortLabel: label, hint, sections, simpleSections,
});

export const STUDIO_PROFILES = {
  feet: {
    title: "Foot Studio",
    description: "Build a character, choose foot styling, then compose a foot-focused scene.",
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
      { name: "Heels and stockings", description: "Styled footwear with full-body composition", changes: { feet: { framing: "full body", hosiery: "sheer stockings" }, wardrobe: { heel_type: "stiletto", heel_color: "black", hosiery_type: "stockings" }, pose: { focus: "feet", distance: "full body" } } },
      { name: "Pedicure detail", description: "Nails and toes as the focal point", changes: { feet: { pedicure: "painted red", framing: "pedicure close-up" }, pose: { focus: "feet", distance: "detail shot" } } },
      { name: "Beach footprints", description: "Barefoot outdoor scene", changes: { feet: { framing: "knees-down", foot_state: ["bare"] }, scene: { environment: "beach", indoor_outdoor: "outdoor" }, pose: { focus: "feet", distance: "full body" } } },
    ],
  },
  watersports: {
    title: "Watersports Studio",
    description: "Build a character and set the source, stream, wetness, wardrobe and location.",
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
    ],
  },
};

export function applyStudioPreset(dna, preset) {
  return Object.fromEntries(Object.entries(dna).map(([section, value]) => [
    section, preset.changes[section] ? { ...value, ...preset.changes[section] } : value,
  ]));
}
