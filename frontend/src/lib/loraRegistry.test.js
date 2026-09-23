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
  "Z-Image\\Curated\\QQ Collection\\lora-cum.safetensors",
  "Z-Image\\Curated\\QQ Collection\\lora-bukkake.safetensors",
  "Z-Image\\girls pee.safetensors",
  "Z-Image\\Curated\\Body\\feet v2.1.safetensors",
  "Z-Image\\Curated\\Quality\\Hands + Feet + skin v1.1.safetensors",
  "Z-Image\\Curated\\Body\\Z-Breast-Slider.safetensors",
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

  test("does not treat empty DNA property names as active selections", () => {
    const plan = planLoras({
      workflow: { name: "IMAGE · Z-image Turbo · NSFW" },
      dna: {
        feet: { sole_presentation: "", foot_act: [] },
        intimate: { cum_state: [], squirt: "none" },
        watersports: { source: "none" },
        scenario: { explicit_level: 0, kink_level: 0 },
      },
      installed,
    });
    expect(plan.selected.some((entry) => entry.id === "qq-foot")).toBe(false);
    expect(plan.selected.some((entry) => entry.id === "qq-cum")).toBe(false);
    expect(plan.selected.some((entry) => entry.id === "z-pee")).toBe(false);
  });

  test("changes the action recommendation when the selected act changes", () => {
    const cumPlan = planLoras({
      workflow: { name: "IMAGE · Z-image Turbo · NSFW" },
      dna: { intimate: { cum_state: ["visible semen"] } },
      installed,
    });
    const bukkakePlan = planLoras({
      workflow: { name: "IMAGE · Z-image Turbo · NSFW" },
      dna: { scenario: { acts: ["bukkake"] } },
      installed,
    });
    expect(cumPlan.selected.find((entry) => entry.slot === "action")?.id).toBe("qq-cum");
    expect(bukkakePlan.selected.find((entry) => entry.slot === "action")?.id).toBe("qq-bukkake");
  });

  test("maps feet, pussy, and pee selections to their installed LoRA families", () => {
    const feet = planLoras({
      workflow: { name: "IMAGE · Z-image Turbo · NSFW" },
      dna: { feet: { sole_presentation: "soles up", foot_act: ["foot worship"] } },
      installed,
    });
    expect(feet.matches.some((entry) => ["z-feet-v2", "qq-foot"].includes(entry.id))).toBe(true);

    const pussy = planLoras({
      workflow: { name: "IMAGE · Z-image Turbo · NSFW" },
      dna: { intimate: { pussy: "visible pussy with detailed labia" } },
      installed: [...installed, "Z-Image\\Curated\\QQ Collection\\lora-pussy.safetensors"],
    });
    expect(pussy.selected.some((entry) => entry.id === "qq-pussy")).toBe(true);

    for (const word of ["pee", "peeing", "piss", "pissing", "urinating"]) {
      const plan = planLoras({
        workflow: { name: "IMAGE · Z-image Turbo · NSFW" },
        dna: { watersports: { notes: word } },
        installed,
      });
      expect(plan.selected.some((entry) => entry.id === "z-pee")).toBe(true);
    }
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
