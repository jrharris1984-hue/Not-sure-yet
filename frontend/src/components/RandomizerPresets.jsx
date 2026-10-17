import { useState } from 'react';
import { endpoints } from '@/lib/api';
import { customRandomizerFields } from '@/lib/customRandomizers';
export default function RandomizerPresets({ onApply, busy=false }) {
  const [presets,setPresets]=useState([]),[loaded,setLoaded]=useState(false),[pending,setPending]=useState(false);
  const [name,setName]=useState(''),[rules,setRules]=useState([]),[editing,setEditing]=useState(''),[message,setMessage]=useState('');
  const [fieldKey,setFieldKey]=useState(''),[query,setQuery]=useState(''),[confirmDelete,setConfirmDelete]=useState('');
  const fields=customRandomizerFields();
  const field=fields.find(f=>`${f.section}.${f.field}`===fieldKey) || fields[0];
  const selected=rules.find(r=>r.section===field?.section && r.field===field?.field)?.values || [];
  async function load(event) {
    if(!event.currentTarget.open || loaded || pending) return;
    setPending(true);
    try {setPresets(await endpoints.listRandomizerPresets());setLoaded(true);setMessage('');}
    catch {setMessage('Could not load your presets. Close and reopen to retry.');}
    finally {setPending(false);}
  }
  function toggle(value) {
    const values=selected.includes(value) ? selected.filter(v=>v!==value) : [...selected,value];
    setRules(current=>[...current.filter(r=>r.section!==field.section || r.field!==field.field),...(values.length?[{section:field.section,field:field.field,values}]:[])]);
  }
  async function save() {
    setPending(true);setMessage('');
    try {
      const saved=await endpoints.saveRandomizerPreset({name:name.trim(),rules},editing || undefined);
      setPresets(current=>editing?current.map(p=>p.id===editing?{...p,...saved}:p):[saved,...current]);
      setEditing(saved.id);setMessage('Saved. Available on devices connected to this Ultra Studio backend.');
    } catch(error) {setMessage(typeof error?.response?.data?.detail === 'string' ? error.response.data.detail : 'Could not save this randomizer.');}
    finally {setPending(false);}
  }
  async function remove(id) {
    setPending(true);
    try {await endpoints.deleteRandomizerPreset(id);setPresets(presets.filter(p=>p.id!==id));setConfirmDelete('');if(editing===id){setEditing('');setName('');setRules([]);}}
    catch {setMessage('Could not delete this preset.');}
    finally {setPending(false);}
  }
  return <details className="rounded-xl border hairline p-3" onToggle={load}>
    <summary className="min-h-11 cursor-pointer content-center text-sm font-semibold text-cyan-200">My randomizers · create & save</summary>
    <fieldset disabled={busy || pending} className="mt-3 space-y-3">
      <p className="text-xs text-zinc-400">Choose allowed options for each detail. One option acts as a fixed preset; several create variety. Locks are kept. Conflicting combinations leave your current setup unchanged.</p>
      <div className="space-y-2">{loaded && !presets.length && <p className="text-xs text-zinc-400">No saved randomizers yet. Create your first one below.</p>}{presets.map(p=><div key={p.id} className="rounded-xl border hairline p-3"><b className="text-sm">{p.name}</b><div className="mt-2 flex flex-wrap gap-2">
        <button type="button" className="chip min-h-11" onClick={()=>onApply(p)}>Apply randomizer</button>
        <button type="button" className="chip min-h-11" onClick={()=>{setEditing(p.id);setName(p.name);setRules(p.rules);setFieldKey(p.rules[0] ? `${p.rules[0].section}.${p.rules[0].field}` : '');setQuery('');setMessage('');}}>Edit</button>
        <button type="button" className="chip min-h-11" onClick={()=>setConfirmDelete(p.id)}>Delete</button>
        {confirmDelete===p.id && <><span className="self-center text-xs">Delete this saved preset?</span><button type="button" className="chip min-h-11" onClick={()=>remove(p.id)}>Confirm delete</button><button type="button" className="chip min-h-11" onClick={()=>setConfirmDelete('')}>Cancel</button></>}
      </div></div>)}</div>
      <div className="flex items-center justify-between"><h3 className="text-sm font-semibold">{editing?'Edit randomizer':'Create a randomizer'}</h3><button type="button" className="chip min-h-11" onClick={()=>{setEditing('');setName('');setRules([]);setQuery('');setMessage('');}}>New blank</button></div>
      <label className="block text-xs">Name<input maxLength={100} className="studio-control-search mt-2" value={name} onChange={e=>setName(e.target.value)} placeholder="My outdoor portraits"/></label>
      <label className="block text-xs">Detail to vary<select className="studio-control-search mt-2" value={fieldKey || `${field?.section}.${field?.field}`} onChange={e=>{setFieldKey(e.target.value);setQuery('');}}>{fields.map(f=><option key={`${f.section}.${f.field}`} value={`${f.section}.${f.field}`}>{f.label}</option>)}</select></label>
      <input type="search" aria-label="Find randomizer options" className="studio-control-search" placeholder="Find an option…" value={query} onChange={e=>setQuery(e.target.value)}/>
      <div className="max-h-56 overflow-y-auto rounded-xl border hairline p-2">{field?.options.filter(v=>(field.optionLabels[v] || v).toLowerCase().includes(query.toLowerCase())).map(v=><label key={v} className="flex min-h-11 items-center gap-3 rounded-lg px-2 text-xs"><input type="checkbox" checked={selected.includes(v)} onChange={()=>toggle(v)}/>{field.optionLabels[v] || v}</label>)}</div>
      <div className="space-y-1 text-xs text-zinc-400">{rules.map(r=><div key={`${r.section}.${r.field}`} className="flex items-center justify-between gap-2"><span>{fields.find(f=>f.section===r.section && f.field===r.field)?.label || `${r.section}.${r.field}`} · {r.values.length} options</span><button type="button" className="min-h-11 px-2 text-cyan-200" onClick={()=>setRules(rules.filter(x=>x!==r))}>Remove detail</button></div>)}</div>
      <div className="flex flex-wrap gap-2"><button type="button" className="chip min-h-11" disabled={!name.trim() || !rules.length} onClick={save}>{pending?'Saving…':editing?'Save changes':'Save randomizer'}</button><button type="button" className="chip min-h-11" disabled={!rules.length} onClick={()=>onApply({name:name || 'Preview',rules})}>Try without saving</button></div>
    </fieldset>
    {message && <p role="status" className="mt-2 text-xs text-cyan-200">{message}</p>}
  </details>;
}
