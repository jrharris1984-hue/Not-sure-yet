import {useEffect,useRef,useState} from 'react';
import DnaSection from './DnaSection';
import DetailNavigator from './DetailNavigator';
import {FOOT_DESTINATIONS} from '@/lib/footControlPlacement';

export default function RelatedFootControls({destination,section,value={},onChange,locked=false,fieldLocks={},onToggleFieldLock,notes=[],requestedField,onOpenDestination,onToggleSectionLock}) {
  const definition=FOOT_DESTINATIONS[destination];
  const [groupIndex,setGroupIndex]=useState(0),[fieldKey,setFieldKey]=useState('');
  const disclosure=useRef(null);
  const groups=(definition?.groups || []).map(group=>({...group,fields:section?.fields.filter(field=>group.fields.includes(field.key)) || []})).filter(group=>group.fields.length);
  useEffect(()=>{
    const key=requestedField?.field?.startsWith('feet:')?requestedField.field.slice(5):null;
    if(!key)return;
    const index=groups.findIndex(group=>group.fields.some(field=>field.key===key));
    if(index<0)return;
    setGroupIndex(index);setFieldKey(key);
    if(disclosure.current){disclosure.current.open=true;disclosure.current.scrollIntoView?.({block:'nearest'});}
    // A setting-search request is an explicit navigation event.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[requestedField]);
  if(destination==='feet' && section && onOpenDestination)return <nav className="related-foot-controls" aria-label="Other foot controls"><p className="text-xs text-zinc-400 mb-2">Looking for grooming or a detail shot?</p><div className="flex flex-wrap gap-2">{Object.entries(FOOT_DESTINATIONS).map(([key,item])=>{const first=item.groups.flatMap(group=>group.fields).find(field=>section.fields.some(source=>source.key===field));return first && <button type="button" key={key} className="chip min-h-11" onClick={()=>onOpenDestination(first)}>{item.title}</button>;})}</div></nav>;
  if(!definition || !groups.length)return null;
  const group=groups[groupIndex] || groups[0];
  const field=group.fields.find(item=>item.key===fieldKey) || group.fields[0];
  const explanations=notes.filter(note=>note.section==='feet' && note.field===field.key).map(note=>note.text);
  return <details ref={disclosure} className="related-foot-controls" data-testid={`related-feet-${destination}`}>
    <summary>{definition.title}<span>Optional details</span></summary>
    <div className="space-y-3 pt-3">
      <p className="text-xs text-zinc-400">{definition.help}</p>
      {groups.length>1 && <nav className="flex flex-wrap gap-2" aria-label="Foot detail groups">{groups.map((item,index)=><button type="button" key={item.label} className={`chip min-h-11 ${item===group?'active':''}`} aria-pressed={item===group} onClick={()=>{setGroupIndex(index);setFieldKey('');}}>{item.label}</button>)}</nav>}
      <DetailNavigator fields={group.fields} value={field.key} label="Foot detail" onChange={setFieldKey}/>
      {locked && <div className="text-xs text-amber-200">Foot details are locked. {onToggleSectionLock && <button type="button" className="chip min-h-11" onClick={onToggleSectionLock}>Unlock foot details</button>}</div>}
      <fieldset disabled={locked} className="min-w-0"><DnaSection embedded section={{...section,title:field.label}} value={value} focusedField={field.key} fieldLocks={fieldLocks}
        onToggleFieldLock={onToggleFieldLock} controlNotes={explanations} onChange={next=>{
          if(locked)return;
          const retained={...next};
          Object.keys(fieldLocks).filter(key=>fieldLocks[key]).forEach(key=>{retained[key]=value[key];});
          onChange(retained);
        }}/></fieldset>
    </div>
  </details>;
}
