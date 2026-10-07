import { smartPhotoshootVariation, compatibleFramings, smartPoseChoices } from "./batchSmartPhotoshoot";

const baseSubject = (action = "standing") => ({
  id: "a",
  label: "A",
  dna: {
    pose: { action, angle: "front", distance: "full body" },
    camera: { angle: "eye-level", lens: "50mm", aperture: "f/2.8" },
    face: { expression: "neutral" },
    wardrobe: { outfit_preset: "cocktail dress" },
    scene: { environment: "studio" },
    lighting: { mood: "soft" },
  },
});

test("smart photoshoot varies safe composition fields while preserving scene and wardrobe", () => {
  const result = smartPhotoshootVariation({
    subjects: [baseSubject()],
    index: 0,
    seed: 42,
    options: { pose: true, camera: true, framing: true, expression: true },
  });

  expect(result.changed).toBe(true);
  expect(result.subjects[0].dna.wardrobe.outfit_preset).toBe("cocktail dress");
  expect(result.subjects[0].dna.scene.environment).toBe("studio");
  expect(result.subjects[0].dna.lighting.mood).toBe("soft");
  expect(result.subjects[0].dna.camera.lens).toBe("50mm");
  expect(result.subjects[0].dna.camera.aperture).toBe("f/2.8");
});

test("smart photoshoot respects variation locks", () => {
  const original = baseSubject();
  const result = smartPhotoshootVariation({
    subjects: [original],
    index: 1,
    seed: 10,
    options: { pose: false, camera: false, framing: false, expression: false },
  });

  expect(result.changed).toBe(false);
  expect(result.subjects[0].dna.pose).toEqual(original.dna.pose);
  expect(result.subjects[0].dna.camera).toEqual(original.dna.camera);
  expect(result.subjects[0].dna.face).toEqual(original.dna.face);
});

test("framing pool avoids portrait crops for floor-level poses", () => {
  expect(compatibleFramings([baseSubject("kneeling upright")])).toEqual(["full body", "wide shot", "thigh-up"]);
});

test("smart solo poses use the curated photography pose pool", () => {
  const choices = smartPoseChoices(1, { sections: [] });
  expect(choices.length).toBeGreaterThan(5);
  expect(choices.some(choice => /standing quarter turn/i.test(choice.label))).toBe(true);
  expect(choices.some(choice => /doggy|all fours|splits/i.test(choice.label))).toBe(false);
});

test("smart shared poses ignore specialty groups outside normal photoshoot categories", () => {
  const promptCatalog = {
    sections: [{
      key: "shared_poses",
      title: "Shared Poses",
      fields: [{
        key: "two_people",
        label: "2 people",
        type: "pose_chips",
        options: [
          { value: "side by side", label: "Side by side", keywords: "standing side by side", group: "Portrait" },
          { value: "specialty explicit pose", label: "Specialty", keywords: "specialty explicit pose", group: "Explicit acts" },
        ],
      }],
    }],
  };
  const choices = smartPoseChoices(2, promptCatalog);
  expect(choices.map(choice => choice.label)).toContain("Side by side");
  expect(choices.map(choice => choice.label)).not.toContain("Specialty");
});
