import {
  analyzePromptQuality,
  optimizePromptText,
  promptProfile,
} from "./promptQuality";

describe("prompt quality preflight", () => {
  test("selects a model-aware profile", () => {
    expect(promptProfile({ name: "IMAGE · Z-image Turbo · NSFW" })).toBe("zimage");
    expect(promptProfile({ prompt_style: "chroma" })).toBe("chroma");
    expect(promptProfile({ prompt_style: "pony" })).toBe("pony");
  });

  test("safe cleanup removes only exact duplicate clauses and filler", () => {
    expect(optimizePromptText("portrait, hourglass figure, portrait, none, soft light"))
      .toBe("portrait, hourglass figure, soft light");
  });

  test("reports missing generation anchors", () => {
    const result = analyzePromptQuality({
      positive: "photorealistic portrait",
      dna: { skin: { tone: "tan" }, pose: {}, scene: {}, lighting: {} },
      workflow: { name: "Z-image Turbo" },
    });
    expect(result.issues.map((issue) => issue.code)).toEqual(expect.arrayContaining(["pose", "scene", "lighting"]));
  });

  test("blocks Qwen and WAN image-to-video until a source image is available", () => {
    const qwen = analyzePromptQuality({
      positive: "Change only the dress color.",
      workflow: { kind: "edit", prompt_style: "qwen_edit" },
      context: { hasReferenceImage: false, editInstruction: "change dress color" },
    });
    expect(qwen.ready).toBe(false);
    expect(qwen.blockers.some((item) => item.code === "source-image")).toBe(true);

    const wan = analyzePromptQuality({
      positive: "Animate subtle breathing.",
      workflow: { kind: "video", prompt_style: "wan_i2v" },
      context: { hasReferenceImage: true, videoInstruction: "subtle breathing" },
    });
    expect(wan.ready).toBe(true);
  });

  test("detects wardrobe, feet-focus, and cast-count conflicts without blocking", () => {
    const result = analyzePromptQuality({
      positive: "adult portrait in a studio",
      dna: {
        identity: { age: 42 },
        wardrobe: { outfit_preset: "nude", top: "corset" },
        pose: { action: "standing", focus: "face" },
        feet: { sole_presentation: "soles up" },
        scenario: { cast_size: "duo" },
        scene: { environment: "studio" },
        lighting: { source: "softbox" },
        skin: {},
      },
      workflow: { prompt_style: "zimage" },
      context: { subjectCount: 1 },
    });
    expect(result.issues.map((item) => item.code)).toEqual(expect.arrayContaining([
      "wardrobe-conflict", "feet-focus", "cast-count",
    ]));
    expect(result.ready).toBe(true);
  });

  test("blocks a subject age below 21", () => {
    const result = analyzePromptQuality({
      positive: "portrait",
      dna: { identity: { age: 18 }, pose: {}, scene: {}, lighting: {}, skin: {} },
      workflow: { prompt_style: "zimage" },
      context: { subjectCount: 1 },
    });
    expect(result.blockers.some((item) => item.code === "adult-age")).toBe(true);
  });

  test("flags a selected skin tone conflict", () => {
    const result = analyzePromptQuality({
      positive: "portrait, pale porcelain skin, standing pose",
      dna: { skin: { tone: "dark brown" }, pose: { action: "standing" }, scene: { environment: "studio" }, lighting: { source: "softbox" } },
      workflow: { name: "Z-image Turbo" },
    });
    expect(result.issues.some((issue) => issue.code === "skin-conflict" && issue.severity === "error")).toBe(true);
  });
});
