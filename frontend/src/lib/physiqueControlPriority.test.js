import { physiqueControlStatus } from "./physiqueControlPriority";
import { compileModelPrompts } from "./modelPromptCompilers";
import { DEFAULT_DNA } from "./dna";

test("implant size explains the inactive bust preset, slider and shape", () => {
  for (const key of ["bust", "bust_scale", "bust_shape"]) {
    expect(physiqueControlStatus(key, { implant_volume: 2750, bust_scale: 83 }).inactive).toBe(true);
  }
  expect(physiqueControlStatus("implant_volume", { implant_volume: 2750 }).inactive).toBe(false);
});

test("zero sliders preserve presets and nonzero sliders explain the override", () => {
  for (const [preset, slider] of [["bust", "bust_scale"], ["butt", "butt_scale"], ["hips", "hip_scale"], ["thighs", "thigh_scale"], ["waist", "waist_scale"]]) {
    expect(physiqueControlStatus(preset, { [slider]: 60 }).inactive).toBe(true);
    expect(physiqueControlStatus(preset, { [slider]: 0 })).toBeNull();
    expect(physiqueControlStatus(slider, { [slider]: 0 }).text).toContain("0 uses");
  }
});

test("notes and conflicting build presets match the compiler's priority rules", () => {
  expect(physiqueControlStatus("proportions", { hip_scale: 70 }).inactive).toBe(true);
  expect(physiqueControlStatus("proportions", { hip_scale: 0 }).inactive).toBe(false);
  expect(physiqueControlStatus("body_type", { body_type: "hourglass", waist_scale: 80 }).inactive).toBe(true);
  expect(physiqueControlStatus("body_type", { body_type: "hourglass", waist_scale: 0 }).inactive).toBe(false);
});

test.each(["chroma", "krea2", "sdxl", "pony", "zimage", "flux2_klein"])("%s does not add the small size presets when sliders or implants supply size", (promptStyle) => {
  const dna = JSON.parse(JSON.stringify(DEFAULT_DNA));
  dna.physique = { ...dna.physique, bust: "flat", bust_scale: 83, implant_volume: 2750, butt: "flat", butt_scale: 180, hips: "narrow", hip_scale: 90 };
  const result = compileModelPrompts({ promptStyle, dna });
  expect(result.positive).not.toMatch(/flat (breasts|bust|butt|ass)|narrow hips/i);
});
