import { HERITAGE_PROFILES } from './heritageProfiles';
// Creative contemporary outfit suggestions, not claims of traditional authenticity.
export const HERITAGE_PHOTO_OUTFITS = {
  Latin: ['embroidered cotton blouse, flowing midi skirt and flat sandals', 'linen shirt, tailored trousers and leather flats', 'colorful cotton day dress and simple sandals'],
  'East Asian': ['layered cotton blouse, wide-leg trousers and minimalist flats', 'lightweight cardigan, pleated midi skirt and loafers'],
  'Southeast Asian': ['lightweight patterned blouse, linen trousers and flat sandals', 'cotton wrap-style day dress and simple flats'],
  'South Asian': ['printed kurta, straight trousers and flat sandals', 'embroidered tunic, tailored trousers and simple flats'],
  'Central Asian': ['embroidered long jacket, plain blouse, tailored trousers and flats'],
  Black: ['colorful geometric-print blouse, tailored trousers and flats', 'patterned cotton midi dress and simple sandals'],
  Caribbean: ['colorful linen blouse, flowing midi skirt and sandals', 'lightweight cotton day dress and flat sandals'],
  European: ['tailored blazer, plain blouse, straight-leg jeans and loafers', 'knit cardigan, cotton midi dress and flats'],
  'Middle Eastern': ['embroidered long tunic, wide-leg trousers and flat sandals', 'long lightweight jacket, plain blouse and tailored trousers'],
  Pacific: ['floral cotton day dress and flat sandals', 'printed linen shirt, plain trousers and sandals'],
  Indigenous: ['embroidered contemporary blouse, plain trousers and flats'],
  Mixed: ['colorful patterned blouse, tailored trousers and loafers', 'linen day dress and simple sandals'],
  Mediterranean: ['linen blouse, wide-leg trousers and leather sandals', 'cotton midi dress and woven flats'],
};
const fallback = ['cotton blouse, tailored trousers and loafers', 'linen day dress and simple flats'];
export const HERITAGE_OUTFIT_GROUP = {name:'Heritage-inspired everyday fashion',options:[...new Set([...Object.values(HERITAGE_PHOTO_OUTFITS).flat(),...fallback])]};
export function heritagePhotoOutfit(heritage, previous) {
  const choices=HERITAGE_PHOTO_OUTFITS[HERITAGE_PROFILES[heritage]?.group] || fallback;
  const alternatives=choices.filter(value=>value!==previous);
  const pool=alternatives.length ? alternatives : choices;
  return pool[Math.floor(Math.random()*pool.length)];
}
