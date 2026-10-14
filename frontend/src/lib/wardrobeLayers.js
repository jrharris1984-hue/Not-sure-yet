import { wardrobeNudity } from './wardrobeNudity';

const upperOuter = /\b(?:tops?|shirts?|blouses?|sweaters?|t-shirts?|tshirts?|hoodies?|camisoles?|tank tops?)\b/i;
const lowerOuter = /\b(?:skirts?|miniskirts?|trousers?|pants|jeans|leggings|shorts|slacks)\b/i;
const wholeOuter = /\b(?:pantsuits?|tuxedos?|three-piece suit|business suit|streetwear|dresses?|sundress|gowns?|jumpsuits?)\b/i;
const trousers = /\b(?:pantsuits?|trousers?|pants|jeans|leggings|slacks)\b/i;
const bra = /\b(?:bras?|bralettes?)\b/i;
const briefs = /\b(?:briefs|panties|underpants|knickers|bikini bottoms|boyshorts)\b/i;
const hosiery = /\b(?:stockings|garters?|thigh[- ]highs?|pantyhose|tights|socks)\b/i;
const ambiguous = /\b(?:transparent|see-through|sheer|mesh|crotchless|open[- ]cup|cupless|peephole|cutout|cut-out|exposed)\b/i;
const present = value => value != null && !['', 'none', 'bare'].includes(String(value));
const split = value => String(value).split(/,\s*|;\s*|\s+(?:and|with)\s+/i).map(text => text.trim()).filter(Boolean);

function entries(dna, fields) {
  const w = dna.wardrobe || {};
  return fields.flatMap(field => {
    if (!present(w[field])) return [];
    // Expanded wording is authoritative; snapshot IDs cannot describe a second garment.
    const text = String(w[field]);
    return split(text).map(piece => ({ field, text: piece }));
  });
}
const knownOpaque = (items, pattern) => items.some(item => pattern.test(item.text) && !ambiguous.test(item.text) && !/\b(?:no|without|removed|bare)\b/i.test(item.text));

// Pure, model-independent interpretation of already resolved wardrobe selections.
// It never edits body proportions, saved clothing, or authored prompt keywords.
export function resolveWardrobeLayers(dna = {}) {
  const w = dna.wardrobe || {};
  const exposure = wardrobeNudity(w);
  const activeLayer = w.set_lingerie_mode !== 'none' && w.outfit_mode !== 'custom';
  const underItems = entries(dna, ['underwear', ...(activeLayer ? ['set_lingerie'] : []), 'hosiery_type']);
  if (!w.hosiery_type && present(dna.feet?.hosiery)) underItems.push(...split(dna.feet.hosiery).map(text => ({ field: 'feet.hosiery', text })));
  const outerItems = entries(dna, ['top', 'bottom', 'dress_style', 'skirt_style', 'outfit_set', 'outfit_preset']);
  // Ensembles can contain underwear or hosiery even when used as a main outfit.
  for (const item of outerItems) if (bra.test(item.text) || briefs.test(item.text) || hosiery.test(item.text)) underItems.push(item);
  const keepUnder = item => exposure.suppressClothing
    ? ['hosiery only'].includes(exposure.mode) && hosiery.test(item.text)
    : !(exposure.removeUpper && bra.test(item.text)) && !(exposure.removeLower && briefs.test(item.text));
  const underwear = [...new Map(underItems.filter(keepUnder).map(item => [item.text.toLowerCase(), item])).values()];
  const outer = exposure.suppressClothing || exposure.mode === 'lingerie only' ? [] : outerItems.filter(item =>
    !(bra.test(item.text) || briefs.test(item.text) || hosiery.test(item.text))
    && !(exposure.removeUpper && (upperOuter.test(item.text) || wholeOuter.test(item.text)))
    && !(exposure.removeLower && (lowerOuter.test(item.text) || wholeOuter.test(item.text))));
  const explicitState = present(w.state) && !['fully clothed', 'intact'].includes(w.state);
  const closed = ['use selected outfit', 'slightly revealing', 'topless', 'topless and barefoot', 'bottomless'].includes(exposure.mode)
    && !/\b(?:open|shifted|exposed|wet)\b/i.test(exposure.direction) && !explicitState;
  const opaqueMaterial = !ambiguous.test(String(w.material || ''));
  const upperUnder = knownOpaque(underwear, bra) && !exposure.removeUpper;
  const lowerUnder = knownOpaque(underwear, briefs) && !exposure.removeLower;
  const upperCoveredByOuter = closed && opaqueMaterial && knownOpaque(outer, new RegExp(`${upperOuter.source}|${wholeOuter.source}`, 'i')) && !exposure.removeUpper;
  const lowerCoveredByOuter = closed && opaqueMaterial && knownOpaque(outer, new RegExp(`${lowerOuter.source}|${wholeOuter.source}`, 'i')) && !exposure.removeLower;
  // Retain the established conservative fully covering outfit check for navel visibility.
  const fullText = outer.map(item => item.text).join(' and ');
  const fullOuterCoverage = exposure.selection === 'use selected outfit' && !explicitState && opaqueMaterial
    && !ambiguous.test(fullText) && !/\b(?:open|shifted|topless|bottomless|nude)\b/i.test(fullText)
    && /\b(?:pantsuit|tuxedo|three-piece suit|business suit|streetwear|denim jacket and skirt)\b/i.test(fullText);
  const opening = /^(?:custom_coverage_)?(?:unbuttoned|unzipped|undone)$/.test(exposure.selection) || exposure.mode === 'lingerie showing';
  const removing = /\b(?:remov|sliding|falling|pulled|undress|hiked)\w*/i.test(exposure.direction)
    || /\b(?:coming off|pulled|riding up)\b/i.test(String(w.state || ''));
  const hasTrousers = outer.some(item => trousers.test(item.text));
  return {
    layers: [
      { key: 'character', order: 1, proportions: { ...dna.physique } },
      { key: 'underwear', order: 2, items: underwear },
      { key: 'outer', order: 3, items: outer },
    ],
    exposure,
    covered: { upper: fullOuterCoverage || upperUnder || upperCoveredByOuter, lower: fullOuterCoverage || lowerUnder || lowerCoveredByOuter },
    outerCoverage: { upper: fullOuterCoverage || upperCoveredByOuter, lower: fullOuterCoverage || lowerCoveredByOuter },
    underwearCoverage: { upper: upperUnder, lower: lowerUnder },
    fullOuterCoverage, opening,
    trousersRemain: hasTrousers && !removing,
    stockingsUnderTrousers: hasTrousers && !removing && underwear.some(item => hosiery.test(item.text) && !/\b(?:no|without|removed|bare)\b/i.test(item.text)),
    skirtRemain: outer.some(item => /\b(?:skirt|miniskirt)\b/i.test(item.text)) && !removing,
  };
}

