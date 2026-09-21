const PLACEHOLDER_SEGMENTS = new Set(["none", "average", "default", "n/a", "undefined", "null"]);

const PROFILE_LIMITS = {
  chroma: { label: "Golden Chroma", warningTokens: 480, hardTokens: 512 },
  pony: { label: "Pony / CLIP", warningTokens: 180, hardTokens: 225 },
  zimage: { label: "Z-Image Turbo", warningTokens: 300, hardTokens: 420 },
  qwen_edit: { label: "Qwen Image Edit", warningTokens: 170, hardTokens: 260 },
  wan_i2v: { label: "WAN Image → Video", warningTokens: 120, hardTokens: 190 },
  wan_t2v: { label: "WAN Text → Video", warningTokens: 360, hardTokens: 480 },
  flux: { label: "Flux", warningTokens: 420, hardTokens: 512 },
  default: { label: "Selected model", warningTokens: 360, hardTokens: 512 },
};

export function estimatePromptTokens(text = "") {
  return Math.round(String(text).split(/[\s,]+/).filter(Boolean).length * 1.35);
}

export function promptProfile(workflow = {}) {
  const style = String(workflow?.prompt_style || "").toLowerCase();
  const kind = String(workflow?.kind || "").toLowerCase();
  const name = String(workflow?.name || "").toLowerCase();
  const haystack = `${style} ${name}`;
  if (kind === "edit" || kind === "enhance" || style === "qwen_edit" || haystack.includes("qwen")) return "qwen_edit";
  if (kind === "video" || style === "wan_i2v") return "wan_i2v";
  if (kind === "text_video" || style === "wan_t2v") return "wan_t2v";
  if (haystack.includes("chroma")) return "chroma";
  if (haystack.includes("pony")) return "pony";
  if (haystack.includes("z-image") || haystack.includes("z image") || haystack.includes("z_image") || style === "zimage") return "zimage";
  if (haystack.includes("flux")) return "flux";
  return "default";
}

function normalizedSegment(segment) {
  return String(segment || "").toLowerCase().replace(/[()[\]{}:._-]/g, " ").replace(/\s+/g, " ").trim();
}

export function optimizePromptText(text = "") {
  const seen = new Set();
  return String(text).split(",").map((segment) => segment.trim()).filter(Boolean).filter((segment) => {
    const key = normalizedSegment(segment);
    if (!key || PLACEHOLDER_SEGMENTS.has(key) || seen.has(key)) return false;
    seen.add(key);
    return true;
  }).join(", ");
}

function hasAny(text, values) {
  return values.some((value) => new RegExp(`\\b${value}\\b`, "i").test(text));
}

const issue = (severity, code, message, extra = {}) => ({ severity, code, message, ...extra });

