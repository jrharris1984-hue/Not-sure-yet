export const PHOTO_DETAIL = 'Natural photographic skin texture with subtle pores, realistic lighting and lens detail';
export const PHOTO_EXCLUSIONS = 'cartoon, anime, illustration, CGI, 3d render, doll-like skin, plastic skin, waxy skin, airbrushed skin, overly smooth skin';
export const LIMB_DETAIL = 'Hands at the ends of arms; feet at the ends of legs; footwear worn only on feet';

export const STANDARD_PHOTO_NEGATIVE = `low quality, blurry, compression artifacts, watermark, malformed hands, malformed feet, extra limbs, disconnected limbs, fused limbs, feet replacing hands, shoes on hands, ${PHOTO_EXCLUSIONS}`;

export function applyPhotographicGuidance({ positive = '', negative = '', negativeStrategy = 'text', enabled = true } = {}) {
  if (!enabled) return { positive, negative };
  let photoPositive = positive;
  if (!positive.includes(PHOTO_DETAIL)) {
    // Pony's score tags must stay first. Keep photo detail in early encoder context.
    const score = positive.match(/^((?:score_[^,; ]+,?\s*)+)/)?.[0] || '';
    photoPositive = `${score}${PHOTO_DETAIL}; ${positive.slice(score.length)}`;
  }
  if (!photoPositive.includes(LIMB_DETAIL)) photoPositive = photoPositive.replace(PHOTO_DETAIL, `${PHOTO_DETAIL}; ${LIMB_DETAIL}`);
  const terms = [];
  for (const term of String(negative).split(',').map(value => value.trim()).filter(Boolean)) {
    if (!terms.some(existing => existing.toLowerCase() === term.toLowerCase())) terms.push(term);
  }
  if (negativeStrategy === 'text') {
    for (const term of STANDARD_PHOTO_NEGATIVE.split(', ')) {
      if (!terms.some(existing => existing.toLowerCase() === term.toLowerCase())) terms.push(term);
    }
  }
  return { positive: photoPositive, negative: negativeStrategy === 'text' ? terms.join(', ') : negative };
}
