import {auditSelectionPrompt, buildSelectionManifest} from './selectionPromptAudit';
import {compileModelPrompts} from './modelPromptCompilers';
import {DEFAULT_DNA} from './dna';

const dna = patch => ({...JSON.parse(JSON.stringify(DEFAULT_DNA)), ...patch});
const check = (options, positive) => {
  const result = compileModelPrompts(options);
  return auditSelectionPrompt(positive ?? result.positive, result.selectionManifest);
};
const row = (audit, path, value) => audit.rows.find(item=>`${item.section}.${item.field}`===path && (value===undefined || item.value===String(value)));

test.each(['qwen_image','chroma','zimage','pony','sdxl','krea2'])('%s checks an active numeric slider and keeps its preset inactive', promptStyle => {
  const source=dna({physique:{bust:'small',bust_scale:80},hair:{color:'black'}});
  const audit=check({dna:source,promptStyle});
  expect(row(audit,'physique.bust').status).toBe('inactive');
  expect(row(audit,'physique.bust').reason).toMatch(/slider/);
  expect(row(audit,'physique.bust_scale').status).toBe('included');
  expect(row(audit,'hair.color').status).toBe('included');
  expect(source.physique.bust).toBe('small');
});

test('manual and AI replacement prompts are rechecked instead of trusting compiled metadata', () => {
  const options={dna:dna({hair:{color:'black'},physique:{bust_scale:80}}),promptStyle:'qwen_image'};
  expect(row(check(options),'hair.color').status).toBe('included');
  expect(row(check(options,'Portrait in a red dress'),'hair.color').status).toBe('missing');
  expect(row(check(options,'Portrait in a red dress'),'physique.bust_scale').status).toBe('missing');
});

test('each multi-select item is checked separately', () => {
  const options={dna:dna({scene:{props:['red chair','silver mirror']}}),promptStyle:'qwen_image'};
  const audit=check(options,'Photograph with a red chair');
  expect(row(audit,'scene.props','red chair').status).toBe('included');
  expect(row(audit,'scene.props','silver mirror').status).toBe('missing');
});

test('another person cannot satisfy a missing personal detail, and repeated subject blocks are inspected', () => {
  const options={promptStyle:'qwen_image',subjects:[{label:'A',dna:dna({hair:{color:'black'}})},{label:'B',dna:dna({hair:{color:'black'}})}]};
  const result=compileModelPrompts(options);
  const audit=auditSelectionPrompt('Subject A: black hair; Subject B: adult woman; Subject A appearance: black hair',result.selectionManifest);
  const hair=audit.rows.filter(item=>item.section==='hair' && item.field==='color');
  expect(hair.map(item=>item.status)).toEqual(['included','missing']);
  const updated=auditSelectionPrompt('Subject A: adult woman; Subject B: adult woman; Subject A appearance: black hair; Subject B appearance: black hair',result.selectionManifest);
  expect(updated.rows.filter(item=>item.section==='hair' && item.field==='color').every(item=>item.status==='included')).toBe(true);
});

test('full sets, competing hand poses and implant controls report inactive selections with reasons', () => {
  const source=dna({wardrobe:{outfit_mode:'full',outfit_set:'tailored pantsuit',top:'blouse'},pose:{action:'standing hands on hips',hands:['at sides']},physique:{bust_scale:80,bust_shape:'natural',implant_volume:1000}});
  const audit=check({dna:source,promptStyle:'qwen_image'});
  expect(row(audit,'wardrobe.top').status).toBe('inactive');
  expect(row(audit,'pose.hands').reason).toMatch(/placement/);
  expect(row(audit,'physique.bust_scale').reason).toMatch(/implant/);
  expect(row(audit,'physique.bust_shape').status).toBe('inactive');
  expect(row(audit,'physique.implant_volume').status).toBe('included');
});

test('custom library wording is audited without replacing the selected display name', () => {
  const config={sections:[{key:'hair',title:'Hair',fields:[{key:'color',label:'Color',type:'chips',options:[{value:'custom_blue',label:'Azure',keywords:'azure blue hair',group:''}]}]}]};
  const audit=check({dna:dna({hair:{color:'custom_blue'}}),promptStyle:'qwen_image',promptCatalog:config});
  expect(row(audit,'hair.color').value).toBe('Azure');
  expect(row(audit,'hair.color').status).toBe('included');
});

test('compact output audits the compact phrase rather than the longer default wording', () => {
  const config={sections:[{key:'hair',title:'Hair',fields:[{key:'color',label:'Color',type:'chips',options:[{value:'black',label:'Black',keywords:'long detailed raven black hair description',short:'raven locks',group:''}]}]}]};
  const options={dna:dna({hair:{color:'black'}}),promptStyle:'qwen_image',promptFormat:'compact',promptCatalog:config};
  const audit=check(options);
  expect(row(audit,'hair.color').expected).toBe('raven locks');
  expect(row(audit,'hair.color').status).toBe('included');
  expect(row(check(options,'Portrait with black hair'),'hair.color').status).toBe('missing');
});

test('compact cast and gender wording is recognized and zero size sliders remain inactive', () => {
  const audit=check({dna:dna({identity:{age:30,gender:'female'},scenario:{cast_size:'solo'},physique:{bust_scale:0}}),promptStyle:'qwen_image',promptFormat:'compact'});
  expect(row(audit,'identity.gender').status).toBe('included');
  expect(row(audit,'scenario.cast_size').status).toBe('included');
  expect(row(audit,'physique.bust_scale').status).toBe('inactive');
});

test('an adjusted render style is identified instead of marking the original style included', () => {
  const audit=check({dna:dna({style:{render:'octane'}}),promptStyle:'qwen_image'});
  expect(row(audit,'style.render').status).toBe('inactive');
  expect(row(audit,'style.render').reason).toContain('photorealistic');
});

test('unrelated numbers and short substrings do not satisfy slider or wording checks', () => {
  const source=dna({physique:{bust_scale:80}});
  expect(row(check({dna:source,promptStyle:'qwen_image'},'An 80-year-old person with skin glow 80/100'),'physique.bust_scale').status).toBe('missing');
  const manifest=[{key:'test',terms:['red hair'],expected:'red hair'}];
  expect(auditSelectionPrompt('infrared hairstyle',manifest).counts.missing).toBe(1);
});

test('direct image edits do not pretend to audit reference image details', () => {
  const result=compileModelPrompts({dna:dna({hair:{color:'black'}}),promptStyle:'qwen_edit',workflowKind:'edit',editInstruction:'Adjust the lighting'});
  expect(result.selectionManifest).toBeUndefined();
});

test('empty selections and compiler-only fields do not inflate the checklist', () => {
  const sections=[{key:'identity',title:'Identity',fields:[{key:'name',label:'Name'}]},{key:'style',title:'Style',fields:[{key:'anatomy_mode',label:'Mode'}]},{key:'hair',title:'Hair',fields:[{key:'color',label:'Color'}]}];
  const source={dna:{identity:{name:'A'},style:{anatomy_mode:'natural'},hair:{color:''}}};
  expect(buildSelectionManifest({sources:[source],prepared:[source],resolved:[source],sections})).toEqual([]);
});
