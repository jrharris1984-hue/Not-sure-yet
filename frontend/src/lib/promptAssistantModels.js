export const GEMMA_PROMPT_ASSISTANTS = [
  {
    name: "ultra-big-tiger-gemma:27b",
    source: "hf.co/TheDrummer/Big-Tiger-Gemma-27B-v3-GGUF:Q4_K_M",
    label: "TheDrummer Big Tiger Gemma 27B v3 · Q4_K_M",
  },
  {
    name: "ultra-gemma3-abliterated:27b",
    source: "mdq100/Gemma3-Instruct-Abliterated:27b",
    label: "Gemma 3 27B Instruct Abliterated · Q4_K_M (mdq100)",
  },
];

export const LLAMA_PROMPT_ASSISTANTS = [
  {
    name: "ultra-neuraldaredevil:8b",
    source: "hf.co/QuantFactory/NeuralDaredevil-8B-abliterated-GGUF:Q4_K_M",
    label: "NeuralDaredevil 8B Abliterated · Q4_K_M",
  },
  {
    name: "ultra-dark-champion:18.4b",
    source: "hf.co/DavidAU/Llama-3.2-8X3B-MOE-Dark-Champion-Instruct-uncensored-abliterated-18.4B-GGUF:Q4_K_M",
    label: "Llama 3.2 Dark Champion 8×3B MoE · 18.4B · Q4_K_M",
  },
];

export const PROMPT_ASSISTANTS = [...LLAMA_PROMPT_ASSISTANTS, ...GEMMA_PROMPT_ASSISTANTS];

export function promptAssistantChoices(installed = []) {
  const models = [...new Set(installed)];
  const known = PROMPT_ASSISTANTS.flatMap((assistant) => {
    const matches = models.filter((name) => [assistant.name, assistant.source].some(
      (candidate) => candidate.toLowerCase() === name.toLowerCase(),
    ));
    return matches.length ? matches.map((name) => ({ name, label: assistant.label, disabled: false }))
      : [{ name: assistant.name, label: `${assistant.label} — run installer first`, disabled: true }];
  });
  return [...known, ...models.filter((name) => !known.some((entry) => entry.name === name))
    .map((name) => ({ name, label: name, disabled: false }))];
}
