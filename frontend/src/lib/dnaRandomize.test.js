import { DEFAULT_DNA, SECTIONS, buildPrompts, normalizeMultiSelection, randomizeDna, randomizeSection } from "./dna";
import { buildPonyPrompts } from "./ponyPrompts";
import { buildPromptPriorityPlan } from "./promptPriority";
import { sliderPromptSignature } from "./builderControlResolution";
import { analyzeGenerationIntent } from "./smartGeneration";
import { catalogSections } from "./promptCatalog";

const protectedIntimate = {
  cum_state: ["cum on face"],
  saliva: ["spit strand"],
  squirt: "gushing squirt",
  sweat: "glistening",
  lube: "oiled up",
  tears: "single tear",
};

const protectedFeet = {
  foot_state: ["oiled"],
  hosiery: "sheer stockings",
  foot_act: ["sole licking"],
};

test("hands choose one, while compatible foot details can coexist", () => {
  expect(SECTIONS.find((section) => section.key === "pose").fields.find((field) => field.key === "hands").type).toBe("chips");
  const footState = SECTIONS.find((section) => section.key === "feet").fields.find((field) => field.key === "foot_state");
  expect(normalizeMultiSelection(footState, ["bare", "oiled", "in socks"], ["bare", "oiled"])).toEqual(["oiled", "in socks"]);
  expect(normalizeMultiSelection(footState, ["oiled", "in socks", "freshly washed"], ["oiled", "in socks"])).toEqual(["oiled", "in socks", "freshly washed"]);
});

describe("protected randomization", () => {
  test("section randomize preserves user-controlled intimate and feet fields", () => {
    const intimate = randomizeSection("intimate", protectedIntimate);
    const feet = randomizeSection("feet", protectedFeet);
    Object.entries(protectedIntimate).forEach(([key, value]) => expect(intimate[key]).toEqual(value));
    Object.entries(protectedFeet).forEach(([key, value]) => expect(feet[key]).toEqual(value));
  });

  test("whole-character randomize preserves the same fields", () => {
    const result = randomizeDna({
      intimate: protectedIntimate,
      feet: protectedFeet,
      scenario: { explicit_level: 0, kink_level: 0 },
    });
    Object.entries(protectedIntimate).forEach(([key, value]) => expect(result.intimate[key]).toEqual(value));
    Object.entries(protectedFeet).forEach(([key, value]) => expect(result.feet[key]).toEqual(value));
    expect(result.scenario.explicit_level).toBe(0);
    expect(result.scenario.kink_level).toBe(0);
  });
});

describe("Feet and Play prompt priority", () => {
  const dna = {
    pose: { focus: "feet" },
    identity: { age: 35, gender: "female" },
    feet: {
      sole_presentation: "soles up",
      toes: ["toe spread"],
      arch: "high arch",
      pedicure: "painted red",
      foot_state: ["oiled"],
      hosiery: "sheer stockings",
      foot_act: ["sole licking"],
      framing: "sole close-up",
    },
    kink: { restraint: ["rope shibari"], sensation: ["ice play"] },
    watersports: {},
    scenario: { acts: ["posing"] },
  };

  test("natural-language prompt promotes selected requirements", () => {
    const { positive } = buildPrompts(dna);
    expect(positive).toContain("PRIMARY SCENE ACTION");
    expect(positive).toContain("PRIMARY PLAY DETAILS");
    expect(positive).toContain("PRIMARY FEET COMPOSITION");
    expect(positive.indexOf("PRIMARY FEET COMPOSITION")).toBeLessThan(positive.indexOf("35-year-old"));
  });

  test("Pony includes every previously omitted feet/play field near the front", () => {
    const { positive } = buildPonyPrompts(dna);
    ["toe spread", "high arch", "painted red", "oiled", "sole close-up", "ice play"].forEach((value) => {
      expect(positive).toContain(value);
    });
    expect(positive.indexOf("sole licking")).toBeLessThan(positive.indexOf("35-year-old"));
  });
});


