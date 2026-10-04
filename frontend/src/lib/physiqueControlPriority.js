import { resolvePhysiqueControls } from "./physiqueControls";

const sizes = {
  bust: ["bust_scale", "Bust size"], butt: ["butt_scale", "Glute size"],
  hips: ["hip_scale", "Hip width"], thighs: ["thigh_scale", "Thigh size"],
  waist: ["waist_scale", "Waist width"],
};

export function physiqueControlStatus(key, physique = {}) {
  if (["bust", "bust_scale", "bust_shape"].includes(key) && Number(physique.implant_volume) > 0) {
    return { inactive: true, text: "Saved selection; implant visual size currently supplies bust size and the rounded augmented shape. Set implant size to 0 to use this control." };
  }
  const size = sizes[key];
  if (size && Number(physique[size[0]]) > 0) {
    return { inactive: true, text: `Saved preset; ${size[1]} slider currently supplies size. Set its slider to 0 to use this preset.` };
  }
  if (key === "implant_volume" && Number(physique[key]) > 0) {
    return { inactive: false, text: "Active size source for the bust; overrides the bust preset, bust slider, and bust shape selection." };
  }
  if (Object.values(sizes).some(([slider]) => slider === key)) {
    return { inactive: false, text: Number(physique[key]) > 0
      ? "Active size source. The matching preset is saved but is not added to the prompt."
      : "0 uses the matching size preset. Shape is selected separately." };
  }
  if (key === "proportions") {
    const detailed = Number(physique.implant_volume) > 0 || Object.values(sizes).some(([slider]) => Number(physique[slider]) > 0);
    return { inactive: detailed, text: detailed
      ? "Detailed size controls currently replace these overlapping proportions notes. The notes remain saved."
      : "Avoid notes that contradict your selected sizes and shape." };
  }
  if (key === "body_type") {
    const resolved = resolvePhysiqueControls({ physique }).dna.physique;
    return { inactive: Boolean(physique.body_type && !resolved.body_type), text: physique.body_type && !resolved.body_type
      ? "Saved build preset; it conflicts with the selected regional proportions or height and is omitted from the prompt."
      : "Overall build. Detailed size controls specify individual regions." };
  }
  return null;
}
