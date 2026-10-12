import { SIMPLE_COVERAGE_OPTIONS } from './simpleCoverage';
import {SECTIONS,DEFAULT_DNA,buildPrompts} from './dna';
import {wardrobeGroups} from './wardrobeLayout';
import {resolveBuilderControls} from './builderControlResolution';
import {editWardrobeField} from './wardrobeMode';
import {compileModelPrompts} from './modelPromptCompilers';
import {catalogSections,exportPromptLibrary} from './promptCatalog';
const dna=wardrobe=>({...DEFAULT_DNA,wardrobe:{outfit_mode:'custom',exposure_mode:'use selected outfit',...wardrobe}});
test('groups every wardrobe field once and retains custom fields',()=>{
  const fields=SECTIONS.find(s=>s.key==='wardrobe').fields;
  const groups=wardrobeGroups([...fields,{key:'custom_fabric_detail',label:'Extra fabric'}]);
  expect(groups.flatMap(group=>group.fields.map(field=>field.key)).sort()).toEqual([...fields.map(field=>field.key),'custom_fabric_detail'].sort());
  expect(groups.at(-1).key).toBe('other');
});
test('the most recently selected garment wins without erasing saved pieces',()=>{
  const old={outfit_mode:'custom',skirt_style:'mini skirt',dress_style:'sundress',top:'blouse'};
  const pants=editWardrobeField(old,'bottom','jeans');
  expect(pants.skirt_style).toBe('mini skirt');
  expect(resolveBuilderControls(dna(pants)).dna.wardrobe).toMatchObject({bottom:'jeans',skirt_style:'',dress_style:''});
  const skirt=editWardrobeField(pants,'skirt_style','pencil skirt');
  expect(resolveBuilderControls(dna(skirt)).dna.wardrobe).toMatchObject({skirt_style:'pencil skirt',dress_style:'',bottom:''});
  expect(old.bottom).toBeUndefined();
});
test.each([['jeans','trouser hems'],['denim shorts','shorts hems']])('riding up with %s never creates skirt wording', (bottom,wording)=>{
  const source=dna({bottom,state:'riding up'});
  expect(resolveBuilderControls(source).dna.wardrobe.state).toContain(wording);
  expect(source.wardrobe.state).toBe('riding up');
});
test('incompatible authored skirt wording and orphan accessory details stay saved but inactive',()=>{
  const source=dna({bottom:'yoga pants',state:'skirt hem lifted above hips',underwear:'none',heel_color:'red',hosiery_pattern:'back seam',glasses_color:'gold'});
  const result=resolveBuilderControls(source);
  expect(result.dna.wardrobe).toMatchObject({state:'',heel_color:'',hosiery_pattern:'',glasses_color:''});
  expect(result.notes.some(note=>note.field==='state')).toBe(true);
  expect(source.wardrobe.state).toContain('skirt');
  expect(resolveBuilderControls(dna({top:'blouse',underwear:'none',state:'panties pulled aside'})).dna.wardrobe.state).toBe('');
});
test.each(['standard','chroma','krea2','pony','sdxl','qwen_image','wan_t2v','zimage'])('%s omits conflicting authored state from actual render prompts',promptStyle=>{
  const source=dna({bottom:'yoga pants',state:'custom_skirt_state'});
  const promptCatalog={sections:[{key:'wardrobe',title:'Wardrobe',fields:[{key:'state',label:'State',type:'chips',options:[{value:'custom_skirt_state',label:'Skirt lift',keywords:'skirt hem lifted above hips',group:''}]}]}]};
  expect(compileModelPrompts({promptStyle,dna:source,promptCatalog}).positive).not.toContain('skirt hem lifted');
  const builtIn=compileModelPrompts({promptStyle,dna:dna({bottom:'yoga pants',state:'riding up'}),promptCatalog:{sections:[]}}).positive;
  expect(builtIn).not.toMatch(/\bskirt\b/i);
});
test('retired Kink is ignored independently for every subject',()=>{
  const subjects=['A','B'].map(label=>({label,dna:{...dna({bottom:'jeans'}),kink:{restraint:[`retired marker ${label}`]}}}));
  expect(compileModelPrompts({promptStyle:'standard',subjects,promptCatalog:{sections:[]}}).positive).not.toContain('retired marker');
  expect(subjects[1].dna.kink.restraint).toEqual(['retired marker B']);
});
test.each(['standard','chroma','krea2','pony','sdxl','qwen_image','wan_t2v','zimage'])('%s ignores retired Kink from saved recipes and imported catalogs',promptStyle=>{
  const source={...dna({bottom:'jeans'}),kink:{restraint:['custom_retired'],custom_note:'custom_retired'}};
  const promptCatalog={sections:[{key:'kink',title:'Kink',fields:[{key:'custom_note',label:'Old detail',type:'chips',options:[{value:'custom_retired',label:'Old',keywords:'retired restraint marker',group:''}]}]}]};
  expect(catalogSections(SECTIONS,promptCatalog).some(s=>s.key==='kink')).toBe(false);
  expect(exportPromptLibrary(SECTIONS,promptCatalog).sections.some(s=>s.key==='kink')).toBe(false);
  expect(compileModelPrompts({promptStyle,dna:source,promptCatalog}).positive).not.toMatch(/retired restraint|custom_retired/);
  expect(source.kink.custom_note).toBe('custom_retired');
});
test('the direct prompt builder also ignores old Kink selections',()=>{
  expect(buildPrompts({...dna({}),kink:{restraint:['retired restraint marker']}}).positive).not.toContain('retired restraint');
});

