import { getRenderRecipe, recipeFamily, recipeSummary } from "./renderRecipes";

describe("model-aware render recipes", () => {
  test("uses the Juggernaut XL portrait baseline and scales by tier", () => {
    const draft = getRenderRecipe("sdxl", "draft");
    const balanced = getRenderRecipe("sdxl", "balanced");
    const quality = getRenderRecipe("sdxl", "quality");
    expect([balanced.width, balanced.height, balanced.steps, balanced.cfg, balanced.sampler]).toEqual([832, 1216, 35, 5, "dpmpp_2m"]);
    expect(draft.width * draft.height).toBeLessThan(balanced.width * balanced.height);
    expect(quality.width * quality.height).toBeGreaterThan(balanced.width * balanced.height);
  });
  test("uses conservative Z-Image Turbo settings", () => {
    const draft = getRenderRecipe("zimage", "draft");
    const quality = getRenderRecipe("zimage", "quality");
    expect(draft.steps).toBeLessThan(quality.steps);
    expect(draft.cfg).toBe(1);
    expect(quality.width * quality.height).toBeGreaterThan(draft.width * draft.height);
  });

  test("keeps model families separate", () => {
    expect(recipeFamily("chroma")).toBe("image");
    expect(recipeFamily("krea2")).toBe("image");
    expect(recipeFamily("qwen_edit")).toBe("edit");
    expect(recipeFamily("wan_i2v")).toBe("video");
    expect(recipeFamily("wan_t2v")).toBe("video");
  });

  test("increases WAN duration and size by tier", () => {
    const draft = getRenderRecipe("wan_i2v", "draft");
    const balanced = getRenderRecipe("wan_i2v", "balanced");
    const quality = getRenderRecipe("wan_i2v", "quality");
    expect([draft.videoFrames, balanced.videoFrames, quality.videoFrames]).toEqual([41, 81, 121]);
    expect(quality.videoWidth).toBeGreaterThan(draft.videoWidth);
  });

  test("uses repair strength instead of sampler settings for Qwen repair", () => {
    const recipe = getRenderRecipe("qwen_edit", "balanced");
    expect(recipe.repairStrength).toBe(0.45);
    expect(recipe.steps).toBeUndefined();
    expect(recipeSummary(recipe)).toContain("45%");
  });

  test("keeps Krea 2 Turbo on its 8-step distilled recipe", () => {
    const draft = getRenderRecipe("krea2", "draft");
    const balanced = getRenderRecipe("krea2", "balanced");
    const quality = getRenderRecipe("krea2", "quality");
    expect([draft.steps, balanced.steps, quality.steps]).toEqual([8, 8, 8]);
    expect(balanced.cfg).toBe(1);
    expect(balanced.sampler).toBe("euler");
    expect(quality.height).toBeGreaterThan(balanced.height);
  });

  test("falls back to standard image settings", () => {
    const recipe = getRenderRecipe("unknown-model", "balanced");
    expect(recipe.family).toBe("image");
    expect(recipe.width).toBeGreaterThan(0);
    expect(recipe.steps).toBeGreaterThan(0);
  });
});
