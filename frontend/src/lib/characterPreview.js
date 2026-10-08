import { compileModelPrompts } from './modelPromptCompilers';
import { getRenderRecipe } from './renderRecipes';
import { applyPhotographicGuidance } from './photographicGuidance';

export const CHARACTER_PREVIEW_SEED = 184729;
export const CHARACTER_PREVIEW_DRAFT_KEY = 'ultra-studio-character-preview-lab-v1';
export const CHARACTER_PREVIEW_JOB_KEY = 'ultra-studio-character-preview-job-v1';

export function previewWorkflows(workflows = []) {
  return workflows.filter(workflow => ['image', 'pony'].includes(workflow.kind));
}

export function characterPreviewPayload({ dna, workflow, promptCatalog, lora = {}, locks = {}, fieldLocks = {} }) {
  if (!workflow || !previewWorkflows([workflow]).length) throw new Error('Choose a still-image workflow for the preview.');
  const compiled = compileModelPrompts({ dna, promptCatalog, promptStyle: workflow.prompt_style,
    workflowKind: workflow.kind, workflowName: workflow.name, promptFormat: 'compact', sectionLocks: locks, fieldLocks });
  const prompts = applyPhotographicGuidance({ ...compiled, enabled: workflow.prompt_style !== 'pony' });
  const recipe = getRenderRecipe(workflow.prompt_style, 'draft');
  const scale = Math.min(1, 640 / Math.max(recipe.width, recipe.height));
  const triggers = lora.name ? lora.triggerWords || [] : [];
  const positive = triggers.reduce((text, trigger) => text.toLowerCase().includes(trigger.toLowerCase()) ? text : `${trigger}, ${text}`, prompts.positive);
  return {
    dna, subjects: [{ label: 'A', dna, field_locks: fieldLocks }], locks, workflow_id: workflow.id,
    prompt_positive: positive, prompt_negative: prompts.negative,
    seed: CHARACTER_PREVIEW_SEED, batch_size: 1,
    width: Math.max(256, Math.round(recipe.width * scale / 64) * 64),
    height: Math.max(256, Math.round(recipe.height * scale / 64) * 64),
    steps: recipe.steps, cfg: recipe.cfg, sampler_name: recipe.sampler, scheduler: recipe.scheduler,
    quality_tier: 'draft', operation: 'character_preview', hidden_from_gallery: true,
    selected_lora_name: lora.name || '', selected_lora_strength: lora.strength ?? 0.8,
    selected_lora_triggers: triggers,
    selected_loras: lora.name ? [{ name: lora.name, strength: lora.strength ?? 0.8, triggers }] : [],
  };
}