test.each(SIMPLE_COVERAGE_OPTIONS.map(option => [option.label, option.value]))('%s coverage overrides saved clothing state before garment resolution', (label, exposure_mode) => {
  const source = dna({ bottom: 'jeans', top: 'cotton blouse', state: 'riding up', exposure_mode });
  const original = JSON.stringify(source);
  const result = resolveBuilderControls(source);
  expect(result.dna.wardrobe.state).toBe('');
  expect(result.notes.some(note => note.field === 'state' && note.text.includes('Clothing coverage overrides Clothing state'))).toBe(true);
  expect(JSON.stringify(source)).toBe(original);
});
test.each(['compact','detailed'])('active coverage suppresses authored state across image compilers in %s format', promptFormat => {
  const source = dna({ bottom: 'jeans', top: 'cotton blouse', state: 'custom_saved_state', exposure_mode: 'custom_coverage_unzipped' });
  const promptCatalog = { sections: [{ key: 'wardrobe', title: 'Wardrobe', fields: [{ key: 'state', label: 'State', type: 'chips', options: [{ value: 'custom_saved_state', label: 'Saved state', keywords: 'SAVED_STATE_MARKER' }] }] }] };
  for (const promptStyle of ['standard','chroma','krea2','pony','sdxl','qwen_image','zimage']) {
    const result = compileModelPrompts({ dna: source, promptStyle, promptFormat, promptCatalog });
    expect(result.positive).not.toContain('SAVED_STATE_MARKER');
    expect(result.positive).toContain('zipper open');
    source.wardrobe.exposure_mode = 'use selected outfit';
    expect(compileModelPrompts({ dna: source, promptStyle, promptFormat, promptCatalog }).positive).toContain('SAVED_STATE_MARKER');
    source.wardrobe.exposure_mode = 'custom_coverage_unzipped';
  }
  expect(source.wardrobe.state).toBe('custom_saved_state');
});
test('cleared coverage restores compatible clothing state without editing the saved state', () => {
  const source = dna({ bottom: 'jeans', state: 'riding up', exposure_mode: '' });
  expect(resolveBuilderControls(source).dna.wardrobe.state).toContain('trouser hems');
  expect(source.wardrobe.state).toBe('riding up');
});
