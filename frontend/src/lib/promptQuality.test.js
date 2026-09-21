import {
  analyzePromptQuality,
  optimizePromptText,
  promptProfile,
} from "./promptQuality";

describe("prompt quality preflight", () => {
  test("selects a model-aware profile", () => {
    expect(promptProfile({ name: "IMAGE · Z-image Turbo · NSFW" })).toBe("z_image");
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

  test("flags a selected skin tone conflict", () => {
    const result = analyzePromptQuality({
      positive: "portrait, pale porcelain skin, standing pose",
      dna: { skin: { tone: "dark brown" }, pose: { action: "standing" }, scene: { environment: "studio" }, lighting: { source: "softbox" } },
      workflow: { name: "Z-image Turbo" },
    });
    expect(result.issues.some((issue) => issue.code === "skin-conflict" && issue.severity === "error")).toBe(true);
  });
});
