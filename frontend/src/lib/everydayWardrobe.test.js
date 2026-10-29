import { expandEverydayWardrobe } from './everydayWardrobe';
import { SECTIONS } from './dna';
import catalog from './everydayWardrobeCatalog.json';

test('adds all everyday choices once without changing existing defaults or labels', () => {
  const section = { key: 'wardrobe', fields: [{ key: 'top', defaultValue: 't-shirt', optionLabels: { 't-shirt': 'My shirt' }, options: ['t-shirt', 'custom top'] }] };
  const original = JSON.stringify(section);
  const result = expandEverydayWardrobe(section);
  expect(JSON.stringify(section)).toBe(original);
  const field = result.fields[0];
  expect(field.options.filter(value => value === 't-shirt')).toHaveLength(1);
  expect(field.options).toContain('custom top');
  expect(field.defaultValue).toBe('t-shirt');
  expect(field.optionLabels['t-shirt']).toBe('My shirt');
  expect(expandEverydayWardrobe(result)).toEqual(result);
});

test('schema exposes every added garment in searchable groups', () => {
  const wardrobe = SECTIONS.find(section => section.key === 'wardrobe');
  Object.entries(catalog).forEach(([key, groups]) => {
    const field = wardrobe.fields.find(item => item.key === key);
    Object.values(groups).flat().forEach(value => expect(field.groups.flatMap(group => group.options)).toContain(value));
    expect(new Set(field.options).size).toBe(field.options.length);
  });
});
