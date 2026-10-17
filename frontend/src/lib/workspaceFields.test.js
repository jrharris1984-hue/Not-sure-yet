import {BODY_GROUPS, workspaceSection, updateWorkspaceField} from './workspaceFields';
import {previewPerson,previewOptions} from './workspacePreview';
import {wardrobeGroups} from './wardrobeLayout';

test('every existing physique and wardrobe field has a reachable category',()=>{
  expect(new Set(BODY_GROUPS.flatMap(group=>group.fields))).toEqual(new Set(workspaceSection('physique').fields.map(field=>field.key)));
  expect(wardrobeGroups(workspaceSection('wardrobe').fields).flatMap(group=>group.fields).map(field=>field.key).sort()).toEqual(workspaceSection('wardrobe').fields.map(field=>field.key).sort());
});
test('complete outfit picker includes every group and preserves option labels',()=>{
  const field=workspaceSection('wardrobe').fields.find(field=>field.key==='outfit_set');
  const options=previewOptions('wardrobe','outfit_set');
  expect(new Set(options.map(option=>option.value))).toEqual(new Set(field.groups.flatMap(group=>group.options)));
  expect(options.some(option=>option.value.includes('superheroine'))).toBe(true);
  expect(options.length).toBeGreaterThan(40);
});
test('size presets deactivate their slider and implant values while slider edits retain the saved preset',()=>{
  let person=previewPerson();person.dna.physique={bust:'medium',bust_scale:50,implant_volume:700};
  person=updateWorkspaceField(person,'physique','bust','small');
  expect(person.dna.physique).toMatchObject({bust:'small',bust_scale:0,implant_volume:0});
  person=updateWorkspaceField(person,'physique','bust_scale',65);
  expect(person.dna.physique).toMatchObject({bust:'small',bust_scale:65,implant_volume:0});
  person=updateWorkspaceField(person,'physique','butt_scale',300);expect(person.dna.physique.butt_scale).toBe(300);
});
test('paired control and wardrobe mode changes cannot erase locked values',()=>{
  const person=previewPerson();person.dna.physique={bust:'medium',implant_volume:700};person.field_locks={physique:{implant_volume:true}};
  expect(updateWorkspaceField(person,'physique','bust','small')).toBe(person);
  person.field_locks={wardrobe:{outfit_mode:true}};person.dna.wardrobe={outfit_mode:'custom',top:'shirt'};
  expect(updateWorkspaceField(person,'wardrobe','outfit_set','a suit')).toBe(person);
});
test('outfit selection activates full-set mode; custom garment edits use existing conflict priority',()=>{
  let person=previewPerson();person=updateWorkspaceField(person,'wardrobe','outfit_set','a suit');
  expect(person.dna.wardrobe.outfit_mode).toBe('full');
  person=updateWorkspaceField(person,'wardrobe','outfit_mode','custom');
  person=updateWorkspaceField(person,'wardrobe','dress_style','evening gown');
  expect(person.dna.wardrobe).toMatchObject({outfit_mode:'custom',dress_style:'evening gown',garment_priority:'dress'});
});
