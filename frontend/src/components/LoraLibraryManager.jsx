import {useEffect, useRef, useState} from 'react';
import {endpoints} from '@/lib/api';
import {loraFileKey, saveLoraPreference, removeLoraPreference} from '@/lib/loraPreferences';

const families = [['','Needs review'],['moss_image','MOSS Image'],['qwen_image','Qwen Image'],['qwen_edit','Qwen Edit'],['chroma','Chroma'],['krea2','Krea 2'],['flux','FLUX.1'],['flux2_klein','FLUX.2 Klein'],['zimage','Z-Image'],['pony','Pony'],['sdxl','SDXL'],['sd15','SD 1.5'],['wan22','WAN 2.2']];
const message = error => error.response?.data?.detail || error.message || 'Request failed';

export function ProfileReview({name, record, onSaved}) {
  const detected = record?.detected || {};
  const [draft, setDraft] = useState(() => ({family:detected.family || '', triggerWords:detected.triggerWords || [],
    minStrength:0, defaultStrength:0.8, maxStrength:1.5, ...record?.profile}));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const input = 'w-full rounded border hairline bg-elevated p-2 text-sm';
  async function save() {
    setBusy(true); setError('');
    try {
      const {profile} = await endpoints.saveLoraProfile(name, draft);
      saveLoraPreference(name, profile);
      onSaved({...record, name, profile});
    } catch (e) { setError(message(e)); }
    finally { setBusy(false); }
  }
  return <fieldset disabled={busy} className="space-y-3 rounded border hairline p-3">
    <legend className="break-all text-sm">Review {name}</legend>
    <p className="text-xs text-zinc-400">Detected information is a suggestion. Strengths below are app starting values unless you previously saved them; check the creator’s instructions before confirming a range.</p>
    <label className="block text-xs">Model family<select className={input} value={draft.family} onChange={e=>setDraft({...draft,family:e.target.value})}>{families.map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
    <label className="block text-xs">Trigger words<input className={input} value={draft.triggerWords.join(', ')} onChange={e=>setDraft({...draft,triggerWords:e.target.value.split(',')})}/></label>
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">{[['minStrength','Minimum'],['defaultStrength','Default'],['maxStrength','Maximum']].map(([key,label])=><label key={key} className="block text-xs">{label}<input className={input} type="number" step="0.05" value={draft[key]} onChange={e=>setDraft({...draft,[key]:e.target.value === '' ? '' : Number(e.target.value)})}/></label>)}</div>
    <p className="text-xs text-zinc-400">Negative values are supported. This picker changes model influence only, not text-encoder strength.</p>
    {error && <p role="alert">{error}</p>}
    <button type="button" className="chip min-h-11" onClick={save}>Save LoRA profile</button>
  </fieldset>;
}

export default function LoraLibraryManager({installed, records, onRecords}) {
  const [online, setOnline] = useState(false);
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(50);
  const [reviewOnly, setReviewOnly] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [editing, setEditing] = useState('');
  const stop = useRef(false);
  useEffect(()=>()=>{stop.current=true;},[]);
  const byName = new Map(records.map(r=>[loraFileKey(r.name),r]));
  const visible = installed.filter(name=>name.toLowerCase().includes(query.toLowerCase()) && (!reviewOnly || !byName.get(loraFileKey(name))?.profile?.family));
  async function scan() {
    stop.current=false; setBusy(true); setError(''); setEditing('');
    let updated=[...records], count=0;
    try {
      for (const name of visible) {
        if (stop.current) break;
        setStatus(`Scanning ${count+1} of ${visible.length}: ${name}`);
        const result=await endpoints.scanLora(name, online);
        updated=[...updated.filter(r=>loraFileKey(r.name)!==loraFileKey(name)),result];
        onRecords(updated); count++;
      }
      setStatus(`${stop.current ? 'Stopped' : 'Scan complete'} · ${count} files checked. Results saved.`);
    } catch(e) {setError(message(e));setStatus(`${count} files checked; completed results are saved.`);}
    finally {setBusy(false);}
  }
  async function importHashes(event) {
    const file=event.target.files?.[0]; event.target.value='';
    if (!file) return;
    setError(''); setBusy(true);
    try {
      if (file.size>2000000) throw new Error('Hash inventory must be under 2 MB.');
      const result=await endpoints.importLoraHashes(JSON.parse(await file.text()));
      (result.invalidated || []).forEach(removeLoraPreference);
      onRecords((await endpoints.loraLibrary()).records || []);
      setStatus(`${result.imported} file hashes imported; ${result.unmatched} names did not match installed paths.`);
    } catch(e) {setError(message(e));}
    finally {setBusy(false);}
  }
  return <details className="rounded-lg border hairline p-3" data-testid="lora-library">
    <summary className="cursor-pointer text-sm text-cyan-200">Scan & manage installed LoRAs</summary>
    <div className="mt-3 space-y-3">
      <p className="text-xs text-zinc-400">Read embedded metadata from ComfyUI. Scanning never selects a LoRA, changes a prompt, or starts a render. Review a profile to apply its settings.</p>
      <label className="block text-xs"><input type="checkbox" checked={online} disabled={busy} onChange={e=>setOnline(e.target.checked)}/> Match imported file hashes online (Civitai)</label>
      {online && <p className="text-xs text-zinc-400">Only SHA256 hashes are sent to Civitai. Model files and prompts stay local. Matches do not verify a strength range.</p>}
      <input aria-label="Search installed LoRAs" className="w-full rounded border hairline bg-elevated p-2 text-sm" placeholder="Search installed files…" value={query} disabled={busy} onChange={e=>setQuery(e.target.value)}/>
      <label className="block text-xs"><input type="checkbox" checked={reviewOnly} disabled={busy} onChange={e=>setReviewOnly(e.target.checked)}/> Needs review only</label>
      <div className="flex flex-wrap gap-2"><button type="button" className="chip min-h-11" disabled={busy || !visible.length} onClick={scan}>Scan {visible.length} files</button>
      {busy && <button type="button" className="chip min-h-11" onClick={()=>{stop.current=true;}}>Stop after current file</button>}</div>
      <details className="text-xs"><summary className="cursor-pointer">Optional: import hashes for online matching</summary>
        <p className="my-2">Run scripts/Export-LoraHashes.ps1 once on Windows, choose your ComfyUI LoRA folder, then import its JSON here. Subfolder paths must match ComfyUI. Repeat after replacing files.</p>
        <label className="block">Hash inventory JSON<input type="file" accept=".json,application/json" disabled={busy} onChange={importHashes} className="mt-2 block w-full"/></label>
      </details>
      {status && <p role="status" className="break-words text-xs">{status}</p>}{error && <p role="alert" className="text-xs text-amber-200">{error}</p>}
      <div className="max-h-72 space-y-2 overflow-y-auto">{visible.slice(0,limit).map(name=>{const record=byName.get(loraFileKey(name));return <div key={name} className="rounded border hairline p-2 text-xs">
        <p className="break-all">{name}</p><p className="text-zinc-400">{record?.profile?.family ? 'Profile saved' : 'Needs review'} · {record?.lookup_status || 'Not scanned'}</p>
        {record?.detected?.baseModel && <p>Reported base: {record.detected.baseModel}</p>}
        {record?.detected?.sourceUrl?.startsWith('https://civitai.com/models/') && <a href={record.detected.sourceUrl} target="_blank" rel="noreferrer" className="mr-3 underline">Model page</a>}
        <button type="button" disabled={busy} className="min-h-11 text-cyan-200" onClick={()=>setEditing(editing===name?'':name)}>Review settings</button>
      </div>;})}</div>
      {visible.length>limit && <button type="button" className="chip min-h-11" onClick={()=>setLimit(limit+50)}>Show more files</button>}
      {editing && <ProfileReview key={editing} name={editing} record={byName.get(loraFileKey(editing))} onSaved={record=>{onRecords([...records.filter(r=>loraFileKey(r.name)!==loraFileKey(record.name)),record]);setEditing('');setStatus('Profile saved. Available on your other devices too.');}}/>}
    </div>
  </details>;
}
