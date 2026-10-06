export function referenceShootWorkflows(workflows = []) {
  return workflows.filter(w => w.kind === 'edit' && !w.edit_variant && ['qwen_edit', 'qwen_remix'].includes(w.prompt_style));
}

export function shootContinuityDefaults(context, workflows = [], defaultWorkflowId = '') {
  const recipe = context?.recipe || {};
  const references = referenceShootWorkflows(workflows);
  const useReference = !!context?.render_id && references.length > 0;
  const textWorkflows = workflows.filter(w => ['image', 'pony'].includes(w.kind));
  const sourceWorkflow = textWorkflows.find(w => w.id === recipe.workflow_id);
  const workflow = useReference ? references[0] : sourceWorkflow || textWorkflows.find(w => w.id === defaultWorkflowId) || textWorkflows[0];
  return { mode: useReference ? 'reference' : 'text', workflowId: workflow?.id || '',
    seed: recipe.seed ?? '', loras: !useReference && workflow?.id === recipe.workflow_id ? recipe.lora_overrides || {} : {} };
}

export function shootReferencePreview(url, apiBase) {
  if (!url) return '';
  try {
    const parsed = new URL(url, window.location.origin);
    if (parsed.pathname.endsWith('/view') && parsed.searchParams.has('filename')) return `${apiBase}/comfyui/media?${parsed.searchParams}`;
  } catch { /* Preserve other image URLs. */ }
  return url;
}

export function shootReferenceInstruction(description) {
  return `Use the input photo as the identity reference. Preserve the same people, recognizable faces, age, facial structure, hair and body proportions. Change only the requested pose, expression, clothing, lighting, camera and setting. Requested shot: ${description}`;
}
