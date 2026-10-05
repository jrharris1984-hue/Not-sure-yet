export const PHOTO_DETAIL = 'Natural photographic skin texture with subtle pores, realistic lighting and lens detail; preserve the selected subjects, proportions, pose and composition';
export const PHOTO_EXCLUSIONS = 'cartoon, anime, illustration, CGI, 3d render, doll-like skin, plastic skin, waxy skin, airbrushed skin, overly smooth skin';

export const STANDARD_PHOTO_NEGATIVE = `low quality, blurry, compression artifacts, watermark, malformed hands, malformed feet, extra limbs, disconnected limbs, ${PHOTO_EXCLUSIONS}`;

export function applyPhotographicGuidance({ positive = '', negative = '', negativeStrategy = 'text', enabled = true } = {}) {
  if (!enabled) return { positive, negative };
  let photoPositive = positive;
  if (!positive.includes(PHOTO_DETAIL)) {
    // Pony's score tags must stay first. Keep photo detail in early encoder context.
    const score = positive.match(/^((?:score_[^,; ]+,?\s*)+)/)?.[0] || '';
    photoPositive = `${score}${PHOTO_DETAIL}; ${positive.slice(score.length)}`;
  }
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
