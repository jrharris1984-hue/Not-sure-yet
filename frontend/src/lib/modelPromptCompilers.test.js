import { DEFAULT_DNA } from "./dna";
import {
  resolvePromptCompiler,
  resolveZImageComposition,
  buildZImagePrompts,
  buildQwenEditPrompts,
  buildWanImageToVideoPrompts,
  buildWanTextToVideoPrompts,
  compileModelPrompts,
} from "./modelPromptCompilers";

describe("model-specific prompt compilers", () => {
  it("routes old saved workflows by kind or name", () => {
    expect(resolvePromptCompiler({ promptStyle: "venice", workflowName: "Z-image Turbo · NSFW" })).toBe("zimage");
    expect(resolvePromptCompiler({ promptStyle: "venice", workflowKind: "edit" })).toBe("qwen_edit");
    expect(resolvePromptCompiler({ promptStyle: "venice", workflowKind: "video" })).toBe("wan_i2v");
    expect(resolvePromptCompiler({ promptStyle: "venice", workflowKind: "text_video" })).toBe("wan_t2v");
    expect(resolvePromptCompiler({ promptStyle: "pony" })).toBe("pony");
    expect(resolvePromptCompiler({ promptStyle: "chroma" })).toBe("chroma");
  });

  it("keeps Z-Image natural language compact and uses its own negative prompt", () => {
    const dna = JSON.parse(JSON.stringify(DEFAULT_DNA));
    dna.identity = { ...dna.identity, gender: "female", age: 42, ethnicity: "colombian" };
    dna.pose = { ...dna.pose, action: "standing", distance: "full body" };
    const result = buildZImagePrompts({ dna });
    expect(result.positive).toContain("42");
    expect(result.positive.split(/\s+/).length).toBeLessThanOrEqual(360);
    expect(result.negative).toContain("malformed feet");
    expect(result.negative).not.toContain("score_9");
  });

  it("uses Natural mode to suppress competing extreme anatomy and secondary feet priority", () => {
    const dna = JSON.parse(JSON.stringify(DEFAULT_DNA));
    dna.style.anatomy_mode = "natural";
    dna.physique = {
      ...dna.physique,
      bust: "hyper",
      butt: "hyper",
      thighs: "massive",
      hips: "extreme",
      exaggeration: 100,
    };
    dna.pose = {
      ...dna.pose,
      angle: "pov",
      distance: "full body",
      focus: "body",
    };
    dna.feet = {
      ...dna.feet,
      sole_presentation: "sole showcase",
      foot_size: "size queen",
      pedicure: "painted red",
      framing: "sole close-up",
    };

    const guard = resolveZImageComposition(dna);
    expect(guard.anatomyMode).toBe("natural");
    expect(guard.dna.physique.bust).toBe("large");
    expect(guard.dna.physique.butt).toBe("large");
    expect(guard.dna.physique.exaggeration).toBe(35);
    expect(guard.dna.pose.angle).toBe("3/4");
    expect(guard.dna.feet).toEqual({});
    expect(guard.composition).toContain("exactly one adult person");

    const result = buildZImagePrompts({ dna });
    expect(result.positive).toContain("NORMAL HUMAN ANATOMY REQUIRED");
    expect(result.positive).toContain("red-painted toenails");
    expect(result.positive).not.toContain("PRIMARY FEET COMPOSITION");
    expect(result.positive).not.toContain("hyper-inflated");
    expect(result.positive.split(/\\s+/).length).toBeLessThanOrEqual(220);
  });

  it("preserves explicit extreme choices only when Extreme mode is selected", () => {
    const dna = JSON.parse(JSON.stringify(DEFAULT_DNA));
    dna.style.anatomy_mode = "extreme";
    dna.physique.bust = "hyper";
    dna.pose.focus = "feet";
    dna.feet.foot_size = "size queen";
    const guard = resolveZImageComposition(dna);
    expect(guard.dna.physique.bust).toBe("hyper");
    expect(guard.dna.feet.foot_size).toBe("size queen");
    expect(guard.anatomyMode).toBe("extreme");
  });

  it("turns Qwen requests into scoped edits with preservation language", () => {
    const result = buildQwenEditPrompts({
      instruction: "change the dress to blue",
      preserveUnmentioned: true,
    });
    expect(result.positive).toContain("Change only");
    expect(result.positive).toContain("change the dress to blue");
    expect(result.positive).toContain("Preserve the subject's identity");
    expect(result.positive).toContain("Keep one connected human body");
    expect(result.negative).toContain("unrequested changes");
  });

  it("keeps WAN image-to-video motion-only and gives text-to-video full scene context", () => {
    const imageVideo = buildWanImageToVideoPrompts({ instruction: "slowly turns toward camera" });
    expect(imageVideo.positive).toContain("supplied starting image");
    expect(imageVideo.positive).toContain("slowly turns toward camera");
    expect(imageVideo.positive).toContain("same number of people");

    const dna = JSON.parse(JSON.stringify(DEFAULT_DNA));
    dna.identity = { ...dna.identity, gender: "female", age: 38, ethnicity: "indian" };
    const textVideo = buildWanTextToVideoPrompts({ dna, instruction: "walks through warm rain" });
    expect(textVideo.positive).toContain("Single continuous cinematic shot");
    expect(textVideo.positive).toContain("walks through warm rain");
    expect(textVideo.positive).toContain("38");
    expect(textVideo.negative).toContain("temporal inconsistency");
  });

  it("applies the Natural human guard to Pony, Chroma, and standard still compilers", () => {
    const dna = JSON.parse(JSON.stringify(DEFAULT_DNA));
    dna.style.anatomy_mode = "natural";
    dna.physique.bust = "hyper";
    dna.pose.hands = ["touching body", "behind head"];
    ["pony", "chroma", "standard"].forEach((promptStyle) => {
      const result = compileModelPrompts({ promptStyle, dna });
      expect(result.positive).toContain("NORMAL HUMAN ANATOMY REQUIRED");
      expect(result.positive).not.toContain("hyper-inflated");
      expect(result.guardAdjustments.length).toBeGreaterThan(0);
    });
  });

  it("does not inject the solo-person guard into a multi-subject scene", () => {
    const subjects = [
      { id: "a", dna: JSON.parse(JSON.stringify(DEFAULT_DNA)) },
      { id: "b", dna: JSON.parse(JSON.stringify(DEFAULT_DNA)) },
    ];
    const result = compileModelPrompts({ promptStyle: "chroma", dna: subjects[0].dna, subjects, isMulti: true });
    expect(result.positive).not.toContain("exactly one adult person");
  });

  it("resolves incompatible Z-Image composition choices before compiling", () => {
    const dna = JSON.parse(JSON.stringify(DEFAULT_DNA));
    dna.pose = {
      ...dna.pose,
      action: "kneeling back arched",
      distance: "full body",
      focus: "butt",
      hands: ["touching body", "gripping something", "behind head"],
    };
    dna.feet = {
      ...dna.feet,
      sole_presentation: "soles up",
      framing: "sole close-up",
    };
    dna.hair = { ...dna.hair, style: "updo", length: "short bob" };

    const guard = resolveZImageComposition(dna);
    expect(guard.dna.pose.hands).toEqual(["behind head"]);
    expect(guard.dna.hair.length).toBe("");
    expect(guard.dna.feet.framing).toBeUndefined();
    expect(guard.composition).toContain("rear three-quarter full-body");
    expect(guard.adjustments.length).toBe(3);

    const result = buildZImagePrompts({ dna });
    expect(result.positive).toContain("PRIMARY COMPOSITION");
    expect(result.positive).toContain("rear three-quarter full-body");
    expect(result.positive).not.toContain("gripping something");
    expect(result.negative).toContain("duplicated genitals");
    expect(result.negative).toContain("finger-like toes");
  });

  it("uses edit and video instructions rather than the generic image prompt", () => {
    const qwen = compileModelPrompts({
      workflowKind: "edit",
      dna: DEFAULT_DNA,
      editInstruction: "remove the necklace",
    });
    expect(qwen.positive).toContain("remove the necklace");

    const wan = compileModelPrompts({
      workflowKind: "video",
      dna: DEFAULT_DNA,
      videoInstruction: "subtle breathing",
    });
    expect(wan.positive).toContain("subtle breathing");
  });
});
