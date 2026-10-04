// Visual prompt controls, not anatomical measurements. Zero keeps the preset.
export const GLUTE_SIZE_MAX = 300;

const SIZE_LEVELS = [
  "small", // 1-10
  "moderate", // 11-20
  "full rounded", // 21-30
  "large rounded with noticeable rear projection", // 31-40
  "very large rounded with prominent rear projection", // 41-50
  "oversized with substantial rear projection", // 51-60
  "very oversized with pronounced rear projection", // 61-70
  "extremely oversized with strong rear projection", // 71-80
  "fantasy-scale oversized with dramatic rear and lateral projection", // 81-90
  "fantasy-scale extremely oversized", // 91-100
];

// Extended values change the silhouette gradually without weighted syntax.
// A single volume clause owns size; shape and texture remain independent.
const EXTREME_SIZE_DESCRIPTORS = {
  125: "fantasy-scale oversized with increased rear projection",
  150: "fantasy-scale very oversized with substantial rear projection",
  175: "fantasy-scale greatly oversized with pronounced rear projection",
  200: "fantasy-scale extremely oversized with broad rounded volume",
  250: "fantasy-scale exceptionally oversized with broad rounded volume and deep rear projection",
  300: "fantasy-scale maximum oversized with the broadest rounded volume and deepest rear projection",
};

// Comprehensive shape catalog covering all aesthetic types
const SHAPES = {
  // Natural/Genetic Types
  "small round": "compact rounded glute silhouette, petite symmetrical fullness, tight lower curve, subtle natural projection",
  "naturally round": "smooth continuous rounded glute silhouette, evenly distributed genetic fullness, soft organic lower curve, gradual upper slope, natural projection",
  "naturally full": "generous genetically full glute silhouette, abundant natural softness, wide-set fullness, organic rounded profile",
  "genetically large": "substantial genetic glute mass, naturally heavy fullness, broad inherited silhouette, soft organic weight",
  
  // Athletic/Fitness Types
  "athletic lifted": "distinctly lifted athletic glute silhouette, high compact fullness, taut elevated lower crease, firm upper contour, muscular definition",
  "athletic round": "muscular rounded glute silhouette, firm dense fullness, developed lower curve, strong projection, fitness model proportions",
  "bubble butt": "spherical bubble glute silhouette, compact high-set fullness, distinctly rounded profile, bouncy projection, tight skin",
  
  // Pear/Apple Body Types
  "soft pear-shaped": "distinct pear-shaped glute silhouette, narrow upper contour expanding into broad heavy lower outer fullness, wide hips",
  "dramatic pear": "extreme pear-shaped glute silhouette, very narrow waist expanding into massive lower outer fullness, heavy lateral weight",
  "apple bottom": "low-set apple-shaped glute silhouette, fullest point at lower curve, rounded undercurve, shelf-like lower projection",
  "heart-shaped": "distinct inverted-heart glute silhouette, broad rounded upper outer lobes tapering toward a narrower lower curve, dramatic upper fullness",
  
  // BBL Types (Surgical Enhancement Aesthetic)
  "subtle BBL": "refined BBL-style contour, modest upper curve enhancement, gentle rearward projection, natural-looking surgical result",
  "moderate BBL": "noticeable BBL-style contour, filled upper and outer curves, moderate rearward projection, defined waist-to-glute transition",
  "BBL-style fuller glutes": "pronounced BBL-style glute contour, filled upper and outer curves, deep rearward projection, sharply defined waist-to-glute transition",
  "extreme BBL": "dramatic BBL-style contour, massively filled upper quadrants, extreme rearward projection, artificially rounded profile, sharp transition",
  "hyper BBL": "hyper-maximum BBL aesthetic, unnaturally rounded upper fullness, extreme projection, perfectly symmetrical artificial spheres, dramatic silhouette",
  
  // Projection/Position Types
  "high round projection": "high-set spherical glute silhouette, fullest point above the midline, strongly projecting rounded profile, elevated mass",
  "pronounced upper shelf": "distinct horizontal upper glute shelf, abrupt rearward step at the top above a curved lower profile, stepped contour",
  "dramatic side projection": "dramatic lateral glute silhouette, outer curves extending strongly sideways, widest fullness at the outer midline, wide-set mass",
  "deep rear projection": "posterior-dominant glute silhouette, maximum depth from behind, minimal lateral spread, concentrated rearward mass",
  
  // Fantasy/Extreme Types
  "fantasy oversized glutes": "exaggerated bulbous glute silhouette, massive curved upper fullness, deep lower curve, conspicuously sculpted rounded profile, surreal proportions",
  "extreme round projection": "extremely spherical glute silhouette, ball-like contour with extreme rear and lateral projection, steep rounded outer profile, perfect spheres",
  "hyper-fantasy glutes": "impossibly voluminous glute mass, surreal proportions, extreme multi-directional projection, gravity-defying roundness, exaggerated aesthetic",
  
  // Texture/Detail Types
  "smooth toned": "smooth taut glute skin, firm muscular tone, defined shape without visible texture, polished appearance",
  "soft natural": "soft glute tissue, natural skin texture, gentle cellulite dimples, organic realistic appearance, jiggle physics",
  "cellulite heavy": "heavy soft glute mass, prominent cellulite texture, dimpled skin surface, substantial weight, realistic jiggle, organic imperfections",
  "stretch-marked": "large glute volume with silvery stretch marks, rapid growth texture, authentic skin detail, realistic expansion marks",
  
  // Combined Aesthetic Types
  "big and round natural": "substantial naturally rounded glute mass, heavy genetic fullness, soft organic projection, wide natural silhouette",
  "big and round BBL": "large artificially enhanced glutes, BBL-style perfect roundness, substantial filled volume, surgical aesthetic with size",
  "cellulite BBL": "BBL-enhanced contour with realistic cellulite texture, surgical roundness with organic skin detail, filled volume with dimpled surface",
  "extreme pear BBL": "combination pear shape with BBL enhancement, narrow waist, massive lower outer fullness, surgical upper fill, dramatic contrast",
};

