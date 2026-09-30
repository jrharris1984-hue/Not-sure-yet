import { STUDIO_PROFILES, applyStudioPreset } from "./studioProfiles";
import { mobileStudioStepForSection, mobileStudioSectionsForStep } from "../components/MobileStudioFlow";

test("each studio keeps its specialty controls in a dedicated guided step", () => {
  expect(mobileStudioStepForSection("feet", STUDIO_PROFILES.feet.steps)).toBe("focus");
  expect(mobileStudioSectionsForStep("focus", "simple", STUDIO_PROFILES.feet.steps)).toEqual(["feet"]);
  expect(mobileStudioStepForSection("watersports", STUDIO_PROFILES.watersports.steps)).toBe("focus");
  expect(mobileStudioSectionsForStep("focus", "simple", STUDIO_PROFILES.watersports.steps)).toEqual(["watersports"]);
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
