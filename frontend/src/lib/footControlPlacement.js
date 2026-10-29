// Presentation only: saved foot values remain in dna.feet.
export const FOOT_APPEARANCE_FIELDS=['arch','foot_size','toe_length','sole_texture'];
export const FOOT_DESTINATIONS={
  wardrobe:{title:'Foot styling',help:'Pedicure, accessories and coverings. Wardrobe’s main socks and stockings choice takes priority over the older foot setting.',groups:[
    {label:'Nails & grooming',fields:['pedicure','pedicure_art','toenail_shape']},
    {label:'Accessories',fields:['foot_accessories']},
    {label:'Foot condition',fields:['foot_state']},
    {label:'Older hosiery setting',fields:['hosiery']},
  ]},
  pose:{title:'Detail shots · Feet',help:'Choose Feet focus only when feet should control the composition. Supporting detail keeps your main pose and crop.',groups:[
    {label:'Focus & framing',fields:['composition_mode','framing']},
    {label:'Position & presentation',fields:['foot_pose','sole_presentation','toes']},
    {label:'Other saved interactions',fields:['foot_act']},
  ]},
  scene:{title:'Surface under feet',help:'Choose the surface visible beneath the feet. Keep it consistent with the surrounding scene.',groups:[{label:'Surface',fields:['ground_surface']}]},
};
export function footDestination(field) {
  return Object.entries(FOOT_DESTINATIONS).find(([,definition])=>definition.groups.some(group=>group.fields.includes(field)))?.[0] || 'feet';
}
export function footAppearanceSection(section,showAll=false,requestedField=null) {
  if(section?.key!=='feet' || showAll)return section;
  return {...section,title:['Feet & styling','Feet'].includes(section.title)?'Foot appearance':section.title,
    fields:section.fields.filter(field=>footDestination(field.key)==='feet' || field.key===requestedField)};
}
export function scopedFootEdit(previous,next,fields) {
  return {...previous,...Object.fromEntries(fields.filter(field=>Object.prototype.hasOwnProperty.call(next,field.key)).map(field=>[field.key,next[field.key]]))};
}
