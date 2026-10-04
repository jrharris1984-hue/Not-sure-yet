import { shootFrameDna } from "./shootFrames";
import { compileModelPrompts } from "./modelPromptCompilers";

test("shoot frame outfit and pose replace conflicting saved choices in the compiled prompt", () => {
  const base = {
    identity: { age: 42, gender: "female" },
    wardrobe: { outfit_set: "maid outfit", outfit_preset: "lingerie", nudity_level: 90, top: "corset" },
    pose: { action: "lying back" },
  };
  const frame = shootFrameDna(base, { poseAction: "walking", outfitPreset: "evening gown slit" });
  const { positive } = compileModelPrompts({ promptStyle: "sdxl", workflowKind: "image", dna: frame });

  expect(frame.wardrobe.outfit_set).toBe("");
  expect(frame.wardrobe.nudity_level).toBe(0);
  expect(positive.toLowerCase()).toContain("evening gown");
  expect(positive.toLowerCase()).toContain("walking");
  expect(positive.toLowerCase()).not.toContain("maid outfit");
  expect(positive.toLowerCase()).not.toContain("fully nude");
  expect(positive.toLowerCase()).not.toContain("lying back");
  expect(base.wardrobe.outfit_set).toBe("maid outfit");
});

test("a multi-person frame applies the selected outfit to both subjects", () => {
  const subjects = ["A", "B"].map((label) => ({
    label,
    dna: shootFrameDna({ identity: { age: 35, gender: "female" }, wardrobe: { outfit_set: "maid outfit" } },
      { poseAction: "walking", outfitPreset: "evening gown slit" }),
  }));
  const { positive } = compileModelPrompts({
    promptStyle: "sdxl", workflowKind: "image", dna: subjects[0].dna, subjects, isMulti: true,
  });
  expect(subjects.every((subject) => subject.dna.wardrobe.outfit_preset === "evening gown slit")).toBe(true);
  expect(positive.toLowerCase()).toContain("evening gown");
  expect(positive.toLowerCase()).not.toContain("maid outfit");
});

test('reviewed AI controls reach compiled prompts and preserve identity and locked location', () => {
  const base = { identity: { age: 35, gender: 'female' }, pose: { distance: 'portrait', angle: 'front' },
    scene: { environment: 'studio' }, lighting: { color_temp: 'cool' } };
  const frame = shootFrameDna(base, { poseOverrides: { distance: 'full body', angle: 'profile' },
    wardrobeOverrides: { garment_color: 'gold' }, lightingOverrides: { color_temp: 'warm' }, sceneOverrides: { environment: 'beach' }, lockScenario: true });
  const { positive } = compileModelPrompts({ promptStyle: 'chroma', workflowKind: 'image', dna: frame });
  expect(positive).toContain('full body');
  expect(positive).toContain('profile');
  expect(positive).toContain('warm');
  expect(positive).toContain('gold');
  expect(frame.scene.environment).toBe('studio');
  expect(frame.identity).toEqual(base.identity);
  expect(base.pose.distance).toBe('portrait');
  expect(shootFrameDna(base, { sceneOverrides: { environment: 'beach' }, lockScenario: false }).scene.environment).toBe('beach');
});
