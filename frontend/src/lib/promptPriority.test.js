import { buildPromptPriorityPlan, prioritizePrompt } from './promptPriority';

test('budget trimming retains each selected complete outfit clause before optional details', () => {
  const dna = {identity:{age:72, gender:'female'}, wardrobe:{outfit_set:'navy pantsuit, white blouse, black shoes', exposure_mode:'slightly revealing'}};
  const plan = buildPromptPriorityPlan({dna});
  const base = '72-year-old adult, female adult subject, studio background, soft illumination, navy pantsuit, white blouse, black shoes, selected outfit with modestly revealing coverage';
  const result = prioritizePrompt(base, plan, 'sdxl', {budgetWords:10});
  for (const phrase of ['navy pantsuit','white blouse','black shoes','selected outfit with modestly revealing coverage']) expect(result.positive).toContain(phrase);
  expect(result.positive).not.toContain('studio background');
  expect(dna.wardrobe).not.toHaveProperty('exposure_direction');
});
