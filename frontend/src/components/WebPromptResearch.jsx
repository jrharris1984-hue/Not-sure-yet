import { useAssistantResearch, updateAssistantResearch } from '@/lib/assistantResearch';
export function WebPromptResearchOptions({ enabled, onEnabled, focus, onFocus, disabled } = {}) {
  const shared = useAssistantResearch();
  enabled = enabled ?? shared.enabled;
  focus = focus ?? shared.focus;
  onEnabled = onEnabled || (value => updateAssistantResearch({enabled:value, result:null}));
  onFocus = onFocus || (value => updateAssistantResearch({focus:value, result:null}));
  return <div className="space-y-2 text-xs text-zinc-400"><label className="flex items-center gap-2"><input type="checkbox" aria-label="Use web research" checked={enabled} disabled={disabled} onChange={event => onEnabled(event.target.checked)}/>Use web research with AI</label>
    {enabled && <><label className="block">Research focus (optional)<input aria-label="Prompt research focus" value={focus} maxLength={200} disabled={disabled} onChange={event => onFocus(event.target.value)} placeholder="e.g. lighting for historic interiors" className="mt-1 w-full rounded-lg border hairline bg-elevated p-2"/></label><p>Short reference queries are searched online. This shared option applies to interactive AI tools throughout Ultra Studio until you turn it off or reload the app. Your full prompt and images are not sent to search. Requires an Ollama account and search key in Settings. Ollama offers a free search tier with usage limits; paid plans offer higher limits. Your selected local assistant still runs locally.</p></>}
  </div>;
}
export function PromptResearchNotes({ result }) {
  if (!result?.sources?.length && !result?.changes?.length) return null;
  return <div className="space-y-2 text-xs" aria-label="Prompt research notes">
    {!!result.changes?.length && <><h3 className="font-semibold">What AI changed</h3><ul className="list-disc pl-4 space-y-1">{result.changes.map((change,index)=><li key={index}>{change}</li>)}</ul></>}
    {!!result.sources?.length && <><h3 className="font-semibold">Research sources</h3><ul className="space-y-1">{result.sources.map(source=><li key={source.id}><a href={source.url} target="_blank" rel="noreferrer" className="text-cyan-300 underline">[{source.id}] {source.title}</a>{!source.cited && <span className="text-zinc-500"> · retrieved, not cited</span>}</li>)}</ul><p className="text-zinc-500">Guidance comes from search snippets. Check the sources; recommendations do not guarantee image quality.</p></>}
  </div>;
}
