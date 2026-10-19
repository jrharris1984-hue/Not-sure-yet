import {SECTIONS} from './dna';
import {BODY_GROUPS} from './workspaceFields';
import {STUDIO_CHARACTER_SECTIONS,INTIMATE_DETAIL_GROUPS,studioFeatureSection,studioFeatureOptions} from './studioFeatures';
test('physical features preserve the entire existing physique catalog',()=>{
  expect(STUDIO_CHARACTER_SECTIONS).toContain('physique');
  expect(studioFeatureSection('physique')).toBe(SECTIONS.find(section=>section.key==='physique'));
  expect(new Set(BODY_GROUPS.flatMap(group=>group.fields))).toEqual(new Set(studioFeatureSection('physique').fields.map(field=>field.key)));
});
test('intimate details expose grouped grooming and non-explicit anatomy controls without mutating the source',()=>{
  expect(STUDIO_CHARACTER_SECTIONS).toContain('intimate');const section=studioFeatureSection('intimate');
  expect(section.fields.map(field=>field.key)).toEqual(expect.arrayContaining(INTIMATE_DETAIL_GROUPS.flatMap(group=>group.fields)));
  expect(section.fields.some(field=>field.key==='cum_state')).toBe(false);
  expect(studioFeatureOptions('intimate','piercings').map(option=>option.value)).not.toContain('labia');
  expect(SECTIONS.find(section=>section.key==='intimate').fields.find(field=>field.key==='piercings').options).toContain('labia');
});
test('new anatomy selections still follow the existing clothing-coverage compiler',()=>{
  const {previewPerson}=require('./workspacePreview');
  const {workspacePrompt}=require('./workspaceGeneration');
  const person=previewPerson();person.dna.intimate={...person.dna.intimate,nipple_size:'small nipple tips'};
  person.dna.wardrobe={...person.dna.wardrobe,outfit_mode:'full',outfit_set:'linen shirt, tailored trousers and leather flats',exposure_mode:'use selected outfit'};
  const prompt=workspacePrompt({mode:'character',workflow:{id:'image',name:'Krea 2',kind:'image',prompt_style:'krea2'},people:[person],relationship:'Choose later'});
  expect(prompt.positive).not.toContain('small nipple tips');
});
test('category directory includes casting and every standard scene category',()=>{
  const {studioCategoryDirectory}=require('./studioFeatures');const directory=studioCategoryDirectory();
  expect(directory.map(item=>item.key)).toEqual(expect.arrayContaining(['identity','physique','intimate','wardrobe','scenario','pose','scene','lighting','camera','style']));
  expect(directory.every(item=>item.fields>0)).toBe(true);expect(new Set(directory.map(item=>item.key)).size).toBe(directory.length);
  expect(studioFeatureSection('scenario').fields.map(field=>field.key)).toContain('cast_age_mode');
});
