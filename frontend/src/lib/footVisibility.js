// Visibility rules use actual coverage, rather than asking an LLM to guess.
export function footVisibility(wardrobe = {}, feet = {}) {
  const shoe = String(wardrobe.heel_type || wardrobe.footwear || '').toLowerCase();
  const hosiery = String(wardrobe.hosiery_type || feet.hosiery || '').toLowerCase();
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
