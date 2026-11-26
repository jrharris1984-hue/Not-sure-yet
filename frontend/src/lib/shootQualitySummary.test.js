import { summarizeShootQuality } from './shootQualitySummary';

test('aggregates misses by detail and lists frames with review gaps', () => {
  const result = summarizeShootQuality([
    {output_files:['a'],alignment_review:{missing:[{category:'pose',detail:'turned profile'}],uncertain:['face'] }},
    {output_files:['b'],alignment_review:{missing:[{category:'pose',detail:'Turned Profile'}]}},
    {output_files:['c']},
    null,
  ]);
  expect(result.completed).toBe(3);
  expect(result.reviewed).toBe(2);
  expect(result.unreviewed).toEqual([2]);
  expect(result.missingFrames).toEqual([0,1]);
  expect(result.repeatedMisses).toEqual([{category:'pose',detail:'turned profile',frames:[0,1]}]);
  expect(result.uncertainCount).toBe(1);
});

test('ignores empty render slots and enhanced media counts as completed', () => {
  expect(summarizeShootQuality([null,{output_variants:{enhanced:['image']}}]).completed).toBe(1);
});
