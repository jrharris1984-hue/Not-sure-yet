import {useEffect,useState} from 'react';
import {applyLook3,createLook3} from '@/lib/studio3WardrobeScenes';
import {updateShot} from '@/lib/shotPlan3';
const storageKey=characterId=>'ultrastudio3:saved-looks:'+(characterId||'draft');
const readLooks=key=>{try{const value=JSON.parse(window.localStorage.getItem(key)||'[]');return Array.isArray(value)?value.filter(item=>item&&item.version===1&&item.id&&item.name):[];}catch{return [];}};
export default function Studio3SavedLooks({plan,onApply}){
 const key=storageKey(plan?.characterId);
 const firstShotId=plan?.shots?.[0]?.id||'';
 const [looks,setLooks]=useState(()=>readLooks(key));
 const [targetId,setTargetId]=useState(plan?.shots?.[0]?.id||'');
 const [selectedId,setSelectedId]=useState('');
 const [name,setName]=useState('');
 const [message,setMessage]=useState('');
 useEffect(()=>{setLooks(readLooks(key));setSelectedId('');setTargetId(firstShotId);},[key,firstShotId]);
 useEffect(()=>{try{window.localStorage.setItem(key,JSON.stringify(looks));}catch{setMessage('Saved looks are unavailable because browser storage is full.');}},[key,looks]);
 const target=plan?.shots?.find(shot=>shot.id===targetId);
 const save=()=>{
  if(!target||!name.trim())return;
  const look={...createLook3({name:name.trim(),wardrobe:{outfit:target.outfit||''},scene:target.scene||{},lighting:target.lighting||{}}),id:'look-'+Date.now().toString(36)};
  setLooks(current=>[...current,look]);setSelectedId(look.id);setName('');setMessage('Saved for this character.');
 };
 const apply=()=>{
  const look=looks.find(item=>item.id===selectedId);if(!target||!look)return;
  const merged=applyLook3({wardrobe:{outfit:target.outfit||''},scene:target.scene||{},lighting:target.lighting||{}},look);
  onApply(updateShot(plan,target.id,{outfit:merged.wardrobe?.outfit||null,scene:merged.scene,lighting:merged.lighting}));setMessage('Look applied to '+target.label+'.');
 };
 const remove=()=>{setLooks(current=>current.filter(item=>item.id!==selectedId));setSelectedId('');setMessage('Saved look removed.');};
 return <details className="rounded-lg border border-zinc-700 p-3" data-testid="studio3-saved-looks"><summary className="cursor-pointer text-sm font-medium text-amber-200">Saved wardrobe & scene looks · {looks.length}</summary>
  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
   <label className="block text-xs text-zinc-300">Shot<select aria-label="Look source shot" className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 p-2 text-sm" value={targetId} onChange={event=>setTargetId(event.target.value)}>{(plan?.shots||[]).map(shot=><option key={shot.id} value={shot.id}>{shot.label}</option>)}</select></label>
   <label className="block text-xs text-zinc-300">Look name<input aria-label="Saved look name" className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 p-2 text-sm" value={name} onChange={event=>setName(event.target.value)} placeholder="Name this look"/></label>
  </div>
  <button type="button" className="chip mt-2" disabled={!target||!name.trim()} onClick={save}>Save current look</button>
  {!!looks.length&&<div className="mt-3 flex flex-wrap items-end gap-2"><label className="min-w-0 flex-1 text-xs text-zinc-300">Apply saved look<select aria-label="Look to apply" className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 p-2 text-sm" value={selectedId} onChange={event=>setSelectedId(event.target.value)}><option value="">Choose a saved look</option>{looks.map(look=><option key={look.id} value={look.id}>{look.name}</option>)}</select></label><button type="button" className="chip active" disabled={!target||!selectedId} onClick={apply}>Apply to shot</button><button type="button" className="chip" disabled={!selectedId} onClick={remove}>Delete look</button></div>}
  {message&&<p role="status" className="mt-2 text-xs text-zinc-400">{message}</p>}
  <p className="mt-2 text-xs text-zinc-500">Looks are saved in this browser for the current character and can be reused in other shots.</p>
 </details>;
}
