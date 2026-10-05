import { useState } from 'react';
import { Link } from 'react-router-dom';
import { endpoints } from '@/lib/api';
export default function AIResearchPanel({ context = '', onApply, open = false }) {
  const [query,setQuery]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const [result,setResult]=useState(null),[suggestion,setSuggestion]=useState('');
  const research = async () => {
    setBusy(true);setError('');setResult(null);
    try { const data=await endpoints.aiResearch(query.trim(),context.slice(0,12000)); setResult(data);setSuggestion(data.suggested_prompt || ''); }
    catch(err) {setError(err.response?.data?.detail || 'Research failed. Try again.');}
    finally {setBusy(false);}
  };
  return <details open={open || undefined} className="pane p-4" data-testid="ai-research-panel"><summary className="cursor-pointer font-semibold text-cyan-200">Research with AI</summary><div className="mt-3 space-y-3">
    <p className="text-xs text-zinc-400">Ask about a model, workflow or prompting technique. Your question goes to the web search provider. The current prompt and retrieved snippets go to your configured AI assistant; images are not sent. <Link to="/settings" className="underline text-cyan-300">Configure search in Settings</Link>.</p>
    <label className="block text-sm">Research question<textarea aria-label="Research question" rows={2} maxLength={400} value={query} disabled={busy} onChange={event => setQuery(event.target.value)} placeholder="What does the model author recommend for preserving a source photo?" className="mt-1 w-full rounded-lg border hairline bg-elevated p-2"/></label>
    <button type="button" disabled={busy || query.trim().length<3} onClick={research} className="rounded-lg border border-cyan-400/40 px-3 py-2 text-sm text-cyan-200">{busy?'Researching…':'Search and research'}</button>
    {error && <p role="alert" className="text-sm text-red-200">{error}</p>}
    {result && <section aria-label="Research results" className="space-y-3"><p className="whitespace-pre-wrap text-sm leading-relaxed">{result.answer}</p>
      <h3 className="text-sm font-semibold">Retrieved sources</h3><ul className="space-y-2 text-xs">{(result.sources || []).map(source => <li key={source.id}><a href={source.url} target="_blank" rel="noreferrer" className="text-cyan-300 underline">[{source.id}] {source.title}</a>{!source.cited && <span className="text-zinc-500"> · retrieved, not cited by assistant</span>}</li>)}</ul>
      <p className="text-xs text-zinc-500">Answers are based on search snippets. Verify source details before relying on a recommendation.</p>
      {suggestion && <><label className="block text-sm">Suggested prompt<textarea aria-label="Research suggested prompt" rows={4} value={suggestion} onChange={event => setSuggestion(event.target.value)} className="mt-1 w-full rounded-lg border hairline bg-elevated p-2"/></label>
        {onApply ? <button type="button" disabled={!suggestion.trim()} className="text-sm text-cyan-200" onClick={() => onApply(suggestion)}>Apply researched prompt</button> : <p className="text-xs text-zinc-400">Copy wording you want to use into the relevant controls. Research does not change your selections or queue a render.</p>}</>}
    </section>}
  </div></details>;
}
