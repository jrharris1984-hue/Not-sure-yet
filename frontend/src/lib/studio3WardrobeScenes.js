// Non-destructive per-shot wardrobe and scene overrides for Studio 3.
export const createLook3=({name='New look',wardrobe={},scene={},lighting={}}={})=>({version:1,name,wardrobe:{...wardrobe},scene:{...scene},lighting:{...lighting}});
export const applyLook3=(dna={},look={})=>({
 ...dna,
 wardrobe:{...(dna.wardrobe||{}),...(look.wardrobe||{})},
 scene:{...(dna.scene||{}),...(look.scene||{})},
 lighting:{...(dna.lighting||{}),...(look.lighting||{})},
});
export const compareLooks3=(a={},b={})=>['wardrobe','scene','lighting'].flatMap(section=>
 Object.keys({...a[section],...b[section]}).filter(key=>a[section]?.[key]!==b[section]?.[key]).map(key=>section+'.'+key));
