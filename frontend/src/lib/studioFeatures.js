import {SECTIONS} from './dna';
export const STUDIO_CHARACTER_SECTIONS=['identity','scenario','hair','face','physique','intimate','wardrobe','skin','feet'];
export const STUDIO_SECTION_NAMES={identity:'Identity',scenario:'People & casting',hair:'Hair',face:'Face',physique:'Physical features',intimate:'Intimate details',wardrobe:'Outfit',skin:'Skin',feet:'Feet',scene:'Setting',pose:'Pose',lighting:'Lighting',camera:'Camera',style:'Style'};
export const INTIMATE_DETAIL_GROUPS=[
  {key:'grooming',label:'Grooming',fields:['body_hair','pubic_hair']},
  {key:'chest',label:'Chest anatomy',fields:['nipple_size','nipple_shape','areola_size','areola_shape','areola_color','areola_detail']},
  {key:'adornments',label:'Body jewelry',fields:['piercings']},
];
// Non-explicit anatomy and grooming controls. Preserve other saved DNA without
// exposing sexual-action or bodily-fluid controls in the character inspector.
const allowed=new Set(INTIMATE_DETAIL_GROUPS.flatMap(group=>group.fields));
export function studioFeatureSection(key) {
  const section=SECTIONS.find(item=>item.key===key);
  if(key==='scenario' && section)return {...section,fields:section.fields.filter(field=>['cast_age_mode','cast_age_gap','cast_resemblance'].includes(field.key))};
  if(key!=='intimate' || !section)return section;
  return {...section,fields:section.fields.filter(field=>allowed.has(field.key)).map(field=>field.key==='piercings'
    ? {...field,options:field.options.filter(value=>['none','nipple','navel','nose','septum','tongue'].includes(value))}:field)};
}
export function studioFeatureOptions(section,field) {
  const spec=studioFeatureSection(section)?.fields.find(item=>item.key===field);
  return [...new Set(spec?.groups?spec.groups.flatMap(group=>group.options):spec?.options || [])].map(value=>({value,label:spec?.optionLabels?.[value] || value}));
}

export const STUDIO_SCENE_SECTIONS=['scene','pose','lighting','camera','style'];
export const studioCategoryDirectory=()=>[...STUDIO_CHARACTER_SECTIONS,...STUDIO_SCENE_SECTIONS].map(key=>({key,label:STUDIO_SECTION_NAMES[key],panel:STUDIO_SCENE_SECTIONS.includes(key)?'scene':'character',fields:studioFeatureSection(key).fields.length}));
