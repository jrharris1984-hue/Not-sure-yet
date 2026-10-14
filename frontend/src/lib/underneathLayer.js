import { resolveWardrobeLayers, wardrobeLayerGuidance } from './wardrobeLayers';
import { SET_LINGERIE_GROUPS, LAYERED_OUTFIT_GROUP, matchingSetLingerie } from "./completeOutfitSets";
import { wardrobeNudity } from './wardrobeNudity';

// Built-in layer choices reuse full ensemble presets. Their outer garments
// and footwear belong to the main outfit, not the underwear beneath it.
const builtInLayers = new Set([
  ...SET_LINGERIE_GROUPS.flatMap(group => group.options),
  ...LAYERED_OUTFIT_GROUP.options.map(matchingSetLingerie),
]);
export function underneathComponents(value = '') {
  if (!builtInLayers.has(value)) return value; // Preserve authored keyword text.
  const pieces = value.split(/,\s*|\s+with\s+|\s+and\s+/i);
  const kept = pieces.filter(piece => !/\b(?:robes?|wraps?|slippers?|heels?|pumps?|stilettos?|sandals?|mules?|flats?|shoes?|boots?|headpieces?|capes?|gloves?|clutch|handbags?|jackets?|coats?)\b/i.test(piece));
  return kept.length === pieces.length ? value : kept.join(' and ');
}
export function resolveUnderneathComponents(source = {}) {
  const wardrobe = source.wardrobe;
  if (!wardrobe || wardrobe.set_lingerie_mode === 'none' || wardrobe.outfit_mode === 'custom') return source;
  const value = wardrobe.set_lingerie;
  const selected = source._catalogSelections?.wardrobe?.set_lingerie;
  if (selected != null && selected !== value) return source; // Authored keywords own their wording.
  if (!value || wardrobe.outfit_set === value && wardrobeNudity(wardrobe).mode !== 'lingerie only') return source;
  const resolved = underneathComponents(value);
  return value !== resolved ? { ...source, wardrobe: { ...wardrobe, set_lingerie: resolved,
    ...(wardrobe.outfit_set === value ? { outfit_set: resolved } : {}) } } : source;
}

// Inclusion describes a garment layer; coverage independently controls whether
// that layer is visible. Never invent a layer when it was disabled or removed.
export function underneathLayer(wardrobe = {}, selected) {
  if (wardrobe.outfit_set === wardrobe.set_lingerie) return null;
  const value = String(selected != null && selected !== wardrobe.set_lingerie ? wardrobe.set_lingerie || '' : underneathComponents(wardrobe.set_lingerie || '')).trim();
  if (!value || value === 'none' || wardrobe.set_lingerie_mode === 'none'
      || wardrobe.outfit_mode === 'custom' || !wardrobe.outfit_set
      || wardrobe.outfit_set === value) return null;
  const coverage = wardrobeNudity(wardrobe);
  if (coverage.suppressClothing || coverage.removeUpper || coverage.removeLower || coverage.mode === 'lingerie only') return null;
  return { value, text: `underneath clothing: ${value}, worn under the selected outer outfit` };
}

// Opening outer fastenings does not remove the underwear beneath them.
export function underneathCoverage(wardrobe = {}, value = underneathLayer(wardrobe)?.value) {
  if (!value) return '';
  return wardrobeLayerGuidance(resolveWardrobeLayers({ wardrobe: { ...wardrobe, underwear: value } }));
}

function subjectText(positive, label, multi) {
  if (!multi) return positive;
  const markers = [...positive.matchAll(/\bSubject\s+([A-Za-z0-9]+)\b/gi)];
  return markers.filter(marker => marker[1].toLowerCase() === label.toLowerCase())
    .map(marker => positive.slice(marker.index, markers[markers.indexOf(marker) + 1]?.index ?? positive.length)).join(' ');
}
export function preserveUnderneathLayers(result, subjects = []) {
  const positive = String(result.positive || '');
  const additions = subjects.flatMap((subject, index) => {
    const layer = underneathLayer(subject.dna?.wardrobe, subject.dna?._catalogSelections?.wardrobe?.set_lingerie);
    const label = subject.label || String.fromCharCode(65 + index);
    if (!layer) return [];
    const ownText = subjectText(positive, label, subjects.length > 1);
    const prefix = subjects.length > 1 ? `Subject ${label} wardrobe: ` : '';
    const additions = ownText.toLowerCase().includes(layer.value.toLowerCase()) ? [] : [prefix + layer.text];
    const coverage = underneathCoverage(subject.dna.wardrobe, layer.value);
    if (coverage && !ownText.includes(coverage)) additions.push(prefix + coverage);
    return additions;
  });
  return additions.length ? { ...result, positive: [positive, ...additions].filter(Boolean).join('; ') } : result;
}
