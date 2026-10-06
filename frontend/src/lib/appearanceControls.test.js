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

test("Krea resolves an obscured bust, thigh-up crop, feet focus, and conflicting nude preset", () => {
  const dna = configured();
  dna.pose = { ...DEFAULT_DNA.pose, distance: "thigh-up", action: "leaning forward", angle: "profile", focus: "feet" };
  dna.feet = { ...DEFAULT_DNA.feet, pedicure: "long nails" };
  dna.wardrobe = {
    ...DEFAULT_DNA.wardrobe, nudity_level: 60, outfit_preset: "nude", heel_type: "block heels",
  };
  const { positive } = compileModelPrompts({ promptStyle: "krea2", dna });
  expect(positive).toContain("Thigh-up photograph");
  expect(positive).toContain("projected bust unmistakably visible");
  expect(positive).toContain("projected chest silhouette visible");
  expect(positive).toContain("partially nude");
  expect(positive).toContain("some clothing remains");
  expect(positive).not.toContain("nude wardrobe");
  expect(positive).not.toContain("feet composition priority");
  expect(positive).not.toContain("long nails pedicure");
  expect(positive).not.toContain("block heels");
});

test.each(["sdxl", "pony", "chroma", "zimage", "flux2_klein", "krea2", "wan_t2v"])("%s applies shared nudity without a conflicting outfit", (promptStyle) => {
  const dna = configured();
  dna.wardrobe.nudity_level = 85;
  const { positive } = compileModelPrompts({ promptStyle, dna, videoInstruction: "slow camera pan" });
  expect(positive).toMatch(/fully nude/i);
  expect(positive).not.toMatch(/mermaid gown|denim shorts/i);
});

test.each(["sdxl", "pony", "chroma", "zimage", "krea2"])("%s can keep lingerie with nudity", (promptStyle) => {
  const dna = configured();
  dna.wardrobe = { ...DEFAULT_DNA.wardrobe, outfit_set: "lace balconette set with matching panties, garter belt, stockings and heels", nudity_level: 85, nudity_outfit: "keep lingerie" };
  const { positive } = compileModelPrompts({ promptStyle, dna });
  expect(positive).toMatch(/partially nude/i);
  expect(positive).toMatch(/lace balconette set/i);
});

test('Chroma keeps breast, glute shape, garment and color controls together at extended glute size', () => {
  const dna = configured();
  dna.physique.butt_scale = 300;
  const { positive } = compileModelPrompts({ promptStyle: 'chroma', dna });
  expect(positive).toContain('fantasy-scale augmented bust');
  expect(positive).toContain('fantasy-scale maximum oversized');
  expect(positive).toContain('size intensity 300/300');
  expect(positive).toContain('BBL-style glute contour');
  expect(positive).toContain('emerald mermaid gown');
  expect(positive).toContain('black seamed stockings');
  expect(positive).toContain('gold pointed-toe stilettos');
});

test.each(['waist-up', 'thigh-up', 'knees-up', 'portrait'])('Krea omits off-frame feet details in a %s crop', (distance) => {
  const dna = configured();
  dna.pose = { ...DEFAULT_DNA.pose, distance, focus: 'feet' };
  dna.feet = { ...DEFAULT_DNA.feet, framing: 'sole close-up', pedicure: 'long nails' };
  const { positive } = compileModelPrompts({ promptStyle: 'krea2', dna });
  expect(positive).not.toContain('feet composition priority');
  expect(positive).not.toContain('long nails pedicure');
  expect(positive).not.toContain('pointed-toe stilettos');
});
