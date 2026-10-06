import { gluteShapePrompt } from './gluteControls';
import { catalogSelection } from './promptCatalog';

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
