import { useAssistantResearch, updateAssistantResearch } from '@/lib/assistantResearch';

export function PromptResearchNotes({ result } = {}) {
  const research = result?.research || result;
  const sources = Array.isArray(research?.sources) ? research.sources.filter(Boolean) : [];
  const changes = Array.isArray(research?.changes) ? research.changes.filter(item => typeof item === 'string' && item.trim()) : [];
  if (!sources.length && !changes.length) return null;

  return <section className="space-y-2 text-xs text-zinc-400" aria-label="Prompt research notes">
    {!!changes.length && <ul className="list-disc space-y-1 pl-4">
      {changes.map((change, index) => <li key={index}>{change}</li>)}
    </ul>}
    {!!sources.length && <>
      <h3 className="font-semibold text-zinc-300">Retrieved sources</h3>
      <ul className="space-y-2 break-words">
        {sources.map((source, index) => {
          const title = source.title || source.url || 'Source';
          const label = source.id ? `[${source.id}] ${title}` : title;
          return <li key={`${source.id || source.url || 'source'}-${index}`}>
            {typeof source.url === 'string' && /^https?:\/\//i.test(source.url)
              ? <a href={source.url} target="_blank" rel="noreferrer" className="text-cyan-300 underline">{label}</a>
              : <span>{label}</span>}
            {!source.cited && <span className="text-zinc-500"> · retrieved, not cited by assistant</span>}
          </li>;
        })}
      </ul>
    </>}
  </section>;
}

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
