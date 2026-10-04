import { GEMMA_PROMPT_ASSISTANTS, LLAMA_PROMPT_ASSISTANTS, promptAssistantChoices } from "./promptAssistantModels";

test("all four assistants are visible but cannot be selected before installation", () => {
  const choices = promptAssistantChoices();
  expect(choices).toHaveLength(4);
  expect(choices.every((choice) => choice.disabled)).toBe(true);
});

test("installed aliases and direct downloads retain their actual Ollama names", () => {
  const tiger = GEMMA_PROMPT_ASSISTANTS[0];
  const choices = promptAssistantChoices([tiger.name, tiger.source, "dolphin3:8b", tiger.name]);
  expect(choices.filter((choice) => choice.label === tiger.label).map((choice) => choice.name))
    .toEqual([tiger.name, tiger.source]);
  expect(choices.find((choice) => choice.name === tiger.name).disabled).toBe(false);
  expect(choices.find((choice) => choice.name === "dolphin3:8b").disabled).toBe(false);
});

test("Ollama normalized casing still receives the friendly label", () => {
  const source = GEMMA_PROMPT_ASSISTANTS[0].source.toLowerCase();
  expect(promptAssistantChoices([source]).find((choice) => choice.name === source)).toMatchObject({ name: source, disabled: false,
    label: GEMMA_PROMPT_ASSISTANTS[0].label });
});

test("lighter assistants retain exact tags and Dark Champion is labeled 18.4B", () => {
  for (const assistant of LLAMA_PROMPT_ASSISTANTS) {
    const choices = promptAssistantChoices([assistant.name, assistant.source]);
    expect(choices.find((choice) => choice.name === assistant.name)).toMatchObject({ disabled: false, label: assistant.label });
    expect(choices.find((choice) => choice.name === assistant.source)).toMatchObject({ disabled: false, label: assistant.label });
  }
  expect(LLAMA_PROMPT_ASSISTANTS[1].label).toContain("18.4B");
});
