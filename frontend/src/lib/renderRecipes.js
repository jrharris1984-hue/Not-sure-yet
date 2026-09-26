const IMAGE_RECIPES = {
  zimage: {
    draft: { width: 768, height: 1024, steps: 6, cfg: 1.0, batchSize: 1, sampler: "res_multistep", note: "Fast composition test" },
    balanced: { width: 1024, height: 1024, steps: 8, cfg: 1.0, batchSize: 1, sampler: "res_multistep", note: "Recommended Z-Image render" },
    quality: { width: 1024, height: 1536, steps: 12, cfg: 1.0, batchSize: 1, sampler: "res_multistep", note: "More detail and larger output" },
  },
  chroma: {
    draft: { width: 768, height: 768, steps: 18, cfg: 3.4, batchSize: 1, sampler: "euler", note: "Quick Golden Chroma preview" },
    balanced: { width: 768, height: 1152, steps: 26, cfg: 3.8, batchSize: 1, sampler: "euler", note: "Recommended Golden Chroma render" },
    quality: { width: 1024, height: 1536, steps: 34, cfg: 4.0, batchSize: 1, sampler: "euler", note: "Higher-detail portrait" },
  },
  pony: {
    draft: { width: 768, height: 1024, steps: 18, cfg: 6.5, batchSize: 1, sampler: "euler_ancestral", note: "Fast Pony composition test" },
    balanced: { width: 832, height: 1216, steps: 25, cfg: 7.0, batchSize: 1, sampler: "euler_ancestral", note: "Recommended Pony render" },
    quality: { width: 1024, height: 1536, steps: 32, cfg: 7.0, batchSize: 1, sampler: "euler_ancestral", note: "Higher-detail Pony render" },
  },
  standard: {
    draft: { width: 768, height: 1024, steps: 18, cfg: 4.0, batchSize: 1, sampler: "euler", note: "Quick preview" },
    balanced: { width: 1024, height: 1024, steps: 26, cfg: 4.5, batchSize: 1, sampler: "dpmpp_2m", note: "Balanced quality and speed" },
    quality: { width: 1024, height: 1536, steps: 36, cfg: 5.0, batchSize: 1, sampler: "dpmpp_2m_sde", note: "Larger detailed output" },
  },
};

const VIDEO_RECIPES = {
  wan_i2v: {
    draft: { videoFrames: 41, videoFps: 24, videoWidth: 512, videoHeight: 512, note: "About 1.7 seconds · fastest test" },
    balanced: { videoFrames: 81, videoFps: 24, videoWidth: 640, videoHeight: 640, note: "About 3.4 seconds · recommended" },
    quality: { videoFrames: 121, videoFps: 24, videoWidth: 768, videoHeight: 768, note: "About 5 seconds · heavier render" },
  },
  wan_t2v: {
    draft: { videoFrames: 41, videoFps: 24, videoWidth: 512, videoHeight: 512, note: "About 1.7 seconds · fastest test" },
    balanced: { videoFrames: 81, videoFps: 24, videoWidth: 640, videoHeight: 640, note: "About 3.4 seconds · recommended" },
    quality: { videoFrames: 121, videoFps: 24, videoWidth: 768, videoHeight: 768, note: "About 5 seconds · heavier render" },
  },
};

const EDIT_RECIPES = {
  qwen_edit: {
    draft: { repairStrength: 0.30, note: "Subtle correction that stays close to the source" },
    balanced: { repairStrength: 0.45, note: "Recommended edit strength" },
    quality: { repairStrength: 0.60, note: "Stronger reconstruction for difficult defects" },
  },
};

export const QUALITY_TIERS = [
  { id: "draft", label: "Draft", description: "Fast test" },
  { id: "balanced", label: "Balanced", description: "Recommended" },
  { id: "quality", label: "Quality", description: "Best detail" },
];

export function recipeFamily(compiler = "standard") {
  if (VIDEO_RECIPES[compiler]) return "video";
  if (EDIT_RECIPES[compiler]) return "edit";
  return "image";
}

export function getRenderRecipe(compiler = "standard", tier = "balanced") {
  const collection = VIDEO_RECIPES[compiler] || EDIT_RECIPES[compiler] || IMAGE_RECIPES[compiler] || IMAGE_RECIPES.standard;
  return { tier, compiler, family: recipeFamily(compiler), ...(collection[tier] || collection.balanced) };
}

export function recipeSummary(recipe = {}) {
  if (recipe.family === "video") return `${recipe.videoWidth}×${recipe.videoHeight} · ${recipe.videoFrames} frames · ${recipe.videoFps} fps`;
  if (recipe.family === "edit") return `Edit strength ${Math.round((recipe.repairStrength || 0) * 100)}%`;
  return `${recipe.width}×${recipe.height} · ${recipe.steps} steps · CFG ${recipe.cfg}`;
}
