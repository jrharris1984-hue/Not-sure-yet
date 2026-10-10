import {SIMPLE_COVERAGE_OPTIONS, simpleCoverageOptions} from './simpleCoverage';
import {SECTIONS,DEFAULT_DNA} from './dna';
import {editableSection,catalogSections,validateCatalogDraft,catalogDna,setPromptCatalog} from './promptCatalog';
import {resolveBuilderControls} from './builderControlResolution';
import {compileModelPrompts} from './modelPromptCompilers';
const config=options=>({sections:[{key:'wardrobe',title:'Wardrobe',fields:[{key:'exposure_mode',label:'Clothing coverage',type:'chips',options}]}]});
afterEach(()=>setPromptCatalog({sections:[]}));
test('default library has exactly 22 choices with usable wording',()=>{
 const wardrobe=SECTIONS.find(section=>section.key==='wardrobe');
 const field=editableSection(wardrobe).fields.find(item=>item.key==='exposure_mode');
 expect(field.options).toHaveLength(22);expect(field.options.map(item=>item.label)).toEqual(SIMPLE_COVERAGE_OPTIONS.map(item=>item.label));
 expect(()=>validateCatalogDraft(config(field.options))).not.toThrow();
 const selected=SIMPLE_COVERAGE_OPTIONS[0];
 const result=compileModelPrompts({dna:{...DEFAULT_DNA,wardrobe:{outfit_mode:'custom',top:'blouse',bottom:'jeans',exposure_mode:selected.value}},promptStyle:'sdxl'});
 expect(result.positive).toContain('top removed');expect(result.positive).toContain('jeans');expect(result.positive).not.toContain('blouse');
});
test('reset preserves matching IDs and saved lists are still respected',()=>{
 const previous=[{value:'custom_saved',label:'unbuttoned shirt',keywords:'old wording'},{value:'custom_extra',label:'extra',keywords:'other'}];
 const reset=simpleCoverageOptions(previous);
 expect(reset.find(item=>item.label==='unbuttoned').value).toBe('custom_saved');expect(reset.some(item=>item.value==='custom_extra')).toBe(false);
 const sections=catalogSections(SECTIONS,config(previous));
 expect(sections.find(item=>item.key==='wardrobe').fields.find(item=>item.key==='exposure_mode').options).toEqual(['custom_saved','custom_extra']);
});
test.each(['topless and barefoot','hosiery only','heels only','nothing but jewelry'])('%s removes conflicts and preserves the saved recipe',label=>{
 const option=SIMPLE_COVERAGE_OPTIONS.find(item=>item.label===label);
 const source={...DEFAULT_DNA,wardrobe:{outfit_mode:'custom',top:'blouse',bottom:'jeans',footwear:'boots',heel_type:'platform pumps',hosiery_type:'stockings',accessories:['gloves','jewelry'],glasses_style:'sunglasses',exposure_mode:option.value},feet:{hosiery:'opaque tights',foot_accessories:['anklet','henna on feet']}};
 const before=JSON.stringify(source);
 const result=resolveBuilderControls(catalogDna(source,config(SIMPLE_COVERAGE_OPTIONS),true)).dna;
 if(label==='topless and barefoot') {
  expect(result.wardrobe.top).toBe('');expect(result.wardrobe.bottom).toBe('jeans');expect(result.wardrobe.heel_type).toBe('');expect(result.wardrobe.footwear).toBe('');expect(result.wardrobe.hosiery_type).toBe('');
 } else {
  expect(result.wardrobe.top).toBe('');expect(result.wardrobe.bottom).toBe('');expect(result.wardrobe.glasses_style).toBe('');
  if(label==='hosiery only'){expect(result.wardrobe.hosiery_type).toBe('stockings');expect(result.wardrobe.heel_type).toBe('');}
  if(label==='heels only'){expect(result.wardrobe.heel_type).toBe('platform pumps');expect(result.wardrobe.hosiery_type).toBe('');}
  if(label==='nothing but jewelry'){expect(result.wardrobe.accessories).toEqual(['jewelry']);expect(result.feet.foot_accessories).toEqual(['anklet']);expect(result.wardrobe.heel_type).toBe('');}
 }
 expect(JSON.stringify(source)).toBe(before);
});
