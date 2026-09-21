const PLACEHOLDER_SEGMENTS = new Set(["none", "average", "default", "n/a", "undefined", "null"]);

const PROFILE_LIMITS = {
  chroma: { label: "Golden Chroma", warningTokens: 480, hardTokens: 512 },
  pony: { label: "Pony / CLIP", warningTokens: 180, hardTokens: 225 },
  z_image: { label: "Z-Image Turbo", warningTokens: 300, hardTokens: 420 },
  flux: { label: "Flux", warningTokens: 420, hardTokens: 512 },
  default: { label: "Selected model", warningTokens: 360, hardTokens: 512 },
};

export function estimatePromptTokens(text = "") {
  return Math.round(String(text).split(/[\s,]+/).filter(Boolean).length * 1.35);
}

export function promptProfile(workflow = {}) {
  const haystack = `${workflow?.prompt_style || ""} ${workflow?.name || ""}`.toLowerCase();
  if (haystack.includes("chroma")) return "chroma";
  if (haystack.includes("pony")) return "pony";
  if (haystack.includes("z-image") || haystack.includes("z image") || haystack.includes("z_image")) return "z_image";
  if (haystack.includes("flux")) return "flux";
  return "default";
}

function normalizedSegment(segment) {
  return String(segment || "")
    .toLowerCase()
    .replace(/[()[\]{}:._-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function optimizePromptText(text = "") {
  const seen = new Set();
  return String(text)
    .split(",")
    .map((segment) => segment.trim())
    .filter(Boolean)
    .filter((segment) => {
      const key = normalizedSegment(segment);
      if (!key || PLACEHOLDER_SEGMENTS.has(key) || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .join(", ");
}

function hasAny(text, values) {
  return values.some((value) => new RegExp(`\\b${value}\\b`, "i").test(text));
}

export function analyzePromptQuality({ positive = "", dna = {}, workflow = {} } = {}) {
  const profile = promptProfile(workflow);
  const limits = PROFILE_LIMITS[profile];
  const tokens = estimatePromptTokens(positive);
  const cleaned = optimizePromptText(positive);
  const segments = String(positive).split(",").map(normalizedSegment).filter(Boolean);
  const duplicateCount = segments.length - new Set(segments).size;
  const issues = [];

  if (tokens > limits.hardTokens) {
    issues.push({ severity: "error", code: "length", message: `${limits.label} may truncate this ~${tokens}-token prompt. Move essential identity, body, and pose details earlier.` });
  } else if (tokens > limits.warningTokens) {
    issues.push({ severity: "warning", code: "length", message: `This ~${tokens}-token prompt is long for ${limits.label}; later details may receive less attention.` });
  }
  if (duplicateCount > 0) {
    issues.push({ severity: "warning", code: "duplicates", fixable: true, message: `${duplicateCount} repeated prompt clause${duplicateCount === 1 ? "" : "s"} dilute other details.` });
  }
  if (cleaned !== String(positive).trim() && duplicateCount === 0) {
    issues.push({ severity: "info", code: "placeholders", fixable: true, message: "Empty/default filler can be removed safely." });
  }

  const skinTone = String(dna?.skin?.tone || "").toLowerCase();
  const lightSkin = ["fair", "pale", "porcelain", "ivory"];
  const darkSkin = ["tan", "brown", "dark", "ebony", "deep"];
  if ((lightSkin.includes(skinTone) && hasAny(positive, darkSkin)) || (darkSkin.some((t) => skinTone.includes(t)) && hasAny(positive, lightSkin))) {
    issues.push({ severity: "error", code: "skin-conflict", message: `The compiled prompt may conflict with the selected “${dna?.skin?.tone}” skin tone. Review Heritage and Skin before rendering.` });
  }

  if (!dna?.pose?.action) issues.push({ severity: "warning", code: "pose", message: "No main body position is selected, so pose consistency will be left to the model." });
  if (!dna?.scene?.environment) issues.push({ severity: "info", code: "scene", message: "No environment is selected; the model will invent the setting." });
  if (!dna?.lighting?.source && !dna?.lighting?.style) issues.push({ severity: "info", code: "lighting", message: "No lighting setup is selected; realism may vary between seeds." });

  const errors = issues.filter((issue) => issue.severity === "error").length;
  const warnings = issues.filter((issue) => issue.severity === "warning").length;
  const score = Math.max(0, 100 - (errors * 25) - (warnings * 10));
  return { profile, profileLabel: limits.label, tokens, score, issues, cleaned, canAutoFix: issues.some((issue) => issue.fixable) };
}
