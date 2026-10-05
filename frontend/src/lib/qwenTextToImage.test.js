import { workflowCatalog } from './workflowCatalog';
import { compileModelPrompts, resolvePromptCompiler } from './modelPromptCompilers';
import { getRenderRecipe, recipeFamily } from './renderRecipes';
import { analyzePromptQuality, promptProfile } from './promptQuality';
import { workflowFamily } from './loraRegistry';
import { DEFAULT_DNA } from './dna';

test.each(['qwen_image', 'qwen_rapid'])('%s is image creation, not reference editing', style => {
  const workflow = { name: 'Qwen text to image', kind: 'image', prompt_style: style };
  expect(resolvePromptCompiler({ promptStyle: style, workflowKind: workflow.kind, workflowName: workflow.name })).toBe(style);
  expect(promptProfile(workflow)).toBe(style);
  expect(recipeFamily(style)).toBe('image');
  const dna = JSON.parse(JSON.stringify(DEFAULT_DNA)); dna.identity.age = 43; dna.pose.angle = 'back';
  const result = compileModelPrompts({ promptStyle: style, workflowKind: 'image', workflowName: workflow.name, dna });
  expect(result.positive).toContain('43');
  expect(result.positive).toContain('camera behind the subject');
  expect(result.positive).not.toContain('Change only');
  if (style === 'qwen_rapid') { expect(result.negative).toBe(''); expect(result.negativeStrategy).toBe('zeroed'); }
  else expect(result.negative.length).toBeGreaterThan(0);
  const review = analyzePromptQuality({ positive: result.positive, negative: result.negative, dna, workflow, context: { subjectCount: 1 } });
  expect(review.blockers.map(b => b.code).join(' ')).not.toMatch(/reference|edit/);
});

test('AGQI and Rapid get their own sampler, scheduler and guidance recipes', () => {
  expect(getRenderRecipe('qwen_image')).toMatchObject({ steps: 40, cfg: 4, sampler: 'euler', scheduler: 'simple' });
  expect(getRenderRecipe('qwen_rapid')).toMatchObject({ steps: 4, cfg: 1, sampler: 'euler_ancestral', scheduler: 'beta' });
  expect(getRenderRecipe('qwen_rapid', 'quality').steps).toBe(8);
});

test('AGQI does not recommend edit-only LoRAs; normal Qwen editing stays an edit', () => {
  expect(workflowFamily({ name: 'Qwen AGQI', prompt_style: 'qwen_image', kind: 'image' })).toBe('qwen_image');
  expect(resolvePromptCompiler({ workflowName: 'Qwen Image Edit 2511', workflowKind: 'edit', promptStyle: 'qwen_edit' })).toBe('qwen_edit');
});

test('custom LoRA workflow stays independently selectable alongside both existing Qwen workflows', () => {
  const entries = [
    ['agqi', 'Qwen 2512 · AGQI V2 FP8', 'qwen_image', require('../../../backend/seed_workflows/qwen_agqi_t2i.json')],
    ['rapid', 'Qwen Rapid AIO v23 · Text to Image', 'qwen_rapid', require('../../../backend/seed_workflows/qwen_rapid_t2i.json')],
    ['custom', 'Qwen 2512 · Custom LoRAs (AGQI)', 'qwen_image', require('../../../backend/seed_workflows/qwen_custom_loras_t2i.json')],
  ].map(([id, name, prompt_style, graph]) => ({id,name,prompt_style,kind:'image',positive_node_id:'5',negative_node_id:'6',json_str:JSON.stringify(graph)}));
  expect(workflowCatalog(entries).primary.map(item => item.id)).toEqual(['agqi','rapid','custom']);
  expect(workflowCatalog(entries).redundant).toEqual([]);
});
