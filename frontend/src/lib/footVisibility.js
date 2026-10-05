// Visibility rules use actual coverage, rather than asking an LLM to guess.
export function footVisibility(wardrobe = {}, feet = {}) {
  const set = String(wardrobe.outfit_set || '').toLowerCase();
  const setShoe = set.match(/\b(?:heels|stilettos|pumps|boots|sandals|flats|shoes)\b/)?.[0];
  const setHosiery = set.match(/\b(?:stockings|thigh-highs)\b/)?.[0];
  const shoe = String(wardrobe.heel_type || wardrobe.footwear || setShoe || '').toLowerCase();
  const hosiery = String(wardrobe.hosiery_type || feet.hosiery || setHosiery || '').toLowerCase();
  const hasShoe = !!shoe && !['barefoot','none'].includes(shoe);
  const openToe = /open.toe|peep.toe|sandal/.test(shoe);
  const closedToe = hasShoe && !openToe;
  const hasHosiery = !!hosiery && !['bare','none'].includes(hosiery);
  const footless = /footless/.test(hosiery);
  const toeless = /toeless|open.toe/.test(hosiery);
  const opaque = /sock|opaque/.test(hosiery) && !/ultra.sheer/.test(hosiery);
  const toesCovered = closedToe || (hasHosiery && !footless && !toeless && opaque);
  const soleCovered = hasShoe || (hasHosiery && !footless);
  return { hasShoe, hasHosiery, openToe, toesVisible: !toesCovered, soleVisible: !soleCovered,
    bare: !hasShoe && (!hasHosiery || footless) };
}
