import { createAdultEditorialPlan, ADULT_EDITORIAL_COVERAGE_STAGES, ADULT_EDITORIAL_POSES } from "./adultEditorialPlan";
import { shootFrameDna } from "./shootFrames";

test("40-shot adult editorial plan progresses from clothed styling to nude fine-art frames", () => {
  const plan = createAdultEditorialPlan({ characterId: "character-1", count: 40 });
  expect(plan.shots).toHaveLength(40);
  expect(plan.planType).toBe("adult-editorial");
  expect(plan.shots[0].coverage).toBe("use selected outfit");
  expect(plan.shots.at(-1).coverage).toBe("nude");
  expect(plan.shots.map(shot => shot.coverage)).toEqual(ADULT_EDITORIAL_COVERAGE_STAGES.flatMap(stage => Array(5).fill(stage)));
  expect(new Set(plan.shots.map(shot => shot.label)).size).toBe(40);
  expect(new Set(plan.shots.map(shot => shot.pose)).size).toBe(40);
  expect(new Set(plan.shots.map(shot => shot.subjectView)).size).toBeGreaterThanOrEqual(8);
  expect(new Set(plan.shots.map(shot => shot.cameraAngle)).size).toBeGreaterThanOrEqual(5);
  expect(new Set(plan.shots.map(shot => shot.lens)).size).toBeGreaterThanOrEqual(5);
  expect(new Set(plan.shots.map(shot => shot.scene.environment)).size).toBeGreaterThanOrEqual(4);
  expect(new Set(plan.shots.map(shot => shot.lighting.style)).size).toBeGreaterThanOrEqual(4);
  expect(plan.shots.every(shot => ADULT_EDITORIAL_POSES.includes(shot.pose))).toBe(true);
});

test("the 120-shot plan stays within the shot director limit and keeps every shot direction distinct", () => {
  const plan = createAdultEditorialPlan({ count: 120, templateKey: "footwear-care" });
  expect(plan.shots).toHaveLength(120);
  expect(plan.shots.at(-1).coverage).toBe("nude");
  expect(new Set(plan.shots.map(shot => shot.pose)).size).toBe(120);
  expect(new Set(plan.shots.map(shot => shot.label)).size).toBe(120);
  expect(plan.shots.every(shot => shot.feet.composition_mode === "feet focus")).toBe(true);
  expect(plan.shots.every(shot => shot.feet.skin_finish)).toBe(true);
  expect(plan.shots.filter(shot => shot.coverage === "nude")).toHaveLength(15);
});

test("shot-level coverage overrides apply without mutating the character", () => {
  const original = { identity: { age: 34 }, wardrobe: { outfit_preset: "silk robe", exposure_mode: "use selected outfit" } };
  const frame = shootFrameDna(original, { wardrobeOverrides: { exposure_mode: "nude" } });
  expect(frame.wardrobe.exposure_mode).toBe("nude");
  expect(original.wardrobe.exposure_mode).toBe("use selected outfit");
});
