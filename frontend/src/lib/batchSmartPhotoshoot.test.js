import {
  SMART_SHOOT_CATEGORIES,
  SMART_PHOTOSHOOT_PRESETS,
  buildSmartPhotoshootPlan,
  photoshootCatalog,
  resolvePhotoshootPreset,
  smartPhotoshootVariation,
} from "./batchSmartPhotoshoot";

const baseSubject = () => ({
  id: "a",
  label: "A",
  dna: {
    pose: { action: "standing", angle: "front", distance: "full body" },
    camera: { angle: "eye-level", lens: "50mm", aperture: "f/2.8" },
    face: { expression: "neutral" },
    wardrobe: { outfit_preset: "cocktail dress" },
    scene: { environment: "studio" },
    lighting: { mood: "soft" },
  },
});

test("shoot styles are organized into separate categories", () => {
  const labels = SMART_SHOOT_CATEGORIES.map(category => category.label);
  expect(labels).toEqual(expect.arrayContaining([
    "Portrait",
    "Fashion & Editorial",
    "Lifestyle",
    "Glamour",
    "Cinematic",
    "Professional",
    "Fitness & Movement",
    "Couples & Groups",
  ]));
  expect(SMART_PHOTOSHOOT_PRESETS.editorial.categoryLabel).toBe("Fashion & Editorial");
  expect(SMART_PHOTOSHOOT_PRESETS.casual_candid.categoryLabel).toBe("Lifestyle");
});

test("editorial builds a deliberate six-shot sequence", () => {
  const plan = buildSmartPhotoshootPlan({
    count: 6,
    subjects: [baseSubject()],
    preset: "editorial",
    seed: 7,
    options: { pose: true, camera: true, framing: true, expression: true },
  });

  expect(plan.map(item => item.title)).toEqual([
    "Hero",
    "Portrait",
    "Relaxed",
    "Movement",
    "Alternate",
    "Finale",
  ]);
  expect(plan.every(item => item.framing)).toBe(true);
});

test("planned poses and cameras avoid repeats while choices remain available", () => {
  const plan = buildSmartPhotoshootPlan({
    count: 6,
    subjects: [baseSubject()],
    preset: "lookbook",
    seed: 17,
    options: { pose: true, camera: true, framing: true, expression: false },
  });
  const poses = plan.map(item => item.pose?.value).filter(Boolean);
  const cameras = plan.map(item => item.camera?.label).filter(Boolean);

  expect(new Set(poses).size).toBe(poses.length);
  expect(new Set(cameras).size).toBe(cameras.length);
});

test("variation locks preserve framing and expression", () => {
  const original = baseSubject();
  const plan = buildSmartPhotoshootPlan({
    count: 1,
    subjects: [original],
    preset: "editorial",
    seed: 2,
    options: { pose: true, camera: true, framing: false, expression: false },
  });
  const result = smartPhotoshootVariation({
    subjects: [original],
    index: 0,
    plan,
    preset: "editorial",
    options: { pose: true, camera: true, framing: false, expression: false },
  });

  expect(result.subjects[0].dna.pose.distance).toBe("full body");
  expect(result.subjects[0].dna.face.expression).toBe("neutral");
  expect(result.subjects[0].dna.wardrobe.outfit_preset).toBe("cocktail dress");
  expect(result.subjects[0].dna.scene.environment).toBe("studio");
  expect(result.subjects[0].dna.lighting.mood).toBe("soft");
  expect(result.subjects[0].dna.camera.lens).toBe("50mm");
  expect(result.subjects[0].dna.camera.aperture).toBe("f/2.8");
});

test("shared smart plans reject explicit or specialty groups even when the label also says portrait", () => {
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
          { value: "blocked pose", label: "Blocked pose", keywords: "blocked pose", group: "Explicit portrait" },
        ],
      }],
    }],
  };
  const subjects = [baseSubject(), { ...baseSubject(), id: "b", label: "B" }];
  const plan = buildSmartPhotoshootPlan({
    count: 2,
    subjects,
    promptCatalog,
    preset: "duo_editorial",
    seed: 0,
    options: { pose: true, camera: false, framing: true, expression: false },
  });

  expect(plan.map(item => item.pose?.label)).not.toContain("Blocked pose");
});


test("custom photoshoot presets are merged into their own shoot categories", () => {
  const customPresets = [{
    key: "custom_my_glamour",
    label: "My Glamour Set",
    category: "Glamour",
    description: "My saved sequence",
    sequence: [
      { title: "My Hero", pose_group: "portrait standing|portrait", camera_match: "3/4", framing: "full body", expression: "sultry" },
      { title: "My Seated", pose_group: "portrait seated|seated", camera_match: "eye-level", framing: "thigh-up", expression: "smirk" },
    ],
  }];
  const catalog = photoshootCatalog(customPresets);
  const customCategory = catalog.categories.find(category => category.label === "My Shoots · Glamour");

  expect(customCategory).toBeTruthy();
  expect(customCategory.presets[0].label).toBe("My Glamour Set");
  expect(resolvePhotoshootPreset("custom_my_glamour", customPresets).custom).toBe(true);
});

test("custom photoshoot shot sequence drives the generated plan", () => {
  const customPresets = [{
    key: "custom_two_shot",
    label: "Two Shot Test",
    category: "Custom",
    description: "",
    sequence: [
      { title: "Custom Hero", pose_group: "portrait standing|portrait", camera_match: "front", framing: "full body", expression: "neutral" },
      { title: "Custom Portrait", pose_group: "portrait seated|seated", camera_match: "3/4", framing: "waist-up", expression: "smile" },
    ],
  }];
  const plan = buildSmartPhotoshootPlan({
    count: 2,
    subjects: [baseSubject()],
    preset: "custom_two_shot",
    customPresets,
    seed: 3,
    options: { pose: true, camera: true, framing: true, expression: true },
  });

  expect(plan.map(item => item.title)).toEqual(["Custom Hero", "Custom Portrait"]);
  expect(plan.map(item => item.framing)).toEqual(["full body", "waist-up"]);
  expect(plan.map(item => item.expression)).toEqual(["neutral", "smile"]);
});
