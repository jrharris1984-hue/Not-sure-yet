import { compileModelPrompts, resolvePromptCompiler } from './modelPromptCompilers';
import { getRenderRecipe } from './renderRecipes';
import { applyPhotographicGuidance } from './photographicGuidance';

export const CHARACTER_PREVIEW_SEED = 184729;
export const CHARACTER_PREVIEW_DRAFT_KEY = 'ultra-studio-character-preview-lab-v1';
export const CHARACTER_PREVIEW_JOB_KEY = 'ultra-studio-character-preview-job-v1';
export const CHARACTER_CAPTURE_JOB_KEY = 'ultra-studio-character-capture-job-v1';
export const CHARACTER_PREVIEW_OPTIONS_KEY = 'ultra-studio-character-preview-options-v1';

export function validPreviewSeed(seed) {
  return String(seed).trim() !== '' && Number.isInteger(Number(seed)) && Number(seed) >= 0 && Number(seed) <= 2147483646;
}
export function nextPreviewSeed(current) {
  const value = Math.floor(Math.random() * 2147483647);
  return value === Number(current) ? (value + 1) % 2147483647 : value;
}
export const characterPreviewRequestKey = (payload, workflow) => JSON.stringify([payload, workflow?.json_str]);

// Restrict AI patches to the lab's known fields and preserve both kinds of locks.
export function previewAiChanges(dna, suggestion, sections, locks = {}, fieldLocks = {}) {
  return sections.flatMap(section => {
    const patch = suggestion?.[section.key];
    if (locks[section.key] || !patch || typeof patch !== 'object' || Array.isArray(patch)) return [];
    return section.fields.flatMap(field => {
      let value = patch[field.key];
      if (fieldLocks[section.key]?.[field.key] || value == null || JSON.stringify(value) === JSON.stringify(dna[section.key]?.[field.key])) return [];
      const previous = dna[section.key]?.[field.key] ?? field.defaultValue;
      const numeric = typeof previous === 'number' || field.type === 'slider';
      if (numeric && typeof value === 'string' && value.trim() !== '') value = Number(value);
      if (Array.isArray(previous) || field.type === 'chips_multi'  ? !Array.isArray(value) || value.some(item => typeof item !== 'string')
        : numeric ? typeof value !== 'number' || !Number.isFinite(value)
          : typeof value !== 'string') return [];
      return [{ section: section.key, field: field.key, label: `${section.title} · ${field.label}`, previous, value }];
    });
  });
}
export function applyPreviewAiChanges(dna, changes, locks = {}, fieldLocks = {}) {
  const next = { ...dna };
  changes.forEach(({ section, field, value }) => {
    if (!locks[section] && !fieldLocks[section]?.[field]) next[section] = { ...next[section], [field]: value };
  });
  return next;
}

export function previewWorkflows(workflows = []) {
  return workflows.filter(workflow => ['image', 'pony'].includes(workflow.kind));
}

export function characterPreviewPayload({ dna, workflow, promptCatalog, lora = {}, locks = {}, fieldLocks = {}, seed = CHARACTER_PREVIEW_SEED, capture = false, qualityTier = 'quality' }) {
  if (!workflow || !previewWorkflows([workflow]).length) throw new Error('Choose a still-image workflow for the preview.');
  const compiled = compileModelPrompts({ dna, promptCatalog, promptStyle: workflow.prompt_style,
    workflowKind: workflow.kind, workflowName: workflow.name, promptFormat: 'compact', sectionLocks: locks, fieldLocks });
  const prompts = applyPhotographicGuidance({ ...compiled, enabled: workflow.prompt_style !== 'pony' });
  if (!validPreviewSeed(seed)) throw new Error('Seed must be a whole number from 0 to 2147483646.');
  const recipeStyle = workflow.prompt_style === 'krea2_aio' ? 'krea2_aio' : resolvePromptCompiler({ promptStyle: workflow.prompt_style, workflowKind: workflow.kind, workflowName: workflow.name });
  const tier = capture ? (qualityTier === 'balanced' ? 'balanced' : 'quality') : 'draft';
  const recipe = getRenderRecipe(recipeStyle, tier);
  const scale = capture ? 1 : Math.min(1, 640 / Math.max(recipe.width, recipe.height));
  const triggers = lora.name ? lora.triggerWords || [] : [];
  const positive = triggers.reduce((text, trigger) => text.toLowerCase().includes(trigger.toLowerCase()) ? text : `${trigger}, ${text}`, prompts.positive);
  return {
    dna, subjects: [{ label: 'A', dna, field_locks: fieldLocks }], locks, workflow_id: workflow.id,
    prompt_positive: positive, prompt_negative: prompts.negative,
    seed: Number(seed), batch_size: 1,
    width: Math.max(256, Math.round(recipe.width * scale / 64) * 64),
    height: Math.max(256, Math.round(recipe.height * scale / 64) * 64),
    steps: recipe.steps, cfg: recipe.cfg, sampler_name: recipe.sampler, scheduler: recipe.scheduler,
    quality_tier: tier, operation: capture ? 'character_capture' : 'character_preview', hidden_from_gallery: !capture,
    selected_lora_name: lora.name || '', selected_lora_strength: lora.strength ?? 0.8,
    selected_lora_triggers: triggers,
    selected_loras: lora.name ? [{ name: lora.name, strength: lora.strength ?? 0.8, triggers }] : [],
  };
}
