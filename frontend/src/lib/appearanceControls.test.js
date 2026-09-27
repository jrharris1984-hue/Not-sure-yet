import { DEFAULT_DNA, SECTIONS } from "@/lib/dna";
import { compileModelPrompts } from "@/lib/modelPromptCompilers";

const configured = () => ({
  ...DEFAULT_DNA,
  identity: { ...DEFAULT_DNA.identity, age: 80, gender: "female" },
  physique: {
    ...DEFAULT_DNA.physique, bust: "small", bust_scale: 95,
    bust_shape: "natural", implant_volume: 5000, butt_scale: 88,
    glute_shape: "BBL-style fuller glutes", hip_scale: 75,
  },
  wardrobe: {
    ...DEFAULT_DNA.wardrobe, outfit_preset: "streetwear", bottom: "denim shorts",
    dress_style: "mermaid gown", garment_color: "emerald",
    heel_type: "pointed-toe stilettos", heel_color: "gold",
    hosiery_type: "seamed stockings", hosiery_pattern: "back seam", hosiery_color: "black",
  },
});

test("adult age range and categorized appearance options are available", () => {
  const age = SECTIONS.find((s) => s.key === "identity").fields.find((f) => f.key === "age");
  expect([age.min, age.max]).toEqual([18, 80]);
  const wardrobe = SECTIONS.find((s) => s.key === "wardrobe");
  expect(wardrobe.fields.find((f) => f.key === "dress_style").groups.length).toBeGreaterThan(1);
});

test.each(["chroma", "zimage", "krea2", "pony"])("%s respects fine appearance selections", (promptStyle) => {
  const { positive } = compileModelPrompts({ promptStyle, dna: configured() });
  expect(positive).toMatch(/80-year-old/);
  expect(positive).toMatch(/fantasy-scale augmented bust/);
  expect(positive).not.toMatch(/5000 cc/);
  expect(positive).toMatch(/emerald/);
  expect(positive).toMatch(/mermaid gown/);
  expect(positive).not.toMatch(/denim shorts/);
});

test.each([
  [250, "subtle augmented bust"],
  [600, "full augmented bust"],
  [1200, "very large augmented bust"],
  [2500, "exaggerated oversized augmented bust"],
  [5000, "fantasy-scale augmented bust"],
])("implant slider %i maps to recognizable visual direction", (implant_volume, expected) => {
  const dna = configured();
  dna.physique.implant_volume = implant_volume;
  const { positive } = compileModelPrompts({ promptStyle: "krea2", dna });
  expect(positive).toContain(expected);
  expect(positive).not.toContain(`${implant_volume} cc`);
  expect(positive).not.toContain("small bust");
});
