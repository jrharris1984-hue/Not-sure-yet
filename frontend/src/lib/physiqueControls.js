import { gluteShapePrompt } from './gluteControls';
import { catalogSelection } from './promptCatalog';
import { physiqueScalePrompt } from './physiqueScalePrompts';


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
  const max = region === 'hips' ? 2000 : 750;
  const amount = Math.max(0, Math.min(max, Number(slider) || 0));
  if (!amount) return REGIONAL_PRESETS[region]?.[preset] || String(preset || '');
  if (region === 'butt') return '';
  return physiqueScalePrompt(region, amount, max);
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
      if(resolved._catalogSelections?.physique)resolved._catalogSelections.physique[preset]='';
      adjustments.push(`Used ${slider} instead of the competing ${preset} preset.`);
    }
  }
  if (Number(ph.implant_volume) > 0) {
    ph.bust = ''; ph.bust_scale = 0; ph.bust_shape = '';
    if(resolved._catalogSelections?.physique)for(const key of ['bust','bust_scale','bust_shape'])resolved._catalogSelections.physique[key]='';
  }
  // Imported size choices sometimes include an augmentation specification.
  // A separately selected natural contour owns that choice.
  const naturalContour = /\bnatural\b|\bunaugmented\b/i.test(ph.bust_shape || '');
  if (naturalContour && /\bimplants?\b|\baugmented\b|\bfake\b|\bbolt-ons?\b/i.test(ph.bust || '')) {
    ph.bust = '';
    if(resolved._catalogSelections?.physique)resolved._catalogSelections.physique.bust='';
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
    if(resolved._catalogSelections?.physique)resolved._catalogSelections.physique.body_type='';
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
