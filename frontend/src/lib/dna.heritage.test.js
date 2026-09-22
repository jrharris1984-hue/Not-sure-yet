import {
  DEFAULT_DNA,
  createHeritageCharacterVariation,
} from "./dna";

const clone = (value) => JSON.parse(JSON.stringify(value));

describe("createHeritageCharacterVariation", () => {
  afterEach(() => jest.restoreAllMocks());

  it("varies only the approved character fields and preserves Play controls", () => {
    jest.spyOn(Math, "random").mockReturnValue(0);
    const current = clone(DEFAULT_DNA);
    current.identity = { ...current.identity, age: 47, ethnicity: "irish" };
    current.physique = { ...current.physique, body_type: "__old_body__" };
    current.intimate = {
      ...current.intimate,
      pubic_hair: "__old_hair__",
      pussy: "__old_pussy__",
      nipples: "__locked_nipples__",
      cum_state: ["keep mess"],
      saliva: ["keep saliva"],
      squirt: "keep squirt",
    };
    current.feet = {
      ...current.feet,
      sole_presentation: "__old_soles__",
      foot_state: ["keep foot state"],
      foot_act: ["keep foot act"],
    };
    current.scenario = {
      ...current.scenario,
      explicit_level: 73,
      kink_level: 62,
    };
    current.kink = { ...current.kink, restraint: ["keep restraint"] };

    const result = createHeritageCharacterVariation(
      current,
      { identity: { ethnicity: "filipino" } },
      {},
      { intimate: { nipples: true } }
    );

    expect(result.identity.ethnicity).toBe("filipino");
    expect(result.identity.age).toBe(47);
    expect(result.physique.body_type).not.toBe("__old_body__");
    expect(result.intimate.pubic_hair).not.toBe("__old_hair__");
    expect(result.intimate.pussy).not.toBe("__old_pussy__");
    expect(result.intimate.nipples).toBe("__locked_nipples__");
    expect(result.intimate.cum_state).toEqual(["keep mess"]);
    expect(result.intimate.saliva).toEqual(["keep saliva"]);
    expect(result.intimate.squirt).toBe("keep squirt");
    expect(result.feet.sole_presentation).not.toBe("__old_soles__");
    expect(result.feet.foot_state).toEqual(["keep foot state"]);
    expect(result.feet.foot_act).toEqual(["keep foot act"]);
    expect(result.scenario.explicit_level).toBe(73);
    expect(result.scenario.kink_level).toBe(62);
    expect(result.kink.restraint).toEqual(["keep restraint"]);
  });

  it("respects section locks and clamps imported ages to 21+", () => {
    jest.spyOn(Math, "random").mockReturnValue(0);
    const current = clone(DEFAULT_DNA);
    current.identity = { ...current.identity, age: 18, ethnicity: "unknown" };
    current.physique = { ...current.physique, body_type: "locked physique" };

    const result = createHeritageCharacterVariation(
      current,
      { identity: { ethnicity: "nigerian" } },
      { physique: true },
      {}
    );

    expect(result.identity.ethnicity).toBe("nigerian");
    expect(result.identity.age).toBe(21);
    expect(result.physique.body_type).toBe("locked physique");
  });

  it("keeps feet optional in balanced heritage characters and never changes Play", () => {
    jest.spyOn(Math, "random").mockReturnValue(0.5);
    const current = clone(DEFAULT_DNA);
    current.feet = { ...current.feet, sole_presentation: "soles up", foot_act: ["keep act"] };
    current.kink = { ...current.kink, restraint: ["keep kink"] };
    const result = createHeritageCharacterVariation(
      current,
      { identity: { ethnicity: "jamaican" } },
      {},
      {},
      { density: "balanced" }
    );
    expect(result.feet.sole_presentation).toBe("");
    expect(result.feet.foot_act).toEqual(["keep act"]);
    expect(result.kink.restraint).toEqual(["keep kink"]);
    expect(result.pose.focus).not.toBe("feet");
  });
});
