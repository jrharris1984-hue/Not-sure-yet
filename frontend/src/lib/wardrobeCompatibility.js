// Unknown custom outfits stay editable; classify only explicit garment wording.
export function garmentContext(w = {}) {
  const outfit = [w.dress_style,w.skirt_style,w.top,w.bottom,w.outfit_set,w.outfit_preset].filter(value=>value && value!=='none').join(' ').toLowerCase();
  return {
    skirt:/\b(skirts?|lehenga)\b/.test(outfit),
    dress:/\b(dress(?:es)?|sundress|gowns?|sari|kaftan|abaya|jalabiya|anarkali)\b/.test(outfit),
    pants:/\b(pants(?:uit)?|trousers?|jeans|leggings|chaps|sharara|gharara)\b/.test(outfit),
    shorts:/\bshorts\b/.test(outfit),
    upper:/\b(tops?|shirts?|blouse|bralette|bra|corset|bustier|halter|strapless|sweater|cardigan|jacket|bodysuit|teddy|chemise|babydoll)\b/.test(outfit),
  };
}
export function wardrobeStateResolution(w = {}) {
  const context=garmentContext(w), state=String(w.state || '').toLowerCase();
  if (!state) return {};
  if (state==='unbuttoned' && !context.upper && !context.dress) {
    if (context.pants) return {value:'trouser waistband button undone'};
    if (context.shorts) return {value:'shorts waistband button undone'};
    return {value:'',reason:'Unbuttoning requires a selected garment.'};
  }
  if (state==='one strap down' && !context.upper && !context.dress) return {value:'',reason:'A slipped shoulder strap requires a selected top or dress.'};
  if (state==='riding up') {
    if (context.skirt) return {};
    if (context.dress) return {value:'dress hem riding up slightly'};
    if (context.shorts) return {value:'shorts hems riding up slightly'};
    if (context.pants) return {value:'trouser hems slightly raised at the ankles'};
    return {value:'',reason:'Hem adjustments require a selected skirt, dress, shorts or trousers.'};
  }
  if (/\bskirt\b/.test(state) && !context.skirt) return {value:'',reason:'This skirt adjustment is inactive because no skirt is selected.'};
  if (/\b(?:dress|gown)\b/.test(state) && !context.dress) return {value:'',reason:'This dress adjustment is inactive because no dress is selected.'};
  if (/\b(?:pants|trousers|jeans|shorts)\b/.test(state) && !context.pants && !context.shorts) return {value:'',reason:'This trouser or shorts adjustment is inactive for the selected outfit.'};
  if ((state==='shirt open' || state==='top pulled down' || /\b(?:shirt|blouse|top)\b/.test(state)) && !context.upper && !context.dress)
    return {value:'',reason:'This upper garment adjustment requires a selected top or dress.'};
  if (/\b(?:panties|briefs|underwear)\b/.test(state) && (w.underwear==='none' || ![w.underwear,w.set_lingerie,w.outfit_set,w.outfit_preset].some(value=>/panties|briefs|underwear|lingerie|thong|g-string|knickers|bikini|boy shorts/i.test(value || ''))))
    return {value:'',reason:'This underwear adjustment requires a selected underwear layer.'};
  return {};
}
