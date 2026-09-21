import { DEFAULT_DNA, buildPrompts, randomizeDna, randomizeSection } from "./dna";
import { buildPonyPrompts } from "./ponyPrompts";

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
  test("new characters start with Explicit and Kink at zero", () => {
    expect(DEFAULT_DNA.scenario.explicit_level).toBe(0);
    expect(DEFAULT_DNA.scenario.kink_level).toBe(0);
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
    expect(positive).toContain("hardcore kink scene");
  });
});
