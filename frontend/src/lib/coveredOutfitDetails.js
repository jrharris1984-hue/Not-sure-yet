import { catalogSelection } from './promptCatalog';
import { wardrobeNudity, wardrobeExposure } from './wardrobeNudity';

export const CONCEALED_ANATOMY_FIELDS = [
  'pubic_hair', 'pussy', 'clit', 'asshole', 'nipples', 'areolas',
  'nipple_size', 'nipple_shape', 'areola_size', 'areola_shape', 'areola_color', 'areola_detail',
];

// Only infer full coverage from clearly covering outer outfits. Unknown custom
// garments retain their selections rather than guessing which areas are hidden.
export function hasCoveringOuterOutfit(dna = {}) {
  const wardrobe = dna.wardrobe || {};
  if (wardrobeExposure(wardrobe) !== 'use selected outfit') return false;
  if (wardrobe.state && !['none', 'fully clothed', 'intact'].includes(wardrobe.state)) return false;
  const fields = ['outfit_set', 'outfit_preset', 'dress_style', 'top', 'bottom', 'material'];
  const text = fields.flatMap(field => [wardrobe[field], catalogSelection(dna, 'wardrobe', field)])
    .filter(Boolean).join(' ').toLowerCase();
  if (/\b(?:sheer|transparent|see-through|mesh|open|shifted|topless|bottomless|nude|cutout|cut-out|crotchless|exposed)\b/.test(text)) return false;
  return /\b(?:pantsuit|tuxedo|three-piece suit|business suit|streetwear|denim jacket and skirt)\b/.test(text);
}

// Resolve visibility by body region. Proportions remain selected; only covered
// surface details are omitted from the render copy.
export function concealedAnatomyFields(dna = {}) {
  if (hasCoveringOuterOutfit(dna)) return CONCEALED_ANATOMY_FIELDS;
  const w = dna.wardrobe || {};
  const exposure = wardrobeNudity(w);
  if (exposure.suppressClothing) return [];
  const text = fields => fields.flatMap(field => [w[field], catalogSelection(dna, 'wardrobe', field)]).filter(Boolean).join(' ');
  const ambiguous = value => /\b(?:transparent|see-through|sheer|mesh|crotchless|open[- ]cup|cupless|peephole|cutout|cut-out)\b/i.test(value);
  const layer = text(['underwear', ...(w.set_lingerie_mode !== 'none' ? ['set_lingerie'] : [])]);
  const upper = text(['top', 'dress_style', 'outfit_set', 'outfit_preset']);
  const lower = text(['bottom', 'skirt_style', 'dress_style', 'outfit_set', 'outfit_preset']);
  const closed = ['use selected outfit', 'slightly revealing', 'topless', 'topless and barefoot', 'bottomless'].includes(exposure.mode)
    && !/\b(?:open|shifted|exposed|wet)\b/i.test(exposure.direction)
    && (!w.state || ['none', 'fully clothed', 'intact'].includes(w.state));
  const breastsCovered = !exposure.removeUpper && (
    (!ambiguous(layer) && /\b(?:bra|bralette)\b/i.test(layer))
    || (closed && !ambiguous(upper) && /\b(?:shirt|blouse|sweater|t-shirt|tshirt|dress|pantsuit|tuxedo|jumpsuit)\b/i.test(upper)));
  const pelvisCovered = !exposure.removeLower && (
    (!ambiguous(layer) && /\b(?:briefs|panties|underpants|knickers)\b/i.test(layer))
    || (closed && !ambiguous(lower) && /\b(?:skirt|dress|pantsuit|trousers|pants|jeans|leggings|shorts|slacks|jumpsuit)\b/i.test(lower)));
  return CONCEALED_ANATOMY_FIELDS.filter(field =>
    (breastsCovered && /^(?:nipple|areola)/.test(field))
    || (pelvisCovered && ['pubic_hair', 'pussy', 'clit', 'asshole'].includes(field)));
}
