import { STUDIO_PROFILES, applyStudioPreset } from "./studioProfiles";
import { mobileStudioStepForSection, mobileStudioSectionsForStep } from "../components/MobileStudioFlow";
import { DEFAULT_DNA, SECTIONS, buildPrompts } from "./dna";
import { buildKrea2Prompts } from "./modelPromptCompilers";
import { buildPromptPriorityPlan } from "./promptPriority";

test("each studio keeps its specialty controls in a dedicated guided step", () => {
  expect(mobileStudioStepForSection("feet", STUDIO_PROFILES.feet.steps)).toBe("focus");
  expect(mobileStudioSectionsForStep("focus", "simple", STUDIO_PROFILES.feet.steps)).toEqual(["feet"]);
  expect(mobileStudioStepForSection("watersports", STUDIO_PROFILES.watersports.steps)).toBe("focus");
  expect(mobileStudioSectionsForStep("focus", "simple", STUDIO_PROFILES.watersports.steps)).toEqual(["watersports"]);
});

test("focused tabs cover every specialty field", () => {
  for (const [key, profile] of Object.entries(STUDIO_PROFILES)) {
    const allFields = SECTIONS.find((section) => section.key === key).fields.map((field) => field.key);
    const grouped = profile.fieldGroups.flatMap((group) => group.keys);
    expect(new Set(grouped).size).toBe(grouped.length);
    expect(grouped.sort()).toEqual(allFields.sort());
    expect(profile.presets.length).toBeGreaterThanOrEqual(10);
  }
});

test("preset chip values are available in their corresponding editors", () => {
  for (const profile of Object.values(STUDIO_PROFILES)) {
    for (const preset of profile.presets) {
      for (const [sectionKey, changedFields] of Object.entries(preset.changes)) {
        const section = SECTIONS.find((item) => item.key === sectionKey);
        for (const [key, value] of Object.entries(changedFields)) {
          const field = section?.fields.find((item) => item.key === key);
          expect(field).toBeDefined();
          if (!["chips", "chips_multi", "pose_chips"].includes(field.type)) continue;
          const options = field.groups ? field.groups.flatMap((group) => group.options) : field.options;
          for (const item of Array.isArray(value) ? value : [value]) expect(options).toContain(item);
        }
      }
    }
  }
});

test("specialty choices reach standard and Krea prompts", () => {
  const dna = JSON.parse(JSON.stringify(DEFAULT_DNA));
  dna.pose = { ...dna.pose, focus: "feet", distance: "detail shot" };
  dna.feet = { ...dna.feet, framing: "sole close-up", foot_pose: "arches visible in profile", pedicure_art: "chrome finish", ground_surface: "marble floor" };
  dna.wardrobe = { ...dna.wardrobe, hosiery_type: "sheer pantyhose", hosiery_denier: "sheer 15 denier" };
  dna.watersports = { ...dna.watersports, source: "self", phase: "afterward", surface: "white tile", liquid_visibility: "reflective wet floor" };
  const standard = buildPrompts(dna).positive;
  const krea = buildKrea2Prompts({ dna }).positive;
  for (const phrase of ["arches visible in profile", "chrome finish", "marble floor", "sheer 15 denier", "reflective wet floor"]) {
    expect(standard).toContain(phrase);
    expect(krea).toContain(phrase);
  }
  const priority = buildPromptPriorityPlan({ dna });
  expect(priority.important.map((item) => item.key)).toEqual(expect.arrayContaining([
    "feet.foot_pose", "feet.pedicure_art", "wardrobe.hosiery_denier", "watersports.liquid_visibility",
  ]));
});

test("clear self scene keeps one visible source and landing point in both compilers", () => {
  const dna = applyStudioPreset(JSON.parse(JSON.stringify(DEFAULT_DNA)),
    STUDIO_PROFILES.watersports.presets.find((preset) => preset.name === "Clear self stream"));
  for (const prompt of [buildPrompts(dna).positive, buildKrea2Prompts({ dna }).positive]) {
    expect(prompt).toContain("nearly colorless transparent");
    expect(prompt).toContain("one continuous stream from the same adult subject");
    expect(prompt).toContain("onto floor near feet");
  }
});

test("self foot preset preserves one subject and a reachable pose", () => {
  const dna = applyStudioPreset(JSON.parse(JSON.stringify(DEFAULT_DNA)),
    STUDIO_PROFILES.feet.presets.find((preset) => preset.name === "Self sole lick"));
  expect(dna.pose.focus).toBe("feet");
  expect(dna.pose.action).toBe("sitting on edge");
  expect(dna.feet.foot_act).toContain("self sole lick");
  expect(buildPrompts(dna).positive).toContain("self sole lick");
});

test("a specialty preset keeps the rest of the character intact", () => {
  const dna = { identity: { name: "Alex", age: 46 }, pose: { focus: "face", action: "standing" }, feet: { pedicure: "natural nails" } };
  const result = applyStudioPreset(dna, STUDIO_PROFILES.feet.presets[3]);
  expect(result.identity).toEqual(dna.identity);
  expect(result.pose.action).toBe("standing");
  expect(result.pose.focus).toBe("feet");
  expect(result.feet.pedicure).toBe("painted red");
  expect(dna.pose.focus).toBe("face");
});
