import {WARDROBE_ITEMS,WARDROBE_CATEGORY_GROUPS,searchWardrobe} from './wardrobeCatalog';

test('catalog additions have unique identities and appear in category browsing',()=>{
 expect(new Set(WARDROBE_ITEMS.map(item=>item.id)).size).toBe(WARDROBE_ITEMS.length);
 expect(WARDROBE_CATEGORY_GROUPS.map(group=>group.name)).toEqual(expect.arrayContaining(['Activewear & Movement','Modern Formal','Wedding & Ceremony','Seasonal Layers','Creative Workwear']));
 expect(searchWardrobe('trench','Seasonal Layers')[0].label).toBe('Spring trench');
 expect(searchWardrobe('camera-ready')[0].prompt).toContain('fitted vest');
});
