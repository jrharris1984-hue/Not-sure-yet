import { DEFAULT_DNA } from './dna';
import { compileModelPrompts } from './modelPromptCompilers';
import { validateCatalogDraft } from './promptCatalog';
const copy = x => JSON.parse(JSON.stringify(x));
const portrait = () => {
  const dna = copy(DEFAULT_DNA);
  for (const section of Object.values(dna)) for (const key of Object.keys(section)) if (typeof section[key] === 'number') section[key] = 0;
  dna.identity = {...dna.identity, age:72, gender:'female'};
  dna.hair = {...dna.hair, color:'silver', style:'bob'};
  dna.face.eye_color = 'brown';
  dna.wardrobe = {...dna.wardrobe, outfit_mode:'full', outfit_set:'navy pantsuit with white blouse', set_lingerie_mode:'none', exposure_mode:'use selected outfit'};
  dna.pose = {...dna.pose, action:'standing arms loosely crossed', hands:'on hips', distance:'full body'};
  dna.scene.environment = 'studio';
  dna.lighting.source = 'softbox';
  return dna;
};
const families = ['qwen_rapid','qwen_image','chroma','krea2','zimage','flux2_klein','sdxl','pony'];

test.each(families)('%s builds shorter ordered output with resolved age, outfit and pose', promptStyle => {
  const dna = portrait();
  const before = JSON.stringify(dna);
  const result = compileModelPrompts({dna, promptStyle, promptFormat:'compact'});
  expect(result.profile).toBe('compact-narrative-v1');
  expect(result.positive).toContain('72-year-old adult woman');
  expect(result.positive).toMatch(/wrinkles|facial lines/);
  expect(result.positive).toContain('silver hair');
  expect(result.positive).toContain('bob hairstyle');
  expect(result.positive).toContain('brown eyes');
  expect(result.positive).toContain('navy pantsuit with white blouse');
  expect(result.positive).toContain('standing arms loosely crossed');
  expect(result.positive).not.toContain('hands on hips');
  expect(result.positive).toContain('full body framing');
  expect(result.positive).toContain('studio setting');
  expect(result.promptWords).toBeLessThan(result.detailedPromptWords);
  expect(result.promptBudget).toBeNull();
  expect(result.positive).not.toMatch(/undefined|NaN|\[object Object\]/);
  expect(JSON.stringify(dna)).toBe(before);
});

test('custom keywords stay intact until the user provides compact wording; weights are preserved', () => {
  const dna = portrait();
  const options = [{value:'silver', label:'Silver', keywords:'silver hair, metallic highlights, softly illuminated strands', short:'(silver bob with metallic highlights:1.2)', short_tags:'(silver_hair:1.2), bob_cut'}];
  const promptCatalog = {sections:[{key:'hair',title:'Hair',fields:[{key:'color',label:'Color',type:'chips',options}]}]};
  const compact = compileModelPrompts({dna,promptCatalog,promptStyle:'qwen_rapid',promptFormat:'compact'});
  expect(compact.positive).toContain(options[0].short);
  const tags = compileModelPrompts({dna,promptCatalog,promptStyle:'pony',promptFormat:'compact'});
  expect(tags.positive).toContain(options[0].short_tags);
  delete options[0].short; delete options[0].short_tags;
  expect(compileModelPrompts({dna,promptCatalog,promptStyle:'qwen_rapid',promptFormat:'compact'}).positive).toContain(options[0].keywords);
});

test('separate people retain their own hair, age and outfit', () => {
  const a = portrait(), b = portrait();
  b.identity = {...b.identity,age:26,gender:'male'};
  b.hair.color='black'; b.wardrobe.outfit_set='gray suit with blue shirt';
  const result=compileModelPrompts({dna:a,subjects:[{label:'A',dna:a},{label:'B',dna:b}],promptStyle:'qwen_rapid',promptFormat:'compact'});
  const start=result.positive.indexOf('Subject A: 72-year-old adult woman',result.positive.indexOf('Exactly'));
  // The initial cast contract is followed by independently scoped descriptions.
  const descriptions=result.positive.slice(result.positive.indexOf('Subject A: 72-year-old adult woman',start+1));
  const [personA,personB]=descriptions.split('Subject B:');
  expect(personA).toContain('silver hair');expect(personA).not.toContain('black hair');
  expect(personB).toContain('26-year-old adult man');expect(personB).toContain('gray suit with blue shirt');
  expect(personB).not.toContain('navy pantsuit');
});

test.each(['qwen_edit','wan_i2v','wan_t2v'])('%s keeps instruction and motion compilation unchanged', promptStyle => {
  const options={dna:portrait(),promptStyle,editInstruction:'Change the background to a studio',videoInstruction:'Slow camera pan'};
  expect(compileModelPrompts({...options,promptFormat:'compact'})).toEqual(compileModelPrompts(options));
});

test('rules and custom categories remain in compact output', () => {
  const dna=portrait();dna.custom_atmosphere={custom_weather:'custom_mist'};
  const promptCatalog={sections:[{key:'custom_atmosphere',fields:[{key:'custom_weather',type:'chips',options:[{value:'custom_mist',label:'Mist',keywords:'thin morning mist',short:'morning mist'}]}]}],rules:[{enabled:true,kind:'positive',scope:'image',text:'Preserve the selected facial identity'}]};
  const r=compileModelPrompts({dna,promptCatalog,promptStyle:'qwen_rapid',promptFormat:'compact'});
  expect(r.positive).toContain('morning mist');expect(r.positive).toContain('Preserve the selected facial identity');
});

test('compact wording validation rejects wrong types and oversize values', () => {
  const option={value:'silver',label:'Silver',keywords:'',group:'',short:'silver hair'};
  const draft={sections:[{key:'hair',title:'Hair',fields:[{key:'color',label:'Color',type:'chips',options:[option]}]}]};
  expect(validateCatalogDraft(draft)).toBe(draft);
  for (const short of [12,null,'x'.repeat(501)]) {
    option.short=short;
    expect(()=>validateCatalogDraft(draft)).toThrow();
  }
});

test('explicit no-bangs and no-freckles selections remain in compact output', () => {
  const dna=portrait();dna.hair.bangs='none';dna.skin.freckles='none';
  const result=compileModelPrompts({dna,promptStyle:'qwen_rapid',promptFormat:'compact'});
  expect(result.positive).toContain('no bangs');expect(result.positive).toContain('no freckles');
});

test('a legacy duo recipe retains its requested count without explicit cast objects', () => {
  const dna=portrait();dna.scenario.cast_size='duo';
  expect(compileModelPrompts({dna,promptStyle:'qwen_rapid',promptFormat:'compact'}).positive).toContain('exactly 2 adult people');
});


test('compact physique wording uses the shared keyword resolver', () => {
  const dna = portrait();
  dna.physique.shoulders = 'custom_shoulders';
  dna.physique.height = 'average';
  const promptCatalog = { sections: [{ key: 'physique', title: 'Physique', fields: [{
    key: 'shoulders', label: 'Shoulders', type: 'chips', options: [{
      value: 'custom_shoulders', label: 'Broad shoulders', keywords: 'broad shoulders',
      short: 'tall stature, broad shoulders',
    }],
  }] }] };
  const result = compileModelPrompts({ dna, promptCatalog, promptStyle: 'qwen_rapid', promptFormat: 'compact' });
  expect(result.positive).toContain('broad shoulders');
  expect(result.positive).not.toContain('tall stature');
});
