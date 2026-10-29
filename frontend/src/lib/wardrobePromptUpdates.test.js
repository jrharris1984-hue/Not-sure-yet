import {WARDROBE_PROMPT_UPDATES,wardrobePromptReview,stageWardrobePromptUpdates} from './wardrobePromptUpdates';
import {expandPrompt} from './promptMap';
import {compileModelPrompts} from './modelPromptCompilers';
import {setPromptCatalog} from './promptCatalog';
import {buildCompactNarrative} from './compactNarrative';
afterEach(()=>setPromptCatalog({sections:[]}));
const catalog=()=>({sections:[{key:'wardrobe',title:'Wardrobe',fields:[{key:'footwear',label:'Footwear',type:'chips',options:[
  {value:'sneakers',label:'Sneakers',keywords:'trendy white sneakers',group:'Shoes'},
  {value:'ankle boots',label:'My boots',keywords:'red suede ankle boots',short:'red boots'},
  {value:'sandals',label:'Sandals',keywords:'strappy sandals',short_tags:'woven sandals'}]}]}],rules:[{key:'keep',text:'soft light'}]});
test.each(WARDROBE_PROMPT_UPDATES)('default $field / $value retains only selected meaning',row=>{
  expect(expandPrompt('wardrobe',row.field,row.value)).toBe(row.after);
});
test('review stages exact old defaults without changing custom, short wording, labels or rules',()=>{
  const original=catalog(),before=JSON.stringify(original),rows=wardrobePromptReview(original);
  expect(rows.map(r=>r.customized)).toEqual([true,false,true]); // update order: ankle boots, sneakers, sandals
  const staged=stageWardrobePromptUpdates(original,rows.map(r=>r.id));
  expect(staged.sections[0].fields[0].options[0]).toMatchObject({keywords:'sneakers',label:'Sneakers',group:'Shoes'});
  expect(staged.sections[0].fields[0].options.slice(1)).toEqual(original.sections[0].fields[0].options.slice(1));
  expect(staged.rules).toEqual(original.rules);expect(JSON.stringify(original)).toBe(before);
  expect(wardrobePromptReview(staged).every(row=>row.customized)).toBe(true);
});
const styles=['standard','moss_image','chroma','krea2','zimage','flux1_dev','flux2_klein','qwen_image','sdxl','pony'];
const dna=()=>({identity:{age:35,gender:'female'},wardrobe:{outfit_mode:'custom',top:'blue cotton shirt',bottom:'black trousers',footwear:'sneakers',exposure_mode:'use selected outfit'},pose:{distance:'full body'},style:{render:'photorealistic'}});
test.each(styles.flatMap(style=>['detailed','compact','scene'].map(format=>[style,format])))('%s / %s preserves blue shirt, black trousers and uncolored sneakers',(promptStyle,promptFormat)=>{
  const input=dna(),before=JSON.stringify(input);
  const {positive}=compileModelPrompts({dna:input,promptStyle,promptFormat,workflowKind:'image'});
  expect(positive).toContain('blue cotton shirt');expect(positive).toContain('black trousers');expect(positive).toContain('sneakers');
  expect(positive).not.toMatch(/white sneakers|trendy white|block heel/);expect(JSON.stringify(input)).toBe(before);
});
test.each(['detailed','compact','scene'])('custom shoe wording is preserved in %s',promptFormat=>{
  const input=dna();setPromptCatalog(catalog());
  const {positive}=compileModelPrompts({dna:input,promptStyle:'chroma',promptFormat,workflowKind:'image'});
  expect(positive).toContain('trendy white sneakers');
});
test('compact attributes distinguish clothing, hosiery and shoes; requirements match emitted wording',()=>{
  const result=buildCompactNarrative([{dna:{identity:{age:35,gender:'female'},wardrobe:{garment_color:'blue',material:'leather',heel_color:'red',hosiery_color:'gray',hosiery_denier:'40',garment_pattern:'striped'}}}],{sections:[]});
  for(const text of ['blue garment color','leather clothing material','red footwear color','gray hosiery color','40 hosiery denier','striped garment pattern']) expect(result.positive).toContain(text);
  expect(result.requirements.find(r=>r.field==='heel_color').text).toBe('red footwear color');
});
