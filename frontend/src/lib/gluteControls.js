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
  "natural rounded": "smooth continuous rounded glute silhouette, evenly distributed fullness, soft lower curve, gradual upper slope",
  "athletic lifted": "distinctly lifted athletic glute silhouette, high compact fullness, taut elevated lower crease, firm upper contour",
  "soft pear-shaped": "distinct pear-shaped glute silhouette, narrow upper contour expanding into broad heavy lower outer fullness",
  "heart-shaped": "distinct inverted-heart glute silhouette, broad rounded upper outer lobes tapering toward a narrower lower curve",
  "BBL-style fuller glutes": "pronounced BBL-style glute contour, filled upper and outer curves, deep rearward projection, sharply defined waist-to-glute transition",
  "high round projection": "high-set spherical glute silhouette, fullest point above the midline, strongly projecting rounded profile",
  "pronounced upper shelf": "distinct horizontal upper glute shelf, abrupt rearward step at the top above a curved lower profile",
  "dramatic side projection": "dramatic lateral glute silhouette, outer curves extending strongly sideways, widest fullness at the outer midline",
  "fantasy oversized glutes": "exaggerated bulbous glute silhouette, massive curved upper fullness, deep lower curve, conspicuously sculpted rounded profile",
  "extreme round projection": "extremely spherical glute silhouette, ball-like contour with extreme rear and lateral projection and a steep rounded outer profile",
};

export function gluteShapePrompt(value) {
  return SHAPES[value] || String(value || "");
}
