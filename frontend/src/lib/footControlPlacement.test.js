import {SECTIONS} from './dna';
import {FOOT_DESTINATIONS,footDestination,footAppearanceSection,scopedFootEdit} from './footControlPlacement';
const source=SECTIONS.find(section=>section.key==='feet');
test('every built-in field has one destination and custom fields stay reachable',()=>{
  const related=Object.values(FOOT_DESTINATIONS).flatMap(destination=>destination.groups.flatMap(group=>group.fields));
  const appearance=footAppearanceSection(source).fields.map(field=>field.key);
  expect([...related,...appearance].sort()).toEqual(source.fields.map(field=>field.key).sort());
  expect(new Set([...related,...appearance]).size).toBe(source.fields.length);
  expect(footAppearanceSection({...source,fields:[...source.fields,{key:'custom_foot',label:'Custom'}]}).fields.some(field=>field.key==='custom_foot')).toBe(true);
});
test('appearance editing does not reset the moved styling and composition values',()=>{
  const before={arch:'high arch',pedicure:'painted red',composition_mode:'feet focus',framing:'feet close-up',custom_foot:'keep'};
  const result=scopedFootEdit(before,{arch:'flat arch',pedicure:'',composition_mode:'',framing:''},footAppearanceSection(source).fields);
  expect(result).toEqual({...before,arch:'flat arch'});
  expect(before.arch).toBe('high arch');
});
test('specialty mode and direct legacy field requests stay compatible',()=>{
  expect(footAppearanceSection(source,true)).toBe(source);
  expect(footAppearanceSection(source,false,'pedicure').fields.some(field=>field.key==='pedicure')).toBe(true);
  expect(footDestination('pedicure')).toBe('wardrobe');
  expect(footDestination('framing')).toBe('pose');
  expect(footDestination('ground_surface')).toBe('scene');
  expect(source.title).toBe('Feet & styling');
});
