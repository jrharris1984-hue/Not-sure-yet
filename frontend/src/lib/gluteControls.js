// Visual prompt controls, not anatomical measurements. Zero keeps the preset.
export const GLUTE_SIZE_MAX = 200;
const SIZE_LEVELS = [
  "small", "moderate", "full rounded", "large rounded with noticeable rear projection",
  "very large rounded with prominent rear projection", "oversized with substantial rear projection",
  "very oversized with pronounced rear projection", "extremely oversized with strong rear projection",
  "fantasy-scale oversized with dramatic rear and lateral projection", "fantasy-scale extremely oversized",
];

export function gluteSizePrompt(value, { intensity = false } = {}) {
  const n = Math.max(0, Math.min(GLUTE_SIZE_MAX, Math.round(Number(value) || 0)));
  if (!n) return "";
  const descriptor = n <= 100 ? SIZE_LEVELS[Math.max(0, Math.ceil(n / 10) - 1)]
    : n <= 125 ? "hyper-voluminous fantasy-scale with an exaggerated outward silhouette"
    : n <= 150 ? "massively enlarged fantasy-scale with deep rearward projection and broad lateral volume"
    : n <= 175 ? "monumentally oversized fantasy-scale with a dominant rearward silhouette"
    : "maximum hyper-scale fantasy volume with exceptionally deep rearward projection and immense lateral volume";
  return `${descriptor} glute volume${intensity ? ` (size intensity ${n}/100${n > 100 ? "; extended range" : ""})` : ""}`;
}

const SHAPES = {
  "natural rounded": "smooth rounded glute contour with a soft lower curve and natural transition into the thighs",
  "athletic lifted": "firm lifted glute contour, elevated rounded upper curve and defined lower crease",
  "soft pear-shaped": "pear-shaped glutes with fuller lower outer curves and a narrower upper contour",
  "heart-shaped": "heart-shaped glute silhouette, rounded upper outer curves tapering inward toward the lower crease",
  "BBL-style fuller glutes": "BBL-style glute contour with rounded upper and outer fullness and pronounced rearward projection",
  "high round projection": "high-set round glute contour with spherical fullness and strong rearward projection",
  "pronounced upper shelf": "distinct upper glute shelf projecting rearward above the rounded lower curve",
  "dramatic side projection": "glute contour with prominently projecting outer side curves and broad lateral fullness",
  "fantasy oversized glutes": "exaggerated spherical glute contour with prominent upper fullness and a deep rounded rear profile",
  "extreme round projection": "extremely spherical glute contour with a strongly projecting rounded rear profile",
};

export function gluteShapePrompt(value) {
  return SHAPES[value] || String(value || "");
}
