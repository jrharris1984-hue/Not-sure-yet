import { builderSectionLayout, builderSectionValue, builderSectionChange } from './builderSectionLayout';
import { SECTIONS } from './dna';

test('intensity appears once under pose while saved DNA remains in scenario', () => {
  const layout = builderSectionLayout(SECTIONS);
  expect(layout.filter(section => section.fields.some(field => field.key === 'explicit_level')).map(section => section.key)).toEqual(['pose']);
  const primary = { scenario: { explicit_level: 55, cast_size: 'duo', roleplay: 'none' } };
  const personB = { pose: { action: 'sitting' }, scenario: { explicit_level: 0 } };
  expect(builderSectionValue('pose', personB, primary)).toEqual({ action: 'sitting', explicit_level: 55 });
  expect(builderSectionChange('pose', { action: 'sitting', explicit_level: 70 }, primary)).toEqual({ section:'scenario', value:{ ...primary.scenario, explicit_level:70 } });
  expect(builderSectionChange('pose', { action: 'standing', explicit_level: 55 }, primary)).toEqual({ section:'pose', value:{ action:'standing' } });
  expect(SECTIONS.find(section => section.key === 'scenario').fields.some(field => field.key === 'explicit_level')).toBe(true);
});