export function analyzePromptQuality({
  positive = "",
  dna = {},
  workflow = {},
  context = {},
} = {}) {
  const profile = promptProfile(workflow);
  const limits = PROFILE_LIMITS[profile];
  const tokens = estimatePromptTokens(positive);
  const cleaned = optimizePromptText(positive);
  const segments = String(positive).split(",").map(normalizedSegment).filter(Boolean);
  const duplicateCount = segments.length - new Set(segments).size;
  const issues = [];

  if (!String(positive).trim()) {
    issues.push(issue("error", "empty-prompt", "The selected workflow does not have a prompt or instruction yet.", { blocking: true }));
  }
  if (tokens > limits.hardTokens) {
    issues.push(issue("error", "length", `${limits.label} may truncate this ~${tokens}-token prompt. Move essential identity, body, and pose details earlier.`));
  } else if (tokens > limits.warningTokens) {
    issues.push(issue("warning", "length", `This ~${tokens}-token prompt is long for ${limits.label}; later details may receive less attention.`));
  }
  if (duplicateCount > 0) {
    issues.push(issue("warning", "duplicates", `${duplicateCount} repeated prompt clause${duplicateCount === 1 ? "" : "s"} dilute other details.`, { fixable: true }));
  }
  if (cleaned !== String(positive).trim() && duplicateCount === 0) {
    issues.push(issue("info", "placeholders", "Empty/default filler can be removed safely.", { fixable: true }));
  }

  if (["qwen_edit", "wan_i2v"].includes(profile) && !context.hasReferenceImage) {
    issues.push(issue("error", "source-image", `${limits.label} requires an uploaded source image.`, { blocking: true }));
  }
  if (profile === "qwen_edit" && !String(context.editInstruction || "").trim()) {
    issues.push(issue("error", "edit-instruction", "Describe the exact image change before rendering.", { blocking: true }));
  }
  if (["wan_i2v", "wan_t2v"].includes(profile) && !String(context.videoInstruction || "").trim()) {
    issues.push(issue("error", "motion-instruction", "Describe the movement or video action before rendering.", { blocking: true }));
  }

  const age = Number(dna?.identity?.age || 0);
  if (age > 0 && age < 21) {
    issues.push(issue("error", "adult-age", "The subject age must be 21 or older.", { blocking: true }));
  }

  const generatedImageProfile = ["default", "zimage", "chroma", "pony", "flux", "wan_t2v"].includes(profile);
  if (generatedImageProfile) {
    const skinTone = String(dna?.skin?.tone || "").toLowerCase();
    const lightSkin = ["fair", "pale", "porcelain", "ivory"];
    const darkSkin = ["tan", "brown", "dark", "ebony", "deep"];
    if ((lightSkin.includes(skinTone) && hasAny(positive, darkSkin)) || (darkSkin.some((t) => skinTone.includes(t)) && hasAny(positive, lightSkin))) {
      issues.push(issue("error", "skin-conflict", `The compiled prompt may conflict with the selected “${dna?.skin?.tone}” skin tone. Review Heritage and Skin before rendering.`));
    }

    if (!dna?.pose?.action) issues.push(issue("warning", "pose", "No main body position is selected, so pose consistency will be left to the model."));
    if (!dna?.scene?.environment) issues.push(issue("info", "scene", "No environment is selected; the model will invent the setting."));
    if (!dna?.lighting?.source && !dna?.lighting?.style) issues.push(issue("info", "lighting", "No lighting setup is selected; realism may vary between seeds."));

    const outfit = String(dna?.wardrobe?.outfit_preset || "").toLowerCase();
    const garmentFields = ["top", "bottom", "underwear"].filter((key) => {
      const value = String(dna?.wardrobe?.[key] || "").toLowerCase();
      return value && value !== "none";
    });
    if (["nude", "topless", "bottomless"].includes(outfit) && garmentFields.length) {
      issues.push(issue("warning", "wardrobe-conflict", `The “${outfit}” preset conflicts with selected ${garmentFields.join(" and ")} clothing fields.`));
    }

    const feet = dna?.feet || {};
    const feetRequested = !!(feet.sole_presentation || feet.framing || (feet.foot_act || []).length);
    const focus = String(dna?.pose?.focus || "").toLowerCase();
    if (feetRequested && focus && !["feet", "legs", "full frame"].includes(focus)) {
      issues.push(issue("warning", "feet-focus", `Feet details are selected, but camera focus is set to “${dna.pose.focus}”.`));
    }

    const cast = String(dna?.scenario?.cast_size || "solo").toLowerCase();
    const expected = { solo: 1, duo: 2, threesome: 3, foursome: 4, group: 3, gangbang: 3, orgy: 4 }[cast] || 1;
    if (Number(context.subjectCount || 1) < expected) {
      issues.push(issue("warning", "cast-count", `The scenario requests ${cast}, but only ${context.subjectCount || 1} subject profile is configured.`));
    }
  }

  const errors = issues.filter((entry) => entry.severity === "error").length;
  const warnings = issues.filter((entry) => entry.severity === "warning").length;
  const blockers = issues.filter((entry) => entry.blocking);
  const score = Math.max(0, 100 - (errors * 25) - (warnings * 10));
  return {
    profile,
    profileLabel: limits.label,
    tokens,
    score,
    issues,
    blockers,
    ready: blockers.length === 0,
    cleaned,
    canAutoFix: issues.some((entry) => entry.fixable),
  };
}
