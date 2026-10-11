import {catalogDna} from './promptCatalog';
import {resolveBuilderControls} from './builderControlResolution';
import {compileModelPrompts} from './modelPromptCompilers';
import {importCategoryBatch,exportCategoryBatch} from './bulkCatalogCategory';
const field=(key,options,type='chips')=>({key,label:key,type,options:options.map(([value,keywords])=>({value,label:value,keywords,group:''}))});
const library={sections:[{key:'watersports',title:'Controls',fields:[
  field('source',[['self','edited origin wording'],['none','edited off wording']]),
  field('phase',[['before','setup marker'],['in progress','active phase marker'],['afterward','finished marker']]),
  field('self_action',[['custom_detail','selected detail marker']]),
  field('self_aim',[['custom_target','selected target marker']]),
  field('stream',[['custom_stream','stream marker']]),
  field('wetness',[['dry','dry marker'],['wet','wet marker']],'chips_multi'),
  field('camera_view',[['side profile','view marker']]),
]}]};
test('behavior uses saved identifiers, not edited prompt wording',()=>{
  const original={watersports:{source:'self',phase:'in progress',self_action:'custom_detail',self_aim:'custom_target',camera_view:'side profile',wetness:['dry','wet']},pose:{angle:'front'}};
  const translated=catalogDna(original,library,true);
  const result=resolveBuilderControls(translated);
  expect(result.dna.watersports.self_action).toBe('selected detail marker');
  expect(result.dna.watersports.self_aim).toBe('selected target marker');
  expect(result.dna.pose.angle).toBe('profile');
  expect(result.dna.watersports.wetness).toEqual(['wet marker']);
  expect(resolveBuilderControls(result.dna).dna.watersports.wetness).toEqual(['wet marker']);
  expect(original.watersports.wetness).toEqual(['dry','wet']);
});
test.each(['before','afterward','none'])('%s still deactivates incompatible details after prompt editing',mode=>{
  const original={watersports:{source:mode==='none'?'none':'self',phase:mode==='none'?'in progress':mode,self_action:'custom_detail',self_aim:'custom_target',stream:'custom_stream'}};
  const result=resolveBuilderControls(catalogDna(original,library,true));
  expect(result.dna.watersports.stream).toBe('');
  expect(result.dna.watersports.self_aim).toBe('');
  if(mode==='none')expect(result.dna.watersports.source).toBe('none');
});
test.each(['standard','chroma','krea2','pony','sdxl','qwen_image','wan_t2v','zimage'])('%s keeps active edited details in actual prompt output',promptStyle=>{
  const dna={identity:{age:30},watersports:{source:'self',phase:'in progress',self_action:'custom_detail',self_aim:'custom_target'}};
  const result=compileModelPrompts({promptStyle,dna,promptCatalog:library});
  expect(result.positive).toContain('selected detail marker');
  expect(result.positive).toContain('selected target marker');
});
test('reference-only edits in a category import receive an actionable error',()=>{
  const section=library.sections[0],getKeywords=()=> 'original mapping';
  const batch=exportCategoryBatch(section,getKeywords);
  batch.category.fields[0].choices[0].default_keywords='reference edit';
  expect(()=>importCategoryBatch(JSON.stringify(batch),section,getKeywords)).toThrow('Put prompt edits in keywords');
});
