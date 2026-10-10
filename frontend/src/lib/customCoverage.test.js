import {catalogDna, setPromptCatalog, validateCatalogDraft, parsePromptLibraryBackup} from './promptCatalog';
import {wardrobeExposure, wardrobeNudity} from './wardrobeNudity';
import {editWardrobeField} from './wardrobeMode';
import {resolveBuilderControls} from './builderControlResolution';
import {compileModelPrompts} from './modelPromptCompilers';
import {DEFAULT_DNA} from './dna';
const option=(value, coverage_mode, keywords)=>({value,label:'Custom coverage',coverage_mode,keywords,short:'soft draped wrap',short_tags:'draped wrap',group:''});
const config=options=>({sections:[{key:'wardrobe',title:'Wardrobe',fields:[{key:'exposure_mode',label:'Clothing coverage',type:'chips',options}]}]});
const source=wardrobe=>({...DEFAULT_DNA,wardrobe});
afterEach(()=>setPromptCatalog({sections:[]}));

test.each(['qwen_image','chroma','zimage','pony','sdxl','krea2'])('%s submits custom coverage wording and replaces conflicting selected clothes',promptStyle=>{
  const library=config([option('custom_wrap','replace outfit','soft fabric draped around the body')]);
  const dna=source({outfit_mode:'full',outfit_set:'tailored pantsuit',exposure_mode:'custom_wrap'});
  const result=compileModelPrompts({dna,promptStyle,promptCatalog:library});
  expect(result.positive).toContain('soft fabric draped around the body');
  expect(result.positive).not.toContain('tailored pantsuit');
  expect(result.positive).not.toContain('custom_wrap');
  expect(dna.wardrobe.outfit_set).toBe('tailored pantsuit');
});

test('custom choices stay selected in Studio, legacy missing choices still fall back, and explicit catalogs do not leak',()=>{
  const library=config([option('custom_wrap','replace outfit','soft fabric wrap')]);
  setPromptCatalog(library);
  expect(wardrobeExposure({exposure_mode:'custom_wrap'})).toBe('custom_wrap');
  expect(wardrobeNudity({exposure_mode:'custom_wrap'}).mode).toBe('replace outfit');
  expect(wardrobeExposure({exposure_mode:'custom_deleted'})).toBe('use selected outfit');
  setPromptCatalog({sections:[]});
  compileModelPrompts({dna:source({exposure_mode:'custom_wrap'}),promptStyle:'qwen_image',promptCatalog:library});
  expect(wardrobeExposure({exposure_mode:'custom_wrap'})).toBe('use selected outfit');
});

test('custom coverage can keep the selected outfit and defaults to keeping it without metadata',()=>{
  const library=config([{value:'custom_sheer',label:'Sheer layer',keywords:'transparent fabric layer',group:''}]);
  const translated=catalogDna(source({top:'blouse',exposure_mode:'custom_sheer'}),library,true);
  expect(wardrobeNudity(translated.wardrobe)).toMatchObject({mode:'use selected outfit',direction:'transparent fabric layer',suppressClothing:false});
});

test('custom upper and lower garment removal preserves separate remaining garments',()=>{
  const library=config([option('custom_upper','topless','upper garment removed, lower garment remains'),option('custom_lower','bottomless','lower garment removed, upper garment remains')]);
  const upper=resolveBuilderControls(catalogDna(source({outfit_mode:'custom',top:'blouse',bottom:'jeans',exposure_mode:'custom_upper'}),library,true));
  expect(upper.dna.wardrobe.top).toBe(''); expect(upper.dna.wardrobe.bottom).toBe('jeans');
  const lower=resolveBuilderControls(catalogDna(source({outfit_mode:'custom',top:'blouse',bottom:'jeans',exposure_mode:'custom_lower'}),library,true));
  expect(lower.dna.wardrobe.bottom).toBe(''); expect(lower.dna.wardrobe.top).toBe('blouse');
});

test('disabled underneath layers apply to custom coverage behaviors too',()=>{
  setPromptCatalog(config([option('custom_layer','lingerie only','selected underneath layer only')]));
  const wardrobe={outfit_mode:'full',outfit_set:'pantsuit',set_lingerie_mode:'none',exposure_mode:'use selected outfit'};
  expect(editWardrobeField(wardrobe,'exposure_mode','custom_layer')).toBe(wardrobe);
  expect(wardrobeExposure({...wardrobe,exposure_mode:'custom_layer'})).toBe('use selected outfit');
});

test.each([['qwen_image','soft draped wrap'],['pony','draped wrap']])('%s supports custom compact coverage wording', (promptStyle, phrase)=>{
  const library=config([option('custom_wrap','replace outfit','soft fabric draped around the body')]);
  const result=compileModelPrompts({dna:source({exposure_mode:'custom_wrap'}),promptStyle,promptFormat:'compact',promptCatalog:library});
  expect(result.positive).toContain(phrase);
});

test('large formatted backups import while oversized files and invalid behavior metadata fail',()=>{
  const text=JSON.stringify(config([option('custom_wrap','replace outfit','fabric wrap')]),null,2)+' '.repeat(600000);
  expect(()=>parsePromptLibraryBackup(text,text.length)).not.toThrow();
  expect(()=>parsePromptLibraryBackup(text,2000001)).toThrow('2 MB');
  expect(()=>validateCatalogDraft(config([option('custom_wrap','invalid mode','wrap')]))).toThrow();
});

test('an explicit empty compiler library does not inherit another active library',()=>{
  setPromptCatalog(config([option('custom_wrap','replace outfit','soft fabric wrap')]));
  const result=compileModelPrompts({dna:source({exposure_mode:'custom_wrap',top:'blouse'}),promptStyle:'qwen_image',promptCatalog:{sections:[]}});
  expect(result.positive).not.toContain('soft fabric wrap');
});
