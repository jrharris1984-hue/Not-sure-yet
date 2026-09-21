import {
  planLoras,
  registryForInstalled,
  compatibleRegistryForWorkflow,
  loraStackHealth,
  workflowFamily,
} from "./loraRegistry";

const installed = [
  "Z-Image\\Curated\\QQ Collection\\lora-foot.safetensors",
  "Z-Image\\Curated\\QQ Collection\\lora-doggy.safetensors",
  "Z-Image\\Curated\\QQ Collection\\lora-pov-doggy.safetensors",
  "Z-Image\\Curated\\QQ Collection\\lora-lingerie.safetensors",
  "REALSTAGRAM_ZIMG.safetensors",
  "Flux_2-Turbo-LoRA_comfyui.safetensors",
];

describe("LoRA registry planner", () => {
  test("detects workflow families", () => {
    expect(workflowFamily({ name: "IMAGE · Z-image Turbo · NSFW" })).toBe("zimage");
    expect(workflowFamily({ name: "IMAGE · Chroma1-HD" })).toBe("chroma");
    expect(workflowFamily({ name: "VIDEO · WAN 2.2" })).toBe("wan22");
  });

  test("recognizes nested Windows paths", () => {
    const found = registryForInstalled(installed);
    expect(found.some((entry) => entry.id === "qq-foot")).toBe(true);
    expect(found.some((entry) => entry.id === "flux2-turbo")).toBe(true);
  });

  test("selects at most one LoRA per optional slot", () => {
    const plan = planLoras({
      workflow: { name: "IMAGE · Z-image Turbo · NSFW" },
      dna: {
        pose: { position: "POV doggy style from behind" },
        feet: { focus: "detailed feet and soles" },
        wardrobe: { outfit: "lingerie" },
      },
      installed,
    });
    expect(plan.family).toBe("zimage");
    expect(plan.selected.filter((entry) => entry.slot === "quality")).toHaveLength(1);
    expect(plan.selected.filter((entry) => entry.slot === "body")).toHaveLength(1);
    expect(plan.selected.filter((entry) => entry.slot === "action")).toHaveLength(1);
    expect(plan.selected).toHaveLength(3);
  });

  test("does not recommend a LoRA from another model family", () => {
    const plan = planLoras({
      workflow: { name: "IMAGE · Z-image Turbo · NSFW" },
      dna: { style: { notes: "photorealistic" } },
      installed,
    });
    expect(plan.selected.every((entry) => entry.family === "zimage")).toBe(true);
    expect(plan.selected.some((entry) => entry.id === "flux2-turbo")).toBe(false);
  });

  test("keeps automatic recommendations inside the family strength budget", () => {
    const plan = planLoras({
      workflow: { name: "IMAGE · Z-image Turbo · NSFW" },
      dna: {
        pose: { action: "POV doggy style" },
        feet: { sole_presentation: "detailed feet" },
        wardrobe: { outfit_preset: "lingerie" },
      },
      installed,
    });
    expect(plan.totalStrength).toBeLessThanOrEqual(plan.budget);
    expect(plan.selected.every((entry) => entry.reason)).toBe(true);
  });

  test("filters assisted choices to the active workflow family", () => {
    const compatible = compatibleRegistryForWorkflow(
      { name: "IMAGE · Z-image Turbo · NSFW" },
      installed
    );
    expect(compatible.every((entry) => entry.family === "zimage")).toBe(true);
    expect(compatible.some((entry) => entry.id === "flux2-turbo")).toBe(false);
  });

  test("warns about cross-family files, conflicts, and excessive strength", () => {
    const health = loraStackHealth({
      workflow: { name: "IMAGE · Z-image Turbo · NSFW" },
      installed,
      overrides: {
        a: { lora_name: "Flux_2-Turbo-LoRA_comfyui.safetensors", strength_model: 0.8 },
        b: { lora_name: "Z-Image\\Curated\\QQ Collection\\lora-doggy.safetensors", strength_model: 1.2 },
        c: { lora_name: "Z-Image\\Curated\\QQ Collection\\lora-pov-doggy.safetensors", strength_model: 1.0 },
      },
    });
    expect(health.status).toBe("warning");
    expect(health.warnings.some((warning) => warning.includes("not zimage"))).toBe(true);
    expect(health.warnings.some((warning) => warning.includes("conflicts"))).toBe(true);
    expect(health.warnings.some((warning) => warning.includes("budget"))).toBe(true);
  });
});
