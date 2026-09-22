import { applyAdjustedKinkPreset, kinkPresetChangeSummary, presetSectionOptions } from "./kinkPresetEditor";

describe("adjustable kink presets", () => {
  const base = {
    identity: { age: 42, ethnicity: "colombian" },
    wardrobe: { outfit_preset: "dress" },
    pose: { action: "standing" },
    face: { expression: "smile" },
    kink: { power_dynamic: "none" },
    scenario: { explicit_level: 0, kink_level: 0 },
  };
  const preset = {
    dna: {
      kink: { restraint: ["rope shibari"], power_dynamic: "dominant" },
      wardrobe: { outfit_preset: "topless" },
      pose: { action: "kneeling" },
      scenario: { explicit_level: 80, kink_level: 70 },
    },
  };

  it("applies only enabled preset sections and preserves character identity", () => {
    const sections = presetSectionOptions(preset);
    sections.wardrobe = false;
    const result = applyAdjustedKinkPreset(base, preset, {
      sections,
      explicitLevel: 35,
      kinkLevel: 50,
      powerDynamic: "submissive",
      restraintMode: "none",
      role: "dominatrix",
      position: "preserve",
      expression: "preserve",
      mood: "preserve",
    });
    expect(result.identity).toEqual(base.identity);
    expect(result.wardrobe.outfit_preset).toBe("dress");
    expect(result.pose.action).toBe("standing");
    expect(result.kink.power_dynamic).toBe("submissive");
    expect(result.kink.restraint).toEqual([]);
    expect(result.scenario.roleplay).toBe("dominatrix");
    expect(result.scenario).toMatchObject({ explicit_level: 35, kink_level: 50 });
  });

  it("summarizes only the sections that will change", () => {
    expect(kinkPresetChangeSummary(preset, { kink: true, wardrobe: false, pose: true, scenario: true }))
      .toEqual(["Kink details", "Pose and camera", "Scenario and acts"]);
  });
});