describe("scenario intensity defaults", () => {
  test("new characters keep Explicit at zero and omit the removed Kink slider", () => {
    expect(DEFAULT_DNA.scenario.explicit_level).toBe(0);
    expect(DEFAULT_DNA.scenario.kink_level).toBeUndefined();
  });

  test("zero dials do not emit implicit explicit or kink intensity tags", () => {
    const { positive } = buildPrompts(DEFAULT_DNA);
    expect(positive).not.toContain("explicit adult content");
    expect(positive).not.toContain("playful kink");
    expect(positive).not.toContain("hardcore kink");
    expect(positive).not.toContain("depraved XXX");
  });

  test("intentional slider values still emit model guidance", () => {
    const dna = {
      ...DEFAULT_DNA,
      scenario: { ...DEFAULT_DNA.scenario, explicit_level: 70, kink_level: 70 },
    };
    const { positive } = buildPrompts(dna);
    expect(positive).toContain("hardcore explicit adult scene");
    expect(positive).not.toContain("hardcore kink scene");
  });
});

test('whole-character random uses simple poses, bounded scales and opt-in foot styling', () => {
  for(let index=0;index<120;index++) {
    const result=randomizeDna(DEFAULT_DNA);
    expect(['standing','standing hip out','standing hands on hips','sitting on edge','kneeling upright']).toContain(result.pose.action);
    expect(['front','3/4','profile']).toContain(result.pose.angle);
    expect(result.camera.angle).toBe('eye-level');
    expect(result.physique.implant_volume).toBeLessThanOrEqual(1200);
    expect(result.physique.implant_volume % 50).toBe(0);
    expect(result.physique.butt_scale).toBeLessThanOrEqual(100);
    expect(result.feet).toEqual(DEFAULT_DNA.feet);
    if(/bun|chignon|ponytail|updo|braid|locs|twists/i.test(result.hair.style)) expect(['pixie','short bob']).not.toContain(result.hair.length);
  }
});

test('random preserves explicitly locked extremes and foot selections', () => {
  const current={...DEFAULT_DNA, physique:{...DEFAULT_DNA.physique,butt_scale:218,implant_volume:1450},pose:{...DEFAULT_DNA.pose,action:'bending over',angle:'from above'},feet:{...DEFAULT_DNA.feet,pedicure:'painted red'}};
  const result=randomizeDna(current,{pose:true},{physique:{butt_scale:true,implant_volume:true}});
  expect(result.physique.butt_scale).toBe(218);
  expect(result.physique.implant_volume).toBe(1450);
  expect(result.pose).toEqual(current.pose);
  expect(result.feet).toEqual(current.feet);
});


test.each([50, 70, 100])("saved kink level %s no longer changes prompts or guidance", (level) => {
  const clean = { ...DEFAULT_DNA, scenario: { ...DEFAULT_DNA.scenario, explicit_level: 0 } };
  const legacy = { ...clean, scenario: { ...clean.scenario, kink_level: level } };
  expect(buildPrompts(legacy)).toEqual(buildPrompts(clean));
  expect(buildPonyPrompts(legacy)).toEqual(buildPonyPrompts(clean));
  expect(sliderPromptSignature(legacy)).toEqual(sliderPromptSignature(clean));
  expect(analyzeGenerationIntent(legacy)).toEqual(analyzeGenerationIntent(clean));
  expect(buildPromptPriorityPlan({ dna: legacy, fieldLocks: { scenario: { kink_level: true } } }))
    .toEqual(buildPromptPriorityPlan({ dna: clean }));
});


test("saved prompt catalogs cannot restore the removed scenario slider", () => {
  const sections = catalogSections(SECTIONS, { sections: [{ key: "scenario", title: "Scenario", fields: [
    { key: "kink_level", label: "Legacy intensity", type: "slider", options: [] },
    { key: "custom_scene", label: "Custom scene", type: "text", options: [] },
  ] }] });
  const fields = sections.find(section => section.key === "scenario").fields;
  expect(fields.some(field => field.key === "kink_level")).toBe(false);
  expect(fields.some(field => field.key === "explicit_level")).toBe(true);
  expect(fields.some(field => field.key === "custom_scene")).toBe(true);
});
