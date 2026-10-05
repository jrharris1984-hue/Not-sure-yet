const canonical = (value) => {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") return Object.fromEntries(
    Object.keys(value).filter((key) => key !== "_meta").sort().map((key) => [key, canonical(value[key])])
  );
  return value;
};

// Different checkpoints, LoRAs, sampling settings and actions remain distinct.
// Only identical executable graphs AND prompt bindings count as duplicates.
export function workflowFingerprint(workflow) {
  try {
    const graph = JSON.parse(workflow.json_str);
    if (!graph || Array.isArray(graph) || typeof graph !== "object" || !Object.keys(graph).length) return null;
    return JSON.stringify([workflow.kind, workflow.prompt_style, workflow.positive_node_id,
      workflow.negative_node_id, canonical(graph)]);
  } catch { return null; }
}

export function workflowCatalog(workflows = [], preferredId = "") {
  const representatives = new Map();
  for (const workflow of [...workflows].sort((a, b) => Number(b.id === preferredId) - Number(a.id === preferredId))) {
    const fingerprint = workflowFingerprint(workflow);
    if (fingerprint && !representatives.has(fingerprint)) representatives.set(fingerprint, workflow);
  }
  const primary = [], internal = [], redundant = [];
  for (const workflow of workflows) {
    const representative = representatives.get(workflowFingerprint(workflow));
    if (representative && representative.id !== workflow.id) {
      redundant.push({ ...workflow, catalogReason: `Exact copy of ${representative.name}` });
    } else if (workflow.kind === "krea_style" && workflow.name === "Krea 2 Turbo · Private Magazine"
      && workflows.some((item) => item.kind === "image" && item.prompt_style === "krea2")) {
      redundant.push({ ...workflow, catalogReason: "Legacy style preset. Use Krea 2 Turbo and select the Private Magazine LoRA." });
    } else if (["pose", "refine"].includes(workflow.kind)) {
      internal.push({ ...workflow, catalogReason: "Internal Pose Assist stage; used automatically by Pose Assist." });
    } else primary.push(workflow);
  }
  return { primary, internal, redundant };
}

export function selectableCatalogWorkflows(workflows, preferredId, activeId) {
  const primary = workflowCatalog(workflows, preferredId).primary
    .filter((workflow) => !["pose", "refine", "krea_style"].includes(workflow.kind));
  const active = workflows.find((workflow) => workflow.id === activeId);
  // Opening an old saved recipe can still select its original graph by ID.
  if (active && !["pose", "refine", "krea_style"].includes(active.kind)
    && !primary.some((workflow) => workflow.id === activeId)) {
    primary.push({ ...active, name: `${active.name} · saved recipe` });
  }
  return primary;
}


// Visibility only applies to the character builder. Recipe and dedicated tool
// entry points can retain an explicitly requested workflow.
export function builderCatalogWorkflows(workflows, preferredId, activeId, hiddenIds = [], retainActive = false) {
  const hidden = new Set(hiddenIds);
  return selectableCatalogWorkflows(workflows, preferredId, activeId)
    .filter(workflow => !hidden.has(workflow.id) || (retainActive && workflow.id === activeId));
}
