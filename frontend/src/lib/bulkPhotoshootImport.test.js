import { parsePhotoshootImport, mergePhotoshootImport, photoshootPresetForExport, PHOTOSHOOT_IMPORT_EXAMPLE } from './bulkPhotoshootImport';
import { photoshootCatalog, buildSmartPhotoshootPlan } from './batchSmartPhotoshoot';

const preset = (key, title = 'Hero') => ({ key, label: 'My shoot', category: 'Custom', description: '', sequence: [{ title, pose_group: '', camera_match: '', framing: 'full body', expression: '' }] });

test('example imports several new shoots and an exact pose', () => {
  const items = parsePhotoshootImport(PHOTOSHOOT_IMPORT_EXAMPLE);
  expect(items).toHaveLength(2); expect(items[1].sequence[0].pose_prompt).toContain('walking');
  expect(new Set(items.map(item => item.key)).size).toBe(2);
  const result = mergePhotoshootImport([], items);
  expect(result.added).toHaveLength(2); expect(result.updated).toHaveLength(0);
});

test('downloaded full library survives JSON roundtrip and unchanged built-ins need no stored overrides', () => {
  const exported = photoshootCatalog().categories.flatMap(category => category.presets).map(photoshootPresetForExport);
  const items = parsePhotoshootImport(JSON.stringify(exported));
  const result = mergePhotoshootImport([], items, 'update');
  expect(result.presets).toHaveLength(0); expect(result.skipped).toHaveLength(exported.length);
  const original = exported.find(item => item.key === 'editorial');
  expect(original.category).toBe('Fashion & Editorial');
  expect(original.sequence[0].camera_match).toContain('3/4');
  expect(original.sequence[0].camera_match).not.toContain('\\/');
});

test('update matching keys preserves unrelated shoots and applies built-in changes in catalog and rendering', () => {
  const existing = [preset('custom_keep'), preset('custom_edit')];
  const imported = [preset('custom_edit', 'Updated'), preset('editorial', 'New editorial hero')];
  const result = mergePhotoshootImport(existing, imported, 'update');
  expect(result.updated).toHaveLength(2); expect(result.presets).toContainEqual(existing[0]);
  const catalog = photoshootCatalog(result.presets);
  const rows = catalog.categories.flatMap(category => category.presets).filter(item => item.key === 'editorial');
  expect(rows).toHaveLength(1); expect(rows[0].sequence[0].title).toBe('New editorial hero');
  expect(catalog.presets.editorial.custom).toBe(true);
  expect(buildSmartPhotoshootPlan({ count: 1, preset: 'editorial', customPresets: result.presets })[0].title).toBe('New editorial hero');
  expect(existing[1].sequence[0].title).toBe('Hero');
});

test('skip and copy policies never overwrite saved or built-in styles', () => {
  const existing = [preset('custom_same'), preset('custom_same_copy_2')];
  const items = [preset('custom_same', 'Changed'), preset('editorial', 'Edited')];
  const skipped = mergePhotoshootImport(existing, items, 'skip');
  expect(skipped.presets).toEqual(existing); expect(skipped.skipped).toHaveLength(2);
  const copied = mergePhotoshootImport(existing, items, 'copy');
  expect(copied.added.map(item => item.key)).toEqual(['custom_same_copy_3', 'editorial_copy_2']);
  expect(copied.presets[0]).toBe(existing[0]);
});

test('snapshots preserve exact choices and settings exports and single objects are accepted', () => {
  const input = preset('custom_exact');
  input.sequence[0] = { ...input.sequence[0], pose_prompt: 'hands on hips', pose_label: 'Hero', camera_pose_angle: 'profile', camera_angle: 'low' };
  const parsed = parsePhotoshootImport(JSON.stringify({ custom_photoshoot_presets: [input] }));
  expect(photoshootPresetForExport(photoshootCatalog(parsed).presets.custom_exact)).toEqual(input);
  expect(parsePhotoshootImport(JSON.stringify(input))).toEqual(parsed);
});

test.each([
  'broken JSON', '[]', JSON.stringify([{ label: 'Missing shots' }]),
  JSON.stringify([preset('same'), preset('same')]),
  JSON.stringify([{ ...preset('bad'), sequence: [{ title: 'Hero', framing: 'not a framing' }] }]),
  JSON.stringify([{ ...preset('bad'), sequence: [{ title: 'Hero', expression: 'unsupported' }] }]),
  JSON.stringify([{ ...preset('bad'), sequence: [{ title: 'Hero', camera_pose_angle: 'front', camera_angle: '' }] }]),
  JSON.stringify([{ ...preset('bad'), sequence: [{ title: 'Hero', pose_prompt: 'x'.repeat(2001) }] }]),
])('malformed imports fail before writing: %s', source => {
  expect(() => parsePhotoshootImport(source)).toThrow();
});

test('capacity is checked against the merged result, including updates and unchanged entries', () => {
  const existing = Array.from({ length: 100 }, (_, index) => preset(`custom_${index}`));
  expect(() => mergePhotoshootImport(existing, [preset('new')])).toThrow('supports 100');
  expect(mergePhotoshootImport(existing, [preset('custom_0', 'Updated')], 'update').presets).toHaveLength(100);
  expect(mergePhotoshootImport(existing, [preset('custom_0')], 'skip').presets).toHaveLength(100);
});

test('valid imported keys that match object property names stay ordinary custom shoots', () => {
  const items = parsePhotoshootImport(JSON.stringify([preset('constructor'), preset('__proto__')]));
  const result = mergePhotoshootImport([], items);
  const catalog = photoshootCatalog(result.presets);
  expect(catalog.categories.flatMap(category => category.presets).filter(item => ['constructor', '__proto__'].includes(item.key))).toHaveLength(2);
});

test('an edited built-in category moves the override once and removing it restores the original', () => {
  const edited = { ...preset('editorial'), category: 'Winter shoots' };
  const catalog = photoshootCatalog([edited]);
  const category = catalog.categories.find(item => item.presets.some(shoot => shoot.key === 'editorial'));
  expect(category.label).toBe('My Shoots · Winter shoots');
  expect(catalog.categories.flatMap(item => item.presets).filter(shoot => shoot.key === 'editorial')).toHaveLength(1);
  expect(photoshootCatalog().presets.editorial.categoryLabel).toBe('Fashion & Editorial');
});
