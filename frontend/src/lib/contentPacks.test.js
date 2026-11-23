import { createContentPack, mergeContentPack } from './contentPacks';

const section = {
  key: 'custom_poses', title: 'My poses',
  fields: [{ key: 'custom_standing', label: 'Standing', type: 'chips',
    options: [{ value: 'pose_one', label: 'Pose one', keywords: 'upright stance', group: 'Portrait' }] }],
};

test('content pack export is validated and does not share mutable references', () => {
  const pack = createContentPack(section);
  section.fields[0].options[0].label = 'Edited later';
  expect(pack.section.fields[0].options[0].label).toBe('Pose one');
});

test('importing a new category adds it without changing existing categories', () => {
  const original = { sections: [{ key: 'wardrobe', title: 'Wardrobe', fields: [] }] };
  const result = mergeContentPack(original, createContentPack({
    ...section, fields: [{ ...section.fields[0],
      options: [{ value: 'pose_one', label: 'Pose one', keywords: 'upright stance' }] }],
  }));
  expect(result.added).toBe(1);
  expect(result.catalog.sections).toHaveLength(2);
  expect(original.sections).toHaveLength(1);
});

test('merging a pack preserves installed choices with matching identifiers', () => {
  const installed = { sections: [{ ...section, fields: [{
    ...section.fields[0], options: [{ value: 'pose_one', label: 'Local wording', keywords: 'local prompt' }],
  }] }] };
  const result = mergeContentPack(installed, createContentPack({
    ...section, fields: [{ ...section.fields[0], options: [
      { value: 'pose_one', label: 'Remote wording', keywords: 'remote prompt' },
      { value: 'pose_two', label: 'Pose two', keywords: 'seated' },
    ] }],
  }));
  expect(result).toMatchObject({ added: 1, skipped: 1 });
  expect(result.catalog.sections[0].fields[0].options[0].keywords).toBe('local prompt');
  expect(result.catalog.sections[0].fields[0].options).toHaveLength(2);
});

test('invalid pack format is rejected', () => {
  expect(() => mergeContentPack({ sections: [] }, { section })).toThrow('content pack');
});