// UI shape choices describe contour, independently of the volume slider.
const CONTOURS = {
  "natural rounded": "smooth continuous rounded glute silhouette, soft organic lower curve, gradual upper slope",
  "naturally round": "smooth continuous rounded glute silhouette, soft organic lower curve, gradual upper slope",
  "athletic lifted": "lifted athletic glute contour, elevated lower crease, firm upper contour, muscular definition",
  "soft pear-shaped": "pear-shaped glute contour, narrow upper contour expanding into broad heavy lower outer fullness",
  "heart-shaped": "inverted-heart glute contour, rounded upper outer curves tapering toward the lower curve",
  "BBL-style fuller glutes": "BBL-style glute contour, filled upper and outer curves, defined waist-to-glute transition",
  "high round projection": "high-set rounded glute contour, fullest point above the midline, elevated upper curve",
  "pronounced upper shelf": "distinct horizontal upper glute shelf, abrupt rearward step at the top above a curved lower profile, stepped contour",
  "dramatic side projection": "lateral glute contour, outer curves extending sideways, fullest point at the outer midline",
  "fantasy oversized glutes": "sculpted bulbous glute contour, curved upper fullness, deep lower curve",
  "extreme round projection": "spherical glute contour, steep rounded outer profile",
};

// Skin texture modifiers
const TEXTURE_MODIFIERS = {
  "smooth": "smooth skin, taut surface, no visible texture",
  "soft": "soft tissue, gentle give, natural softness",
  "firm": "firm muscular tone, tight skin, athletic density",
  "jiggly": "soft jiggly tissue, natural movement physics, bouncy mass",
  "cellulite light": "subtle cellulite dimples, light skin texture",
  "cellulite heavy": "prominent cellulite, dimpled skin texture, heavy soft tissue",
  "stretch marks": "visible stretch marks, growth texture, authentic skin detail",
};

export function gluteSizePrompt(value, { intensity = false, texture = null } = {}) {
  const n = Math.max(0, Math.min(GLUTE_SIZE_MAX, Math.round(Number(value) || 0)));
  if (!n) return "";
  
  let descriptor;
  
  if (n <= 100) {
    // Standard levels
    descriptor = SIZE_LEVELS[Math.max(0, Math.ceil(n / 10) - 1)];
  } else {
    // Extended range with plain descriptive levels
    const threshold = Object.keys(EXTREME_SIZE_DESCRIPTORS)
      .map(Number)
      .sort((a, b) => a - b)
      .find(t => n <= t) || 300;
    descriptor = EXTREME_SIZE_DESCRIPTORS[threshold];
  }
  
  // Add texture if specified
  const textureMod = texture && TEXTURE_MODIFIERS[texture] ? `, ${TEXTURE_MODIFIERS[texture]}` : "";
  
  return `${descriptor} glute volume${textureMod}${intensity ? ` (size intensity ${n}/${GLUTE_SIZE_MAX})` : ""}`;
}

export function gluteShapePrompt(value, { texture = null } = {}) {
  const baseShape = CONTOURS[value] || SHAPES[value] || String(value || "");
  
  // Add texture if provided
  const textureMod = texture && TEXTURE_MODIFIERS[texture] ? `, ${TEXTURE_MODIFIERS[texture]}` : "";
  
  return `${baseShape}${textureMod}`;
}

// Emit each independent control exactly once, including ordinary sizes.
export function buildGlutePrompt({ size = 0, shape = "naturally round", texture = null, intensity = false } = {}) {
  return [
    gluteSizePrompt(size, { intensity }),
    gluteShapePrompt(shape, { texture }),
  ].filter(Boolean).join(", ");
}

// Export for DNA integration
export const GLUTE_SHAPES = Object.keys(SHAPES);
export const GLUTE_TEXTURES = Object.keys(TEXTURE_MODIFIERS);