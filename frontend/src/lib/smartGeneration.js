const text = (value) => String(value || "").toLowerCase();

const filledValues = (value) => {
  if (Array.isArray(value)) return value.reduce((total, item) => total + filledValues(item), 0);
  if (value && typeof value === "object") return Object.values(value).reduce((total, item) => total + filledValues(item), 0);
  if (typeof value === "number") return value > 0 ? 1 : 0;
  return value && !["none", "default", "off"].includes(text(value)) ? 1 : 0;
};

export function inferGenerationTarget(workflow = {}) {
  if (workflow.kind === "edit" || workflow.kind === "enhance") return "edit";
  if (workflow.kind === "video") return "animate";
  if (workflow.kind === "text_video") return "text_video";
  if (workflow.kind === "face") return "face";
  return "still";
}

function workflowScore(workflow, target, dna) {
  const haystack = text(`${workflow.name} ${workflow.prompt_style} ${workflow.kind}`);
  const explicit = Number(dna?.scenario?.explicit_level || 0) > 0 || Number(dna?.scenario?.kink_level || 0) > 0;
  const feet = filledValues(dna?.feet || {}) > 0;
  let score = 0;
  if (target === "edit") score += ["edit", "enhance"].includes(workflow.kind) ? 100 : 0;
  if (target === "animate") score += workflow.kind === "video" ? 100 : 0;
  if (target === "text_video") score += workflow.kind === "text_video" ? 100 : 0;
  if (target === "face") score += workflow.kind === "face" ? 100 : 0;
  if (target === "still") {
    score += ["image", "generate", "text_image"].includes(workflow.kind) || !["edit", "enhance", "video", "text_video", "face"].includes(workflow.kind) ? 30 : 0;
    if ((explicit || feet) && /z[- ]?image|zimage/.test(haystack)) score += 60;
    else if (!explicit && /chroma/.test(haystack)) score += 45;
    if (/pony/.test(haystack)) score += explicit ? 20 : 5;
  }
  return score;
}

export function recommendSmartSetup({ workflows = [], target = "still", dna = {}, subjectCount = 1, hasReference = false } = {}) {
  const ranked = workflows
    .map((workflow) => ({ workflow, score: workflowScore(workflow, target, dna) }))
    .sort((a, b) => b.score - a.score);
  const selected = ranked[0]?.score > 0 ? ranked[0].workflow : workflows[0];
  const complexity = filledValues(dna) + Math.max(0, subjectCount - 1) * 15;
  const qualityTier = target === "still" && (complexity > 35 || subjectCount > 1) ? "quality" : "balanced";
  const warnings = [];
  if (["edit", "animate", "face"].includes(target) && !hasReference) warnings.push("This target needs a source image.");
  if (!selected) warnings.push("No compatible workflow is currently configured.");
  return {
    target,
    workflowId: selected?.id || "",
    workflowName: selected?.name || "No workflow",
    qualityTier,
    loraMode: target === "still" ? "automatic" : "assisted",
    anatomyReview: target === "still",
    warnings,
  };
}
