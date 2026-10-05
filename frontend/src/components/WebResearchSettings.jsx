import { useEffect, useState } from 'react';
import { endpoints } from '@/lib/api';
export default function WebResearchSettings() {
  const [config,setConfig]=useState(null),[key,setKey]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
  useEffect(() => { let live=true; endpoints.researchConfig().then(value => live && setConfig(value)).catch(() => live && setMessage('Could not load search settings.')); return () => {live=false;}; },[]);
  const save = async remove => {
    setBusy(true); setMessage('');
    try { setConfig(await (remove ? endpoints.removeResearchKey() : endpoints.saveResearchKey(key))); setKey(''); setMessage(remove?'Stored search key removed.':'Search key saved.'); }
    catch(err) { setMessage(err.response?.data?.detail || 'Could not save search settings.'); } finally {setBusy(false);}
  };
  return <div className="space-y-3 border-t hairline pt-4"><h3 className="font-semibold">Optional web research</h3>
    <p className="text-xs text-zinc-400">Search uses Ollama’s web service; answers use your selected prompt assistant. Get a key from <a href="https://ollama.com/settings/keys" target="_blank" rel="noreferrer" className="text-cyan-300 underline">Ollama API keys</a>. Search runs only when requested.</p>
    <p className="text-xs">{config?.configured ? 'Search key configured.' : 'Search key not configured.'}{config?.managed_by_environment && ' Managed by OLLAMA_API_KEY on the backend.'}</p>
    {!config?.managed_by_environment && <><label className="block text-xs">Ollama web search API key<input type="password" aria-label="Ollama web search API key" autoComplete="off" value={key} disabled={busy} onChange={event => setKey(event.target.value)} placeholder={config?.configured?'Enter a replacement key':'Paste your key'} className="mt-1 w-full rounded-lg border hairline bg-elevated p-2"/></label>
      <div className="flex gap-3"><button type="button" disabled={busy || !key.trim()} onClick={() => save(false)} className="rounded-lg border hairline px-3 py-2 text-xs">Save search key</button>{config?.configured && <button type="button" disabled={busy} onClick={() => save(true)} className="text-xs">Remove search key</button>}</div></>}
    {message && <p role="status" className="text-xs text-amber-200">{message}</p>}
  </div>;
}
