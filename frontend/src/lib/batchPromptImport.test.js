import { SECTIONS } from './dna';
import { applyBatchPromptRows, exportPromptBatch, parseBatchPromptInput, prepareBatchPromptRows } from './batchPromptImport';

test('parses JSON, CSV and simple prompt lines into reviewable records',()=>{
  expect(parseBatchPromptInput('[{"label":"Window light","prompt":"soft light from a window"}]')[0]).toMatchObject({label:'Window light',prompt:'soft light from a window'});
  expect(parseBatchPromptInput('label,prompt,category\nWindow light,"soft light, gentle shadows",Lighting')[0]).toMatchObject({label:'Window light',prompt:'soft light, gentle shadows',category:'Lighting'});
  expect(parseBatchPromptInput('Window light: soft light from a window')[0]).toMatchObject({label:'Window light',prompt:'soft light from a window'});
});

test('suggests pose, wardrobe and scene controls while allowing manual review',()=>{
  const rows=prepareBatchPromptRows([
    {label:'Runway turn',prompt:'A confident runway pose, turning over one shoulder'},
    {label:'Linen jacket',prompt:'A tailored linen jacket and trousers outfit'},
    {label:'Garden scene',prompt:'A portrait in a garden at golden hour',category:'Scene',subcategory:'Environment'},
  ],SECTIONS);
  expect(rows[0].destination).toMatch(/^pose::/);
  expect(rows[1].destination).toMatch(/^wardrobe::/);
  expect(rows[2].destination).toMatch(/^scene::environment$/);
  expect(rows.every(row=>row.confidence>0)).toBe(true);
});

test('applies a batch as additions and same-label wording updates without dropping other catalog data',()=>{
  const sections=SECTIONS;
  const existing={sections:[{key:'pose',title:'Pose',fields:[{key:'action',label:'Action',type:'chips',options:[{value:'custom_saved',label:'Window light',keywords:'old prompt',group:'Studio',short:'soft light'}]}]}],rules:[{key:'keep_rule',label:'Keep rule',text:'keep the selected camera view',kind:'positive',scope:'all',enabled:true}]};
  const rows=prepareBatchPromptRows([
    {label:'Window light',prompt:'warm directional window light',category:'Pose',subcategory:'Action'},
    {label:'Runway pause',prompt:'a poised runway stance',category:'Pose',subcategory:'Action'},
  ],sections).map(row=>({...row,destination:'pose::action'}));
  const result=applyBatchPromptRows(existing,rows,sections);
  const choices=result.catalog.sections[0].fields[0].options;
  expect(result).toMatchObject({added:1,updated:1,skipped:0});
  expect(choices.find(option=>option.value==='custom_saved')).toMatchObject({keywords:'warm directional window light',group:'Studio',short:'soft light'});
  expect(choices.find(option=>option.label==='Runway pause').keywords).toBe('a poised runway stance');
  expect(result.catalog.rules).toEqual(existing.rules);
});

test('routes unclear prompts to a custom imported category and supports skipping rows',()=>{
  const rows=prepareBatchPromptRows([{label:'Unusual direction',prompt:'A surreal geometric composition'}],SECTIONS).map(row=>({...row,skip:true}));
  const result=applyBatchPromptRows({sections:[]},rows,SECTIONS);
  expect(result).toMatchObject({added:0,updated:0,skipped:1});
  expect(result.catalog.sections).toEqual([]);
});

test('exports round-trip IDs and applies AI wording to the exact choice even when its label changes',()=>{
  const catalog={sections:[{key:'pose',title:'Pose',fields:[{key:'action',label:'Action',type:'chips',options:[{value:'runway_walk',label:'Runway walk',keywords:'walk with confidence'}]}]}]};
  const batch=exportPromptBatch([{key:'pose',title:'Pose',fields:catalog.sections[0].fields}], 'pose','action');
  expect(batch.prompts[0]).toMatchObject({id:'pose::action::runway_walk',label:'Runway walk',prompt:'walk with confidence'});
  const row=prepareBatchPromptRows([{...batch.prompts[0],label:'Confident runway stride',prompt:'A poised editorial runway stride'}],[{key:'pose',title:'Pose',fields:catalog.sections[0].fields}]);
  expect(row[0]).toMatchObject({destination:'pose::action',change:'update',existingValue:'runway_walk'});
  const result=applyBatchPromptRows(catalog,row,[{key:'pose',title:'Pose',fields:catalog.sections[0].fields}]);
  expect(result.catalog.sections[0].fields[0].options).toEqual([{value:'runway_walk',label:'Runway walk',keywords:'A poised editorial runway stride'}]);
});
