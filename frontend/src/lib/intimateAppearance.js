// Presentation groups for the existing Intimate DNA fields.
// No existing selection is renamed or discarded.
export const INTIMATE_GROUPS=[
 {name:'Breast & Nipple Details',keys:['nipples','areolas','nipple_size','nipple_shape','areola_size','areola_shape','areola_color','areola_detail']},
 {name:'Pubic Grooming',keys:['pubic_hair','body_hair','grooming_density','grooming_length','grooming_color']},
 {name:'External Anatomy',keys:['pussy','clit','anatomy_symmetry','anatomy_skin_tone']},
 {name:'Perianal Appearance',keys:['asshole','perianal_skin_tone','perianal_grooming']},
 {name:'Skin & Surface Details',keys:['skin_markings','skin_texture_detail','skin_pigmentation']},
 {name:'Piercings & Jewelry',keys:['piercings','jewelry_material']},
 {name:'Effects & Fluids',keys:['cum_state','saliva','squirt','lactation','sweat','lube','tears']}
];
export const intimateGroupFor=key=>INTIMATE_GROUPS.find(group=>group.keys.includes(key))?.name||'Other';
export const INTIMATE_EXTRA_FIELDS=[
 {key:'grooming_density',label:'Hair density',options:['fine sparse hair','moderate hair density','dense natural hair']},
 {key:'grooming_length',label:'Hair length',options:['short trimmed hair','medium length hair','long natural hair']},
 {key:'grooming_color',label:'Hair color',options:['natural matching hair color','dark brown hair','black hair','auburn hair','blonde hair']},
 {key:'anatomy_symmetry',label:'Natural symmetry',options:['balanced natural symmetry','subtle natural asymmetry']},
 {key:'anatomy_skin_tone',label:'Skin tone variation',options:['consistent surrounding skin tone','subtle natural tonal variation','pronounced natural tonal variation']},
 {key:'perianal_skin_tone',label:'Perianal skin tone',options:['natural matching skin tone','subtle darker pigmentation','visible natural tonal variation']},
 {key:'perianal_grooming',label:'Perianal grooming',options:['smooth grooming','short trimmed surrounding hair','natural surrounding hair']},
 {key:'skin_markings',label:'Natural skin markings',options:['subtle freckles','beauty marks','faint stretch marks','small healed scars']},
 {key:'skin_texture_detail',label:'Skin texture',options:['smooth editorial finish','natural skin pores and texture','pronounced realistic skin texture']},
 {key:'skin_pigmentation',label:'Pigmentation',options:['even natural pigmentation','subtle natural pigment variation','visible natural pigment variation']},
 {key:'jewelry_material',label:'Jewelry finish',options:['polished silver','warm gold','rose gold','matte black titanium','gemstone accents']}
];
export function intimateAppearancePrompt(data={}){
 return INTIMATE_EXTRA_FIELDS.map(f=>f.options.includes(data[f.key])?data[f.key]:'').filter(Boolean).join(', ');
}
