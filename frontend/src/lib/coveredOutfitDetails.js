import { catalogSelection } from './promptCatalog';
import { wardrobeExposure } from './wardrobeNudity';

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
