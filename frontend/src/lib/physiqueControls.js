import { gluteShapePrompt } from './gluteControls';
import { catalogSelection } from './promptCatalog';


const REGIONAL_PRESETS = {
  hips: {
    narrow: 'narrow pelvic silhouette with minimal lateral hip flare',
    average: 'balanced hip width relative to the waist and shoulders',
    wide: 'wide lateral hip contour with a clearly defined waist-to-hip transition',
    'very wide': 'very wide hip silhouette with prominent outward flare at both sides',
    extreme: 'dramatically broad hip silhouette with pronounced lateral width and a strong waist-to-hip contrast',
  },
  thighs: {
    slim: 'slender upper thighs with a narrow outer leg contour',
    toned: 'lean toned upper thighs with subtle muscular definition',
    athletic: 'athletic upper thighs with visible quadriceps development',
    thick: 'full thick upper thighs with a broad rounded outer contour',
    'very thick': 'very thick upper thighs with substantial upper-leg volume',
    massive: 'extremely broad upper thighs with dramatically increased upper-leg volume',
  },
  butt: {
    flat: 'minimal rear glute projection and a shallow side profile',
    small: 'compact glute silhouette with subtle rear projection',
    toned: 'firm compact glute silhouette with athletic definition',
    round: 'rounded glute silhouette with balanced rear projection',
    bubble: 'prominently rounded glute silhouette with concentrated rear projection',
    large: 'large full glute silhouette with clear rear projection',
    'very large': 'very large glute silhouette with substantial rear projection',
    huge: 'oversized glute silhouette with pronounced rearward volume',
    hyper: 'fantasy-scale glute silhouette with extreme rearward volume',
  },
};

export function regionalPhysiquePrompt(region, preset, slider = 0) {
  const amount = Math.max(0, Math.min(region === 'butt' ? 500 : 300, Number(slider) || 0));
  if (!amount) return REGIONAL_PRESETS[region]?.[preset] || String(preset || '');
  if (region === 'butt') return '';
  if (amount > 100) {
    const band = amount <= 150 ? 'dramatically amplified' : amount <= 200 ? 'fantasy-scale expansive' : amount <= 250 ? 'surreal maximum' : 'beyond-human fantasy-scale';
    const shape = region === 'hips'
      ? 'lateral hip flare, broad outer pelvic silhouette and a pronounced waist-to-hip transition'
      : 'upper-thigh thickness, prominent outer-leg fullness and substantial upper-leg volume';
    return `${band} ${shape} (${region === 'hips' ? 'lateral hip width' : 'upper-thigh volume'} intensity ${Math.round(amount)}/300)`;
  }
  const level = Math.min(4, Math.floor(Math.min(amount, 99.999) / 20));
  const descriptions = region === 'hips'
    ? [
      'very narrow hips with little lateral flare',
      'moderately narrow hips with a gentle waist-to-hip transition',
      'balanced hip width with a visible waist-to-hip transition',
      'wide hips with prominent lateral flare and a defined waist-to-hip transition',
      'extremely wide hips with dramatic lateral flare and a pronounced waist-to-hip contrast',
    ]
    : [
      'very slender upper thighs with minimal volume',
      'lean upper thighs with subtle muscular contour',
      'moderately full upper thighs with rounded outer contours',
      'thick upper thighs with substantial upper-leg volume',
      'extremely thick upper thighs with dramatic upper-leg volume',
    ];
  // Keep the silhouette descriptor stable within a band while preserving the
  // exact slider position for downstream prompt compilation and comparisons.
  // This avoids identical prompts for every value in a twenty-point range.
  const axis = region === 'hips' ? 'lateral hip width' : 'upper-thigh volume';
  return `${descriptions[level]} (${axis} intensity ${Math.round(amount)}/100)`;
}

export const BUST_SHAPES = {
  natural: 'natural breast contour with realistic weight',
  perky: 'firm upturned breast contour',
  round: 'rounded breast contour',
  teardrop: 'teardrop-shaped breast contour',
  athletic: 'firm athletic breast contour',
  augmented: 'rounded high-profile augmented breast contour',
  'gravity-defying': 'high-set firm breast contour',
};
export const bustShapePrompt = value => BUST_SHAPES[value] || String(value || '');

export function resolvePhysiqueControls(dna = {}) {
  const resolved = JSON.parse(JSON.stringify(dna));
  const ph = resolved.physique = { ...(resolved.physique || {}) };
  const adjustments = [];
  const controls = { bust_scale: 'bust', butt_scale: 'butt', hip_scale: 'hips', waist_scale: 'waist', thigh_scale: 'thighs' };
  const detailed = Object.keys(controls).some(key => Number(ph[key]) > 0) || Number(ph.implant_volume) > 0;
  for (const [slider, preset] of Object.entries(controls)) {
    if (Number(ph[slider]) > 0 && ph[preset]) {
      ph[preset] = '';
      adjustments.push(`Used ${slider} instead of the competing ${preset} preset.`);
    }
  }
  if (Number(ph.implant_volume) > 0) {
    ph.bust = ''; ph.bust_scale = 0; ph.bust_shape = '';
  }
  // Imported size choices sometimes include an augmentation specification.
  // A separately selected natural contour owns that choice.
  const naturalContour = /\bnatural\b|\bunaugmented\b/i.test(ph.bust_shape || '');
  if (naturalContour && /\bimplants?\b|\baugmented\b|\bfake\b|\bbolt-ons?\b/i.test(ph.bust || '')) {
    ph.bust = '';
    adjustments.push('The selected natural contour overrides augmentation wording bundled into the size preset.');
  }
  if (detailed && ph.proportions) {
    ph.proportions = '';
    adjustments.push('Used detailed physique controls instead of overlapping proportions notes.');
  }
  const waist = Number(ph.waist_scale || 0), hips = Number(ph.hip_scale || 0);
  const bodyType = catalogSelection(resolved, 'physique', 'body_type');
  if ((['hourglass', 'pear', 'bombshell'].includes(bodyType) && (waist >= 60 || (hips > 0 && hips <= 30)))
      || (bodyType === 'apple' && waist > 0 && waist <= 40)
      || (bodyType === 'amazonian' && ['petite', 'short'].includes(ph.height))) {
    adjustments.push(`Removed the ${ph.body_type} preset because it conflicts with the selected regional proportions.`);
    ph.body_type = '';
  }
  if (ph.glute_shape) ph.glute_shape = gluteShapePrompt(ph.glute_shape);
  return { dna: resolved, adjustments };
}

export function photographicPrompt(value) {
  return String(value || '')
    .replace(/cartoonishly/gi, 'deliberately')
    .replace(/cartoonish(?:ly)?|cartoon-style/gi, 'exaggerated')
    .replace(/stylized fantasy proportions|surreal proportions/gi, 'deliberately exaggerated proportions')
    .replace(/impossibly|impossible(?=\s+(?:hyper|huge|proportions|volume))/gi, 'deliberately exaggerated')
    .replace(/gravity-defying/gi, 'strongly projected');
}
