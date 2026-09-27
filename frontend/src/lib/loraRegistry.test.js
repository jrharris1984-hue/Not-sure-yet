import {
  planLoras,
  registryForInstalled,
  compatibleRegistryForWorkflow,
  compatibleInstalledLoras,
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
    expect(workflowFamily({ name: "IMAGE · Krea 2 Turbo" })).toBe("krea2");
  });

  test("recognizes nested Windows paths", () => {
    const found = registryForInstalled(installed);
    expect(found.some((entry) => entry.id === "qq-foot")).toBe(true);
    expect(found.some((entry) => entry.id === "flux2-turbo")).toBe(true);
  });

  test("selects only the strongest optional LoRA by default", () => {
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
    expect(plan.selected).toHaveLength(1);
    expect(plan.matches.length).toBeGreaterThan(1);
  });

  test("advanced mode can select one compatible LoRA per optional slot", () => {
    const plan = planLoras({
      workflow: { name: "IMAGE · Z-image Turbo · NSFW" },
      dna: {
        pose: { position: "POV doggy style from behind" },
        feet: { focus: "detailed feet and soles" },
        wardrobe: { outfit: "lingerie" },
      },
      installed,
      stackMode: "advanced",
    });
    expect(plan.selected.length).toBeGreaterThan(1);
    expect(new Set(plan.selected.map((entry) => entry.slot)).size).toBe(plan.selected.length);
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

  test("uses no optional LoRA for weak or absent matches", () => {
    const plan = planLoras({
      workflow: { name: "IMAGE · Z-image Turbo · NSFW" },
      dna: { identity: { age: 44, name: "Test" } },
      installed,
    });
    expect(plan.selected).toHaveLength(0);
  });

  test("filters assisted choices to the active workflow family", () => {
    const compatible = compatibleRegistryForWorkflow(
      { name: "IMAGE · Z-image Turbo · NSFW" },
      installed
    );
    expect(compatible.every((entry) => entry.family === "zimage")).toBe(true);
    expect(compatible.some((entry) => entry.id === "flux2-turbo")).toBe(false);
  });

  test("shows only the matching Krea 2 LoRAs in the universal picker", () => {
    const kreaInstalled = [
      "Krea2\\Private_Magazine_2000s_v1.safetensors",
      "Krea2\\Freya_Krea2.safetensors",
      "Flux\\flux_lustly-ai_v1.safetensors",
      "Private_Magazine_2000s_v1.safetensors",
    ];
    const compatible = compatibleInstalledLoras(
      { name: "Krea 2 Turbo", prompt_style: "krea2" },
      kreaInstalled
    );
    expect(compatible.some((entry) => entry.label.includes("Private Magazine"))).toBe(true);
    expect(compatible.some((entry) => entry.label.includes("Freya"))).toBe(true);
    expect(compatible.some((entry) => entry.family === "flux")).toBe(false);
    expect(compatible.filter((entry) => entry.label.includes("Private Magazine"))).toHaveLength(1);
    const magazine = compatible.find((entry) => entry.label.includes("Private Magazine"));
    expect(magazine.triggerWords).toContain("privatemag");
    expect(magazine.defaultStrength).toBe(0.8);
  });

  test("does not offer workflow-required or identity LoRAs as optional choices", () => {
    const local = [
      "goldenchromaV1.safetensors",
      "Flux_2-Turbo-LoRA_comfyui.safetensors",
      "ip-adapter-faceid-plusv2_sd15_lora.safetensors",
    ];
    const chroma = compatibleInstalledLoras({ name: "Chroma1-HD · Golden T2I", prompt_style: "chroma" }, local);
    const flux = compatibleInstalledLoras({ name: "Flux image", prompt_style: "flux" }, local);
    const face = compatibleInstalledLoras({ name: "Face-Preserved", kind: "face" }, local);
    expect(chroma.some((entry) => entry.id === "golden-chroma")).toBe(false);
    expect(flux.some((entry) => entry.id === "flux2-turbo")).toBe(false);
    expect(face.some((entry) => entry.id === "faceid-sd15")).toBe(false);
  });

  test("recognizes the expanded local Krea 2 library and known trigger tokens", () => {
    const local = [
      "Krea2\\KREA2_CUMSHOT_v1.safetensors",
      "Krea2\\krea_feet_lora_v3.safetensors",
      "Krea2\\RLY-thot_shot-KREA2-briana-v1-trigger-rlybriana.safetensors",
      "Krea2\\Private_Magazine_1990s_v1.safetensors",
      "Krea2\\Private_Magazine_1970s_v1.safetensors",
      "Krea2\\krea2_gotd_yummy_anus.safetensors",
      "Krea2\\krea2_gotd_yummy_anus (1).safetensors",
    ];
    const compatible = compatibleInstalledLoras(
      { name: "Krea 2 Turbo", prompt_style: "krea2" },
      local
    );
    expect(compatible.some((entry) => entry.label === "Cumshot · Krea 2")).toBe(true);
    expect(compatible.some((entry) => entry.label === "Feet Detail V3 · Krea 2")).toBe(true);
    expect(compatible.find((entry) => entry.label === "RLY Briana · Krea 2")?.triggerWords).toContain("rlybriana");
    expect(compatible.find((entry) => entry.label === "Private Magazine · 1990s")?.triggerWords).toEqual(["90s magazine photography"]);
    expect(compatible.find((entry) => entry.label === "Private Magazine · 1970s")?.triggerWords).toEqual([]);
    expect(compatible.filter((entry) => entry.label.includes("Yummy Anus"))).toHaveLength(1);
  });

  test("includes SDXL-folder LoRAs for Pony but not for unrelated families", () => {
    const local = ["SDXL\\detail-slider.safetensors", "Flux\\flux-style.safetensors"];
    const pony = compatibleInstalledLoras({ name: "Pony V6 XL", prompt_style: "pony" }, local);
    expect(pony.some((entry) => entry.installedName.includes("detail-slider"))).toBe(true);
    expect(pony.some((entry) => entry.installedName.includes("flux-style"))).toBe(false);
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
    expect(health.warnings.some((warning) => warning.includes("optional LoRAs"))).toBe(true);
  });
});
