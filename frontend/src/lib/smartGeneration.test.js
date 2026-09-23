import { inferGenerationTarget, recommendSmartSetup } from "./smartGeneration";

const workflows = [
  { id: "z", name: "Z-Image Turbo · NSFW", kind: "image", prompt_style: "zimage" },
  { id: "c", name: "Golden Chroma", kind: "image", prompt_style: "chroma" },
  { id: "e", name: "Qwen Edit", kind: "edit", prompt_style: "qwen_edit" },
  { id: "v", name: "WAN Image to Video", kind: "video", prompt_style: "wan_i2v" },
];

describe("smart generation setup", () => {
  it("prefers Z-Image for explicit still-image DNA", () => {
    const result = recommendSmartSetup({ workflows, target: "still", dna: { scenario: { explicit_level: 60 } } });
    expect(result.workflowId).toBe("z");
    expect(result.loraMode).toBe("automatic");
  });

  it("chooses the matching edit workflow and requires a source", () => {
    const result = recommendSmartSetup({ workflows, target: "edit" });
    expect(result.workflowId).toBe("e");
    expect(result.warnings).toContain("This target needs a source image.");
  });

  it("infers generation targets from workflow kinds", () => {
    expect(inferGenerationTarget({ kind: "video" })).toBe("animate");
    expect(inferGenerationTarget({ kind: "image" })).toBe("still");
  });
});
