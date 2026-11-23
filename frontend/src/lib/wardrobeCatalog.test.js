import {WARDROBE_ITEMS,WARDROBE_CATEGORY_GROUPS,searchWardrobe} from './wardrobeCatalog';
import {SECTIONS} from './dna';

test('catalog additions have unique identities and appear in category browsing',()=>{
 expect(new Set(WARDROBE_ITEMS.map(item=>item.id)).size).toBe(WARDROBE_ITEMS.length);
 expect(WARDROBE_CATEGORY_GROUPS.map(group=>group.name)).toEqual(expect.arrayContaining(['Activewear & Movement','Modern Formal','Wedding & Ceremony','Seasonal Layers','Creative Workwear']));
 expect(searchWardrobe('trench','Seasonal Layers')[0].label).toBe('Spring trench');
 expect(searchWardrobe('camera-ready')[0].prompt).toContain('fitted vest');
});

test('new lingerie, stocking and stage footwear sets are searchable and unique',()=>{
 const additions=WARDROBE_ITEMS.filter(item=>/^(lingerie|hosiery|stage)-/.test(item.id));
 expect(additions).toHaveLength(22);
 expect(new Set(additions.map(item=>item.prompt)).size).toBe(additions.length);
 expect(WARDROBE_CATEGORY_GROUPS.map(group=>group.name)).toEqual(expect.arrayContaining(['Lingerie Sets','Stocking Looks','Stage & Dancewear']));
 expect(searchWardrobe('emerald lace','Lingerie Sets')[0].prompt).toContain('garter belt');
 expect(searchWardrobe('pole dance','Stage & Dancewear')[0].prompt).toContain('platform pole-dance heels');
});
test('expanded individual lingerie, hosiery and stage heel options are available in the DNA controls',()=>{
 const fields=SECTIONS.find(section=>section.key==='wardrobe').fields;
 const options=key=>fields.find(field=>field.key===key);
 expect(options('underwear').options).toContain('embroidered corset and garter set');
 expect(options('hosiery_type').options).toContain('diamond fishnet tights');
 expect(options('heel_type').groups.find(group=>group.name==='Stage & Pole Heels').options).toContain('7-inch clear platform stripper heels');
});
