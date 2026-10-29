// Narrow, reviewable corrections to ordinary garment descriptions. No saved
// override is migrated automatically, and custom/compact wording stays intact.
export const WARDROBE_PROMPT_UPDATES = [
  ['footwear','stiletto heels','tall stiletto heels, pointed toe','stiletto heels'],
  ['footwear','thigh-high boots','black thigh-high leather boots, stiletto heels','thigh-high boots'],
  ['footwear','over-the-knee boots','over-the-knee black boots','over-the-knee boots'],
  ['footwear','ankle boots','ankle boots, block heel','ankle boots'],
  ['footwear','combat boots','chunky combat boots','combat boots'],
  ['footwear','sneakers','trendy white sneakers','sneakers'],
  ['footwear','platform heels','tall chunky platform heels','platform heels'],
  ['footwear','sandals','strappy sandals','sandals'],
  ['footwear','cowgirl boots','brown cowgirl boots','cowgirl boots'],
  ['material','latex','shiny wet-look latex fabric, second-skin glossy black','latex fabric'],
  ['material','fishnet','black fishnet mesh fabric','fishnet mesh fabric'],
  ['material','chainmail','silver metallic chainmail fabric','metallic chainmail'],
  ['material','leather','black leather, glossy grain','leather'],
  ['top','mesh top','black mesh see-through top, fishnet fabric','mesh top'],
  ['top','chainmail top','chainmail metal top, silver mesh armor','chainmail top'],
  ['bottom','pencil skirt','tight pencil skirt hugging hips and thighs','pencil skirt'],
  ['bottom','leather skirt','tight black leather mini skirt','leather skirt'],
  ['bottom','denim shorts','tiny cutoff denim shorts','denim shorts'],
  ['bottom','hot pants','tiny hot pants, spandex','short-cut hot pants'],
  ['bottom','latex leggings','shiny black latex leggings, second-skin','latex leggings'],
  ['bottom','wet look pants','shiny wet-look black pants','wet-look pants'],
  ['accessories','gloves','elbow-length gloves','gloves'],
  ['accessories','opera gloves','long black opera gloves','long opera gloves'],
  ['accessories','sunglasses','designer sunglasses','sunglasses'],
].map(([field,value,before,after])=>({field,value,before,after,id:`${field}:${value}`}));

export function wardrobePromptReview(catalog = {}) {
  const wardrobe=catalog.sections?.find(section=>section.key==='wardrobe');
  return WARDROBE_PROMPT_UPDATES.flatMap(update=>{
    const option=wardrobe?.fields?.find(field=>field.key===update.field)?.options?.find(option=>option.value===update.value);
    if (!option?.keywords?.trim() || option.keywords.trim()===update.after) return [];
    const customized = option.keywords.trim()!==update.before || Boolean(option.short?.trim() || option.short_tags?.trim());
    return [{...update,current:option.keywords,customized}];
  });
}

export function stageWardrobePromptUpdates(catalog, ids) {
  const eligible=new Map(wardrobePromptReview(catalog).filter(row=>!row.customized && ids.includes(row.id)).map(row=>[row.id,row]));
  return {...catalog,sections:catalog.sections.map(section=>section.key!=='wardrobe'?section:{...section,fields:section.fields.map(field=>({...field,options:field.options.map(option=>{
    const update=eligible.get(`${field.key}:${option.value}`);
    return update?{...option,keywords:update.after}:option;
  })}))})};
}
