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
    expect(resolvePromptCompiler({ promptStyle: "krea2" })).toBe("krea2");
    expect(resolvePromptCompiler({ promptStyle: "flux2_klein" })).toBe("flux2_klein");
    expect(resolvePromptCompiler({ promptStyle: "sdxl" })).toBe("sdxl");
    expect(resolvePromptCompiler({ promptStyle: "sdxl_dmd2" })).toBe("sdxl_dmd2");
    expect(resolvePromptCompiler({ workflowName: "SDXL · Juggernaut XL v9" })).toBe("sdxl");
    expect(resolvePromptCompiler({ workflowName: "Krea 2 Turbo" })).toBe("krea2");
  });

  it("keeps adult identity and selected body controls in a bounded SDXL prompt", () => {
    const dna = JSON.parse(JSON.stringify(DEFAULT_DNA));
    dna.identity = { ...dna.identity, gender: "female", age: 44 };
    dna.physique = { ...dna.physique, implant_volume: 5000, butt_scale: 100 };
    const result = compileModelPrompts({ promptStyle: "sdxl", dna });
    expect(result.positive).toContain("44-year-old adult");
    expect(result.positive).toMatch(/oversized|extremely/);
    expect(result.negativeStrategy).toBe("text");
    expect(result.negative).toBe("");
    expect(result.promptBudget).toBe(150);
  });

  it("compiles Krea 2 as a guarded still prompt with zeroed negative conditioning", () => {
    const dna = JSON.parse(JSON.stringify(DEFAULT_DNA));
    dna.identity = { ...dna.identity, gender: "female", age: 44, ethnicity: "filipina" };
    dna.pose = { ...dna.pose, action: "standing", distance: "full body" };
    const result = compileModelPrompts({ promptStyle: "krea2", dna });
    expect(result.positive).toContain("44-year-old adult woman");
    expect(result.positive).toContain("full body framing");
    expect(result.positive).toContain("Photorealistic editorial photograph");
    expect(result.positive).not.toContain("NORMAL HUMAN ANATOMY REQUIRED");
    expect(result.profile).toBe("krea2-photo-directed-v1");
    expect(result.negative).toBe("");
    expect(result.negativeStrategy).toBe("zeroed");
  });

  it("keeps a reclining fantasy-scale Krea subject inside a full-body frame", () => {
    const flux2 = compileModelPrompts({ promptStyle: "flux2_klein", dna: DEFAULT_DNA });
    expect(flux2.positive).toBeTruthy();
    expect(flux2.negativeStrategy).toBe("zeroed");
    expect(flux2.negative).toBe("");
    const dna = JSON.parse(JSON.stringify(DEFAULT_DNA));
    dna.physique = { ...dna.physique, implant_volume: 3000 };
    dna.pose = { ...dna.pose, action: "lying down", distance: "full body" };
    const result = compileModelPrompts({ promptStyle: "krea2", dna });
    expect(result.positive).toContain("both feet");
    expect(result.positive).toContain("Do not crop to the face or shoulders");
    expect(result.positive).toContain("fantasy-scale augmented bust");
    expect(result.positive).not.toContain("Use believable adult proportions");
  });

  it("includes selected hosiery, heels, nails, and glasses in Krea wardrobe text", () => {
    const dna = JSON.parse(JSON.stringify(DEFAULT_DNA));
    dna.wardrobe = {
      ...dna.wardrobe, hosiery_type: "sheer pantyhose", hosiery_color: "black",
      heel_type: "platform pumps", heel_color: "red", nail_color: "burgundy",
      glasses_style: "cat-eye frames", glasses_color: "gold",
    };
    const result = compileModelPrompts({ promptStyle: "krea2", dna });
    expect(result.positive).toContain("black sheer pantyhose");
    expect(result.positive).toContain("red platform pumps");
    expect(result.positive).toContain("burgundy fingernails");
    expect(result.positive).toContain("gold cat-eye frames");
  });

  it("keeps face emphasis within a selected knees-up Krea crop", () => {
    const dna = JSON.parse(JSON.stringify(DEFAULT_DNA));
    dna.pose = { ...dna.pose, distance: "knees-up", focus: "face" };
    const result = compileModelPrompts({ promptStyle: "krea2", dna });
    expect(result.positive).toContain("Knees-up photograph");
    expect(result.positive).toContain("face clearly visible within the head-to-knees composition");
    expect(result.positive).not.toContain("face composition priority");
    expect(result.positive).not.toContain("face composition focus");
  });

  it("orders Krea 2 prompts as subject and pose before camera/style details", () => {
    const dna = JSON.parse(JSON.stringify(DEFAULT_DNA));
    dna.identity = { ...dna.identity, gender: "female", age: 38, ethnicity: "colombian" };
    dna.physique = { ...dna.physique, body_type: "hourglass", bust: "large", hips: "wide" };
    dna.wardrobe = { ...dna.wardrobe, outfit_preset: "cocktail dress" };
    dna.pose = { ...dna.pose, action: "standing hip out", distance: "full body", angle: "3/4" };
    dna.scene = { ...dna.scene, environment: "studio" };
    dna.lighting = { ...dna.lighting, source: "softbox", mood: "soft" };
    dna.camera = { ...dna.camera, lens: "85mm", angle: "eye-level" };
    const result = compileModelPrompts({ promptStyle: "krea2", dna });
    const subjectAt = result.positive.indexOf("38-year-old adult woman");
    const poseAt = result.positive.indexOf("standing hip out");
    const cameraAt = result.positive.indexOf("85mm lens");
    const styleAt = result.positive.indexOf("Photorealistic editorial photograph");
    expect(subjectAt).toBeGreaterThanOrEqual(0);
    expect(poseAt).toBeGreaterThan(subjectAt);
    expect(cameraAt).toBeGreaterThan(poseAt);
    expect(styleAt).toBeGreaterThan(cameraAt);
    expect(result.promptWords).toBeLessThanOrEqual(300);
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

  it("removes contradictory body, hair, and raised-leg pose instructions", () => {
    const dna = JSON.parse(JSON.stringify(DEFAULT_DNA));
    dna.style.anatomy_mode = "natural";
    dna.physique = {
      ...dna.physique,
      body_type: "plus size",
      bust: "large",
      bust_shape: "athletic",
      butt: "large",
      hips: "narrow",
    };
    dna.hair = { ...dna.hair, length: "pixie", style: "wavy" };
    dna.pose = {
      ...dna.pose,
      action: "lying legs up",
      angle: "over-shoulder",
      distance: "close-up",
      focus: "body",
      hands: ["touching body"],
    };

    const guard = resolveZImageComposition(dna);
    expect(guard.dna.physique.bust_shape).toBe("athletic");
    expect(guard.dna.physique.hips).toBe("average");
    expect(guard.dna.hair.style).toBe("");
    expect(guard.dna.pose).toMatchObject({ angle: "3/4", distance: "full body", hands: ["at sides"] });

    const result = buildZImagePrompts({ dna });
    expect(result.positive).toContain("large heavy D-cup breasts");
    expect(result.positive).not.toContain("small athletic firm breasts");
    expect(result.positive).toContain("short pixie cut");
    expect(result.positive).not.toContain("loose beachy waves");
    expect(result.positive).not.toContain("extreme close-up shot");
    expect(result.positive).not.toContain("over-the-shoulder view");
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

  it("gives Chroma fantasy proportion sliders a strong localized priority without natural-proportion conflicts", () => {
    const dna = JSON.parse(JSON.stringify(DEFAULT_DNA));
    dna.physique = {
      ...dna.physique,
      butt_scale: 100,
      hip_scale: 85,
      thigh_scale: 80,
      glute_shape: "extreme round projection",
    };
    const result = compileModelPrompts({ promptStyle: "chroma", dna });
    expect(result.positive).toContain("PRIMARY BODY PROPORTIONS");
    expect(result.positive).toContain("fantasy-scale extremely oversized glute volume");
    expect(result.positive).toContain("spherical glute contour, steep rounded outer profile");
    expect(result.positive).toContain("extremely wide fantasy-scale hips");
    expect(result.positive).toContain("extremely thick fantasy-scale thighs");
    expect(result.positive).not.toContain("believable adult proportions");
    expect(result.positive).not.toContain("detailed anatomy with natural proportions");
  });


  it("keeps Chroma detail-slider values distinct and removes imported body-size anchoring", () => {
    const low = JSON.parse(JSON.stringify(DEFAULT_DNA));
    low.physique = {
      ...low.physique,
      butt: "hyper",
      butt_scale: 20,
      proportions: "Large bust and prominent buttocks from imported analyzer metadata",
    };
    const high = JSON.parse(JSON.stringify(low));
    high.physique.butt_scale = 80;

    const lowResult = compileModelPrompts({ promptStyle: "chroma", dna: low });
    const highResult = compileModelPrompts({ promptStyle: "chroma", dna: high });

    expect(lowResult.positive).toContain("moderate glute volume (size intensity 20/300)");
    expect(highResult.positive).toContain("extremely oversized with strong rear projection glute volume (size intensity 80/300)");
    expect(lowResult.positive).not.toContain("Large bust and prominent buttocks from imported analyzer metadata");
    expect(highResult.positive).not.toContain("Large bust and prominent buttocks from imported analyzer metadata");
    expect(lowResult.positive).not.toBe(highResult.positive);
  });

  it("uses actual increasing glute sizes in new Chroma generation without edit instructions", () => {
    const prompts = [10, 20, 50, 80, 100].map((value) => {
      const dna = JSON.parse(JSON.stringify(DEFAULT_DNA));
      dna.physique.butt_scale = value;
      dna.physique.butt = "flat";
      return compileModelPrompts({ promptStyle: "chroma", workflowKind: "image", dna }).positive;
    });
    expect(prompts[0]).toContain("small glute volume");
    expect(prompts[1]).toContain("moderate glute volume");
    expect(prompts[2]).toContain("very large rounded with prominent rear projection glute volume");
    expect(prompts[3]).toContain("extremely oversized with strong rear projection glute volume");
    expect(prompts[4]).toContain("fantasy-scale extremely oversized glute volume");
    prompts.forEach((prompt) => {
      expect(prompt).not.toContain("flat pancake");
      expect(prompt).not.toContain("LOCALIZED BODY EDIT");
      expect(prompt).not.toContain("source image");
    });
  });

});


test("Krea preserves a selected portrait crop with exaggerated proportions", () => {
  const dna = JSON.parse(JSON.stringify(DEFAULT_DNA));
  dna.physique.implant_volume = 3000;
  dna.pose.distance = "portrait";
  const result = compileModelPrompts({ promptStyle: "krea2", dna });
  expect(result.positive).toContain("Head-and-shoulders portrait");
  expect(result.positive).not.toContain("The complete body and exaggerated upper-body silhouette");
});

test("Chroma keeps full-body framing when the face is emphasized", () => {
  const dna = JSON.parse(JSON.stringify(DEFAULT_DNA));
  dna.pose.distance = "full body";
  dna.pose.focus = "face";
  const result = compileModelPrompts({ promptStyle: "chroma", dna });
  expect(result.positive).toContain("full character visible head to feet");
  expect(result.positive).not.toContain("face is the single visual priority");
});
