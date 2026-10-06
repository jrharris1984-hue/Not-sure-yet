import { clothingSequence, DEFAULT_CLOTHING_STAGES } from './shootClothingSequence';
import { shootFrameDna } from './shootFrames';
import { compileModelPrompts } from './modelPromptCompilers';
test('four photos per stage yields 28 ordered frames and respects canonical coverage order', () => {
  const frames = clothingSequence([...DEFAULT_CLOTHING_STAGES].reverse(), 4);
  expect(frames).toHaveLength(28);
  DEFAULT_CLOTHING_STAGES.forEach((stage, index) => expect(frames.slice(index * 4, index * 4 + 4).every(frame => frame.exposure_mode === stage)).toBe(true));
  expect(clothingSequence([], 4)).toHaveLength(0);
});
test('coverage frames preserve the saved complete set and its matching lingerie', () => {
  const base = { identity: { age: 35, gender: 'female' }, wardrobe: { outfit_mode: 'full', outfit_set: 'tailored women’s pantsuit with a matching blouse, handbag and pumps' } };
  const frames = clothingSequence(['lingerie showing', 'lingerie only'], 4);
  const prompts = frames.map(wardrobeOverrides => compileModelPrompts({ promptStyle: 'krea2', dna: shootFrameDna(base, { wardrobeOverrides }) }).positive);
  expect(prompts).toHaveLength(8);
  expect(prompts[0]).toContain('pantsuit'); expect(prompts[0]).toContain('matching satin bra and briefs');
  expect(prompts[4]).not.toContain('pantsuit'); expect(prompts[4]).toContain('matching satin bra and briefs');
  expect(base.wardrobe.exposure_mode).toBeUndefined();
});
