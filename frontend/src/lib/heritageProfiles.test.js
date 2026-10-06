import { HERITAGE_GROUPS, HERITAGE_PROFILES, heritagePrompt, heritageLabel } from './heritageProfiles';
import { SECTIONS, HERITAGE_PRESETS, buildPrompts, DEFAULT_DNA } from './dna';
import { expandPrompt } from './promptMap';
import { buildPonyPrompts } from './ponyPrompts';
import { catalogSections } from './promptCatalog';

test('every heritage is unique, selectable, searchable and has a prompt description', () => {
  const keys = HERITAGE_GROUPS.flatMap(group => group.options);
  expect(new Set(keys).size).toBe(keys.length);
  expect(keys.length).toBeGreaterThan(90);
  for (const key of keys) {
    expect(HERITAGE_PROFILES[key].description).toBeTruthy();
    expect(HERITAGE_PRESETS.find(preset => preset.dna.identity.ethnicity === key)?.description).toBe(HERITAGE_PROFILES[key].description);
    expect(expandPrompt('identity', 'ethnicity', key)).toBe(HERITAGE_PROFILES[key].description);
  }
  expect(SECTIONS.find(section => section.key === 'identity').fields.find(field => field.key === 'ethnicity').groups).toEqual(HERITAGE_GROUPS);
});

test('new groups and all requested additions are covered', () => {
  for (const key of ['kazakh','uzbek','mongolian','malaysian','burmese','kenyan','ghanaian','south african','greek','portuguese','dutch','scottish','mayan','aztec','inca','native brazilian','jamaican','haitian','trinidadian','ashkenazi','sephardic','mizrahi','armenian','georgian','hapa','chindian']) expect(HERITAGE_PROFILES[key]).toBeDefined();
});

test('explicit appearance overrides heritage hints without mutating DNA or forcing gender', () => {
  const dna = { identity: { gender: 'male', ethnicity: 'nordic' }, skin: { tone: 'deep brown' }, hair: { color: 'black' }, face: { eye_color: 'brown' }, physique: { height: 'petite' } };
  const original = JSON.stringify(dna);
  expect(heritagePrompt('nordic', dna)).toBe('Nordic heritage');
  expect(JSON.stringify(dna)).toBe(original);
  expect(heritagePrompt('nordic')).toContain('blue eyes');
  for (const build of [buildPrompts, buildPonyPrompts]) {
    const prompt = build(dna).positive;
    expect(prompt).toContain('Nordic heritage');
    expect(prompt).not.toContain('blonde hair');
    expect(prompt).not.toContain('blue eyes');
    expect(prompt).not.toContain('very fair skin');
    expect(prompt).not.toContain('tall stature');
  }
});

test('presets preserve current character fields and display modern names for legacy keys', () => {
  const preset = HERITAGE_PRESETS.find(preset => preset.dna.identity.ethnicity === 'kazakh');
  expect(preset.dna).toEqual({ identity: { ethnicity: 'kazakh' } });
  expect(heritageLabel('mulatto')).toBe('Mixed Black / European');
  expect(heritageLabel('inca')).toBe('Quechua / Andean');
  expect(expandPrompt('identity','ethnicity','custom_heritage')).toBe('custom_heritage');
  expect(HERITAGE_PROFILES.korean.description).not.toContain('minimal pores');
});

test('a customized catalog retains all built-in heritage options and labels', () => {
  const identity = SECTIONS.find(section => section.key === 'identity');
  const configured = catalogSections(SECTIONS, { sections: [{ key: 'identity', title: 'Identity', fields: [{ key: 'ethnicity', label: 'Heritage', type: 'chips', options: [{value:'mexican',label:'Mexican',keywords:'',group:'Latin'}] }] }] });
  const field = configured.find(section => section.key === 'identity').fields.find(field => field.key === 'ethnicity');
  expect(field.groups.flatMap(group => group.options)).toContain('kazakh');
  expect(field.optionLabels.mulatto).toBe('Mixed Black / European');
});
