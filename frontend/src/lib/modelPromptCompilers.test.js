import { DEFAULT_DNA } from "./dna";
import {
  resolvePromptCompiler,
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

  it("turns Qwen requests into scoped edits with preservation language", () => {
    const result = buildQwenEditPrompts({
      instruction: "change the dress to blue",
      preserveUnmentioned: true,
    });
    expect(result.positive).toContain("Change only");
    expect(result.positive).toContain("change the dress to blue");
    expect(result.positive).toContain("Preserve the subject's identity");
    expect(result.negative).toContain("unrequested changes");
  });

  it("keeps WAN image-to-video motion-only and gives text-to-video full scene context", () => {
    const imageVideo = buildWanImageToVideoPrompts({ instruction: "slowly turns toward camera" });
    expect(imageVideo.positive).toContain("supplied starting image");
    expect(imageVideo.positive).toContain("slowly turns toward camera");

    const dna = JSON.parse(JSON.stringify(DEFAULT_DNA));
    dna.identity = { ...dna.identity, gender: "female", age: 38, ethnicity: "indian" };
    const textVideo = buildWanTextToVideoPrompts({ dna, instruction: "walks through warm rain" });
    expect(textVideo.positive).toContain("Single continuous cinematic shot");
    expect(textVideo.positive).toContain("walks through warm rain");
    expect(textVideo.positive).toContain("38");
    expect(textVideo.negative).toContain("temporal inconsistency");
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