export function wardrobeLayerGuidance(plan) {
  const under = plan.layers[1].items;
  if (!under.length) return '';
  const parts = [];
  if (plan.layers[2].items.length && (plan.outerCoverage.upper || plan.outerCoverage.lower)) parts.push('underwear remains beneath the outer clothing; covered portions are concealed by the outer fabric');
  if (plan.underwearCoverage.upper) parts.push('bra cups properly covering the breasts, bra stays in place');
  if (plan.underwearCoverage.lower) parts.push('briefs remain worn and cover the pelvis');
  if (plan.trousersRemain) {
    parts.push('selected trousers remain worn, continuous trouser fabric from waist to ankles');
    if (plan.opening && (plan.underwearCoverage.upper || plan.underwearCoverage.lower)) {
      if (plan.underwearCoverage.upper) parts.push('outer top open to show the bra');
      if (plan.underwearCoverage.lower) parts.push('trouser waistband and front fastening open only enough to reveal the briefs, trousers stay on the legs');
    }
    if (plan.stockingsUnderTrousers) parts.push('selected hosiery underneath the trousers, concealed where the trousers cover the legs; hosiery does not replace the trousers');
  }
  if (plan.skirtRemain) parts.push('selected skirt remains the outer layer; any selected lower underwear and hosiery stay beneath it');
  return parts.join(', ');
}

// This pass runs after family-specific formatting, including compact rebuilding.
export function preserveWardrobeLayerGuidance(result, subjects = []) {
  let positive = String(result.positive || '');
  const plans = subjects.map(subject => resolveWardrobeLayers(subject.dna));
  subjects.forEach((subject, index) => {
    const guidance = wardrobeLayerGuidance(plans[index]);
    if (!guidance) return;
    const label = subject.label || String.fromCharCode(65 + index);
    const prefix = subjects.length > 1 ? `Wardrobe layers for Subject ${label}: ` : '';
    const markers = [...positive.matchAll(/\bSubject\s+([A-Za-z0-9]+)\b/gi)];
    const own = subjects.length === 1 ? positive : markers.filter(marker => marker[1].toLowerCase() === label.toLowerCase())
      .map(marker => positive.slice(marker.index, markers[markers.indexOf(marker) + 1]?.index ?? positive.length)).join(' ');
    const missing = guidance.split(', ').filter(clause => !own.includes(clause));
    if (missing.length) positive += `; ${prefix}${missing.join(', ')}`;
  });
  return { ...result, positive, wardrobeLayers: plans.map((plan, index) => ({ subject: subjects[index].label || String.fromCharCode(65 + index), ...plan })),
    promptWords: positive.trim().split(/\s+/).filter(Boolean).length };
}
