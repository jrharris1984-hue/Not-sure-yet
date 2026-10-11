export const WARDROBE_GROUPS = [
  {key:'outfit',label:'Outfit & garments',fields:['outfit_mode','outfit_set','outfit_set_color','outfit_preset','dress_style','skirt_style','top','bottom']},
  {key:'underneath',label:'Underneath layers',fields:['set_lingerie_mode','set_lingerie','underwear']},
  {key:'coverage',label:'Coverage & clothing state',fields:['exposure_mode','state']},
  {key:'fabric',label:'Fabric, color & fit',fields:['material','garment_color','garment_pattern','palette','fit']},
  {key:'shoes',label:'Shoes & heels',fields:['footwear','heel_type','heel_color','heel_height','heel_finish']},
  {key:'hosiery',label:'Stockings & hosiery',fields:['hosiery_type','hosiery_color','hosiery_pattern','hosiery_denier']},
  {key:'accessories',label:'Accessories & nails',fields:['accessories','glasses_style','glasses_color','nail_color','nail_shape']},
];
export const wardrobeGroupFor = key => WARDROBE_GROUPS.find(group=>group.fields.includes(key))?.key || 'other';
export function wardrobeGroups(fields) {
  return [...WARDROBE_GROUPS,{key:'other',label:'Other wardrobe details',fields:[]}]
    .map(group=>({...group,fields:fields.filter(field=>wardrobeGroupFor(field.key)===group.key)}))
    .filter(group=>group.fields.length);
}
