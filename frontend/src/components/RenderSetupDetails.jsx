import { useState } from 'react';
import { endpoints } from '@/lib/api';
const styles = new Set(['krea2','krea2_test','krea2_aio','kroma','zimage','flux1_dev','flux2_klein','chroma','chroma_test','chroma_turbo','chroma_flash','sdxl','sdxl_dmd2','pony']);
export default function RenderSetupDetails({ render, compare = false }) {
  const [workflows, setWorkflows] = useState([]), [target, setTarget] = useState('');
  const [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  const [loaded, setLoaded] = useState(false);
  const setup = render?.model_setup;
  async function load(event) {
    if (!event.currentTarget.open || loaded || !compare) return;
    try {
      const rows = await endpoints.listWorkflows();
      setWorkflows(rows.filter(w => styles.has(w.prompt_style) && ['image','pony','krea_style'].includes(w.kind)));
      setLoaded(true);
    } catch { setMessage('Could not load workflows. Close and reopen to retry.'); }
  }
  async function queue() {
    setBusy(true); setMessage('');
    try {
      await endpoints.compareWorkflow(render.id || render.render_id, target);
      setMessage('Comparison queued. When finished, select both results in Gallery and choose Compare.');
    } catch (error) { setMessage(error?.response?.data?.detail || 'Could not queue comparison.'); }
    finally { setBusy(false); }
  }
  return <details className="rounded-lg border hairline p-3 text-xs" onToggle={load}>
    <summary className="min-h-11 cursor-pointer content-center font-semibold text-cyan-200">Model setup{compare ? ' & workflow test' : ''}</summary>
    {setup ? <div className="space-y-2 break-words text-zinc-300">
      {[['models','Model / checkpoint'],['encoders','Text encoder'],['vaes','VAE']].map(([key,label]) => <div key={key}><b>{label}: </b>{setup[key]?.join(', ') || 'Bundled or not exposed by this loader'}</div>)}
      <div><b>LoRAs in graph: </b>{setup.loras?.length ? setup.loras.map((l,i) => <div key={i}>{l.name || 'Linked filename'} · model {l.strength_model ?? l.strength ?? '?'}{l.strength_clip != null ? ` · encoder ${l.strength_clip}` : ''}</div>) : 'None with nonzero or unresolved strength'}</div>
      <div><b>Seed: </b>{render.seed_used ?? 'Not recorded'}</div>
      {setup.sampling?.map(s => <div key={s.node_id} className="rounded bg-black/20 p-2"><b>{s.type} · {s.node_id}</b><div>{Object.entries(s).filter(([k]) => !['node_id','type'].includes(k)).map(([k,v]) => `${k}: ${v ?? 'linked / unresolved'}`).join(' · ')}</div></div>)}
      <p className="text-zinc-500">Captured from the submitted graph. Custom loaders may bundle components; entries can include auxiliary or unused branches.</p>
    </div> : <p className="text-zinc-400">This older render has no component snapshot. New renders capture their dispatched setup.</p>}
    {compare && <div className="mt-3 space-y-2 border-t hairline pt-3">
      <p className="text-zinc-400">Reuse this saved prompt, seed and size with another text-to-image workflow. The target uses its own sampling defaults and built-in adapters; optional source LoRAs are cleared. Identical seeds across models do not imply identical compositions.</p>
      <label className="block">Workflow<select className="mt-1 min-h-11 w-full rounded border hairline bg-zinc-900 p-2" value={target} onChange={e => setTarget(e.target.value)}><option value="">Choose a workflow</option>{workflows.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}</select></label>
      <button type="button" disabled={!target || busy} onClick={queue} className="min-h-11 rounded border hairline px-3 disabled:opacity-40">{busy ? 'Queueing…' : 'Queue workflow test'}</button>
      {message && <p role="status" className="text-cyan-200">{message}</p>}
    </div>}
  </details>;
}
