const text = (value) => String(value || "").toLowerCase();

const filledValues = (value) => {
  if (Array.isArray(value)) return value.reduce((total, item) => total + filledValues(item), 0);
  if (value && typeof value === "object") return Object.values(value).reduce((total, item) => total + filledValues(item), 0);
  if (typeof value === "number") return value > 0 ? 1 : 0;
  return value && !["none", "default", "off"].includes(text(value)) ? 1 : 0;
};

export function analyzeGenerationIntent(dna = {}, subjectCount = 1, hasReference = false) {
  const explicit = Number(dna?.scenario?.explicit_level || 0) > 0
    || Number(dna?.scenario?.kink_level || 0) > 0;
  const feetFocus = filledValues(dna?.feet || {}) > 0 || text(dna?.pose?.focus) === "feet";
  const poseComplex = ["kneeling", "squatting", "bending", "lying legs up", "on back legs up"].includes(text(dna?.pose?.action))
    || ["pov", "over-shoulder", "back"].includes(text(dna?.pose?.angle));
  const identityHeavy = (
    filledValues(dna?.identity || {})
    + filledValues(dna?.face || {})
    + filledValues(dna?.hair || {})
  ) >= 8;
  const detailCount = filledValues(dna);
  return {
    explicit,
    feetFocus,
    poseComplex,
    identityHeavy,
    detailHeavy: detailCount >= 28,
    detailCount,
    multiSubject: subjectCount > 1,
    hasReference,
  };
}

export function inferGenerationTarget(workflow = {}) {
  if (workflow.kind === "edit" || workflow.kind === "enhance") return "edit";
  if (workflow.kind === "video") return "animate";
  if (workflow.kind === "text_video") return "text_video";
  if (workflow.kind === "face") return "face";
  return "still";
}

function workflowScore(workflow, target, dna, subjectCount, hasReference) {
  const haystack = text(`${workflow.name} ${workflow.prompt_style} ${workflow.kind}`);
  const intent = analyzeGenerationIntent(dna, subjectCount, hasReference);
  let score = 0;

  if (target === "edit") score += ["edit", "enhance"].includes(workflow.kind) ? 100 : 0;
  if (target === "animate") score += workflow.kind === "video" ? 100 : 0;
  if (target === "text_video") score += workflow.kind === "text_video" ? 100 : 0;
  if (target === "face") score += workflow.kind === "face" ? 100 : 0;

  if (target === "still") {
    const stillKind = ["image", "generate", "text_image"].includes(workflow.kind)
      || !["edit", "enhance", "video", "text_video", "face"].includes(workflow.kind);
    if (stillKind) score += 30;

    if (/z[- ]?image|zimage/.test(haystack)) {
      if (intent.explicit) score += 35;
      if (intent.feetFocus) score += 35;
      if (intent.poseComplex) score += 20;
      if (intent.detailHeavy) score += 15;
      if (intent.multiSubject) score += 10;
    }

    if (/chroma/.test(haystack)) {
      if (!intent.explicit) score += 25;
      if (!intent.feetFocus) score += 15;
      if (intent.identityHeavy) score += 15;
      if (!intent.poseComplex) score += 10;
      if (intent.multiSubject) score += 5;
    }

    if (/pony/.test(haystack)) {
      if (intent.explicit) score += 10;
      if (intent.detailHeavy) score += 10;
    }
  }

  return score;
}

export function recommendSmartSetup({ workflows = [], target = "still", dna = {}, subjectCount = 1, hasReference = false } = {}) {
  const intent = analyzeGenerationIntent(dna, subjectCount, hasReference);
  const ranked = workflows
    .map((workflow) => ({
      workflow,
      score: workflowScore(workflow, target, dna, subjectCount, hasReference),
    }))
    .sort((a, b) => b.score - a.score);
  const selected = ranked[0]?.score > 0 ? ranked[0].workflow : workflows[0];
  const complexity = intent.detailCount + Math.max(0, subjectCount - 1) * 15;
  const qualityTier = target === "still"
    ? (complexity > 35 || subjectCount > 1 ? "quality" : complexity > 18 ? "balanced" : "draft")
    : "balanced";
  const warnings = [];
  const reasons = [];

  if (["edit", "animate", "face"].includes(target) && !hasReference) {
    warnings.push("This target needs a source image.");
  }
  if (!selected) warnings.push("No compatible workflow is currently configured.");

  const selectedName = text(selected?.name || "");
  if (target === "still" && selected) {
    if (/z[- ]?image|zimage/.test(selectedName)) {
      if (intent.poseComplex) reasons.push("Complex pose favors Z-Image's guarded composition path.");
      if (intent.feetFocus) reasons.push("Feet-focused detail favors the Z-Image prompt guard.");
      if (intent.detailHeavy) reasons.push("High-detail character setup favors the Z-Image still workflow.");
      if (!reasons.length) reasons.push("Z-Image is the strongest match for this still-image request.");
    } else if (/chroma/.test(selectedName)) {
      reasons.push(intent.identityHeavy
        ? "Chroma is a strong fit for a detailed portrait-style identity."
        : "Chroma is a strong fit for a cleaner portrait-style still.");
    } else if (/pony/.test(selectedName)) {
      reasons.push("Pony is available as the specialty still-image route.");
    }
  }

  if (target === "still" && hasReference) {
    reasons.push("A reference image is available; use Edit image when you want to preserve an existing result instead of regenerating it.");
  }

  return {
    target,
    workflowId: selected?.id || "",
    workflowName: selected?.name || "No workflow",
    qualityTier,
    loraMode: target === "still" ? "automatic" : "assisted",
    anatomyReview: target === "still",
    warnings,
    reasons,
    intent,
  };
}
