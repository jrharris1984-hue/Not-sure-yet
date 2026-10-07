import { useAssistantResearch, updateAssistantResearch } from '@/lib/assistantResearch';

export function WebPromptResearchOptions({ disabled } = {}) {
  const shared = useAssistantResearch();
  return <div className="text-xs text-zinc-400">
    <label className="flex items-center gap-2">
      <input
        type="checkbox"
        aria-label="Use internet with Ollama"
        checked={shared.enabled}
        disabled={disabled}
        onChange={event => updateAssistantResearch({ enabled: event.target.checked })}
      />
      Use internet with Ollama
    </label>
    <p className="mt-1.5 text-zinc-500">
      When enabled, Ultra Studio may retrieve short web references before the selected local Ollama assistant responds.
      Turn it off to keep assistant requests fully local.
    </p>
  </div>;
}
