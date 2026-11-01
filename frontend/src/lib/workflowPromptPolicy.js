import {normalizePromptStyle} from './promptModelAliases';

// Task capabilities are separate from model sampling profiles. In particular,
// text-to-video must not inherit still-image additions just because it has no source image.
export function workflowPromptPolicy({workflowKind = '', promptStyle = '', compiler = ''} = {}) {
  const kind = String(workflowKind).toLowerCase();
  const style = normalizePromptStyle(promptStyle || compiler);
  const video = ['video','text_video'].includes(kind) || ['wan_i2v','wan_t2v'].includes(style);
  const reference = ['flux2_klein_edit','qwen_reference'].includes(promptStyle);
  const edit = ['edit','enhance'].includes(kind) || style === 'qwen_edit' || reference;
  // MOSS understands direct descriptive sentences; avoid forcing photo-only quality prefixes
  // and a generic negative exclusion list onto every MOSS image style.
  return {task:video ? 'video' : edit ? 'edit' : 'image',
    photographic:!video && !edit && style !== 'moss_image', imageLoras:!video && !reference};
}

export function builderLoraFields(policy, {primary = {}, secondary = null, overrides = {}} = {}) {
  if (!policy.imageLoras) return {lora_overrides:{}, selected_lora_name:'', selected_lora_strength:0.8,
    selected_lora_triggers:[], selected_loras:[]};
  return {lora_overrides:overrides, selected_lora_name:primary.name || '', selected_lora_strength:primary.strength,
    selected_lora_triggers:primary.triggerWords || [],
    selected_loras:[primary,secondary].filter(lora=>lora?.name)
      .map(lora=>({name:lora.name,strength:lora.strength,triggers:lora.triggerWords || []}))};
}

export function generationPromptFields(policy, {positive = '', negative = ''}) {
  return {prompt_positive:positive,prompt_negative:negative,
    ...(policy.task === 'video' ? {video_instruction:positive} : {})};
}
