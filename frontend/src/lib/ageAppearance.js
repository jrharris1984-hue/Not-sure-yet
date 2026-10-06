// Age owns facial maturity; hair colour, skin tone and cosmetic finishes remain
// independent. These are photographic cues, not medical age predictions.
export function ageSkinTexture(value) {
  const age = Number(value);
  if (!Number.isFinite(age) || age < 18) return '';
  return age >= 50 ? 'mature skin texture' : age >= 35 ? 'fine lines' : 'natural pores';
}

export function ageAppearancePrompt(value) {
  const age = Number(value);
  if (!Number.isFinite(age) || age < 18) return '';
  if (age >= 80) return 'older adult in their eighties or older, deep natural facial wrinkles, mature neck texture and softer jaw contours';
  if (age >= 70) return 'older adult in their seventies, visible forehead wrinkles and crow’s feet, defined lines around the mouth, mature neck texture and softer jaw contours';
  if (age >= 60) return 'older adult in their sixties, visible facial wrinkles and crow’s feet, natural folds around the mouth and mature skin texture';
  if (age >= 50) return 'adult in their fifties, visible fine lines around the eyes and mouth, gentle facial folds and natural mature skin texture';
  if (age >= 40) return 'adult in their forties, light facial lines around the eyes and mouth, natural adult skin texture';
  if (age >= 35) return 'adult in their thirties, subtle expression lines and natural skin texture';
  return '';
}

export function resolveAgeSkin(dna = {}) {
  const texture = ageSkinTexture(dna.identity?.age);
  if (!texture) return dna;
  const current = String(dna.skin?.texture || '');
  const older = Number(dna.identity.age) >= 50;
  const competing = older ? /smooth|flawless|poreless|wrinkle[- ]?free|ageless|youthful/i.test(current)
    : Number(dna.identity.age) < 35 && /mature skin|aged skin|deep wrinkles/i.test(current);
  return !current || competing ? {...dna, skin:{...dna.skin, texture}} : dna;
}

export function skinAfterAgeChange(dna = {}, previousAge) {
  const texture = ageSkinTexture(dna.identity?.age);
  const cosmeticFinish = /^(?:matte|dewy|oiled|sweat-glistening|satin skin finish)$/.test(dna.skin?.texture || '');
  return texture && Number(previousAge) !== Number(dna.identity.age)
    ? {...dna, skin:{...dna.skin, texture:cosmeticFinish ? dna.skin.texture : texture}} : dna;
}
