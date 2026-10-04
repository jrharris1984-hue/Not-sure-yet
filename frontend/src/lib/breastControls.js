export const BREAST_SIZE_MAX = 300;

const SIZE_LEVELS = [
  "flat",
  "minimal",
  "small",
  "modest",
  "medium",
  "full",
  "large",
  "very large",
  "heavy",
  "oversized",
  "extremely oversized",
  "fantasy-scale massive",
];

const EXTREME_SIZE_DESCRIPTORS = {
  125: "(hyper-voluminous fantasy-scale bust:1.3), exaggerated forward projection, substantial mass",
  150: "(massively enlarged fantasy-scale breasts:1.4), deep forward projection, broad lateral spread, exaggerated proportions",
  175: "(monumentally oversized fantasy-scale bust:1.5), dominant forward silhouette, extreme projection, hyper-aesthetic",
  200: "(maximum hyper-scale fantasy breasts:1.6), exceptionally deep forward projection, immense lateral volume, dramatically oversized",
  250: "(ultra-maximum fantasy bust:1.7), hyper-extreme projection, colossal spread, surreal proportions",
  300: "(absolute maximum fantasy breasts:1.8), impossible hyper-projection, extreme dominance, maximum aesthetic",
};

const SHAPES = {
  flat: "minimal breast tissue, flat chest, androgynous silhouette",
  "small pert": "small compact breasts, firm youthful shape, minimal projection",
  "modest natural": "modest natural breast size, soft tissue, gentle slope",
  "average natural": "average natural fullness, moderate projection, balanced proportions",
  "full natural": "generous natural fullness, soft organic weight, wide-set",
  "heavy natural": "substantial natural weight, prominent projection, soft tissue",
  round: "perfectly round breast silhouette, spherical fullness, even distribution",
  teardrop: "teardrop breast shape, fuller lower curve, gentle upper slope",
  pendulous: "pendulous breast shape, elongated fullness, natural hang",
  "wide-set": "wide-set breast placement, lateral fullness, spaced apart",
  "close-set": "close-set cleavage, central fullness, prominent cleavage line",
  asymmetric: "natural asymmetry, one breast larger, organic variation",
  "subtle implants": "subtle implant enhancement, modest upper fill, natural-looking result",
  "moderate implants": "noticeable implant roundness, defined upper curve, enhanced projection",
  "high profile implants": "high profile implant silhouette, prominent forward projection, round upper fullness",
  "extreme implants": "dramatic implant enhancement, massively round, artificial spherical shape",
  "hyper implants": "hyper-maximum implant size, unnaturally round spheres, extreme projection",
  "balloon breasts": "exaggerated balloon-like roundness, perfectly spherical, extreme projection",
  torpedo: "elongated forward projection, torpedo shape, extreme length",
  "shelf breasts": "horizontal upper shelf, abrupt upper curve, shelf-like projection",
  "side-set fantasy": "extreme lateral placement, breasts pointing outward, wide separation",
  "hyper-fantasy": "impossibly voluminous breast mass, surreal proportions, gravity-defying",
  "firm youthful": "firm youthful tissue, minimal sag, tight skin, perky appearance",
  "soft natural": "soft natural tissue, gentle sag, realistic weight, organic feel",
  veiny: "visible veins, translucent skin, vascular detail, realistic texture",
  "stretch-marked": "growth stretch marks, rapid expansion texture, authentic detail",
  "augmented smooth": "smooth implant surface, taut skin, surgical precision",
  "natural texture": "natural skin texture, pores, subtle imperfections, realistic",
};

const TEXTURE_MODIFIERS = {
  smooth: "smooth skin, taut surface",
  soft: "soft tissue, natural give",
  firm: "firm tone, athletic density",
  jiggly: "soft jiggly physics, natural movement",
  veiny: "visible veins, vascular",
  "stretch marks": "growth marks, expansion texture",
};

export function breastSizePrompt(value, { intensity = false, texture = null } = {}) {
  const n = Math.max(0, Math.min(BREAST_SIZE_MAX, Math.round(Number(value) || 0)));
  if (!n) return "";

  let descriptor;
  if (n <= 100) {
    descriptor = SIZE_LEVELS[Math.max(0, Math.ceil(n / 10) - 1)];
  } else {
    const threshold = Object.keys(EXTREME_SIZE_DESCRIPTORS)
      .map(Number)
      .sort((a, b) => a - b)
      .find((t) => n <= t) || 300;
    descriptor = EXTREME_SIZE_DESCRIPTORS[threshold];
  }

  const textureMod = texture && TEXTURE_MODIFIERS[texture] ? `, ${TEXTURE_MODIFIERS[texture]}` : "";
  return `${descriptor} breast volume${textureMod}${intensity ? ` (size intensity ${Math.min(n, 100)}/100${n > 100 ? `; extended to ${n}` : ""})` : ""}`;
}

export function breastShapePrompt(value, { size = 50, texture = null } = {}) {
  const baseShape = SHAPES[value] || String(value || "");
  const sizeContext = size > 100 ? `, ${EXTREME_SIZE_DESCRIPTORS[Math.min(300, Math.ceil(size / 25) * 25)] || ""}` : "";
  const textureMod = texture && TEXTURE_MODIFIERS[texture] ? `, ${TEXTURE_MODIFIERS[texture]}` : "";
  return `${baseShape}${sizeContext}${textureMod}`;
}

export const BREAST_SHAPES = Object.keys(SHAPES);
export const BREAST_TEXTURES = Object.keys(TEXTURE_MODIFIERS);
