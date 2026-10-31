import MobileDetailPath from "./MobileDetailPath";
import DetailNavigator from './DetailNavigator';
import {useEffect, useState} from 'react';
import DnaSection from './DnaSection';
import WardrobeOverview from './WardrobeOverview';
import {wardrobeGroups} from '@/lib/wardrobeLayout';
import {editWardrobeField, wardrobeFieldDisabled} from '@/lib/wardrobeMode';

const navigation = [
  {key:'clothes',label:'Clothes',groups:['outfit']},
  {key:'shoes',label:'Shoes',groups:['shoes']},
  {key:'layers',label:'Layers',groups:['underneath','hosiery']},
  {key:'accessories',label:'Accessories',groups:['accessories']},
  {key:'styling',label:'Styling',groups:['fabric','coverage','other']},
];
export default function WardrobeEditor({requestedField, path=null, ...props}) {
  const [groupKey,setGroupKey]=useState('clothes');
  const [fieldKey,setFieldKey]=useState('');
  const [showInactive,setShowInactive]=useState(false);
  const source=wardrobeGroups(props.section.fields);
  const groups=navigation.map(group=>({...group,fields:source.filter(item=>group.groups.includes(item.key)).flatMap(item=>item.fields)
    .filter(field=>field.key!=='outfit_mode' && (showInactive || !wardrobeFieldDisabled(field.key,props.value)))})).filter(group=>group.fields.length);
  const requested=requestedField?.field || props.focusedField;
  useEffect(()=>{
    if (!requested || requested==='all') return;
    const sourceGroup=source.find(group=>group.fields.some(field=>field.key===requested));
    const target=navigation.find(group=>group.groups.includes(sourceGroup?.key));
    if(target) setGroupKey(target.key);
    setFieldKey(requested);
    if(wardrobeFieldDisabled(requested,props.value)) setShowInactive(true);
    // Explicit navigation requests should not reset browsing on each edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[requested,requestedField]);
  const group=groups.find(item=>item.key===groupKey) || groups[0];
  const field=group?.fields.find(item=>item.key===fieldKey) || group?.fields[0];
  return <div className="space-y-4 min-w-0" data-testid="wardrobe-focused-editor">
    <WardrobeOverview value={props.value} fields={props.section.fields} disabled={!!props.locked || !!props.fieldLocks?.outfit_mode}
      onModeChange={mode=>props.onChange(editWardrobeField(props.value,'outfit_mode',mode))}
      showInactive={showInactive} onShowInactive={setShowInactive}/>
    {path?<MobileDetailPath groups={groups} path={path} label="Editing" value={field?.key} onChange={key=>{setGroupKey(groups.find(g=>g.fields.some(f=>f.key===key))?.key);setFieldKey(key);}}/>:<nav className="flex flex-wrap gap-2" aria-label="Wardrobe navigation">{groups.map(item=><button key={item.key} type="button" className={`chip min-h-11 ${item.key===group?.key?'active':''}`} aria-pressed={item.key===group?.key}
      onClick={()=>{setGroupKey(item.key);setFieldKey('');}}>{item.label}</button>)}</nav>}
    {field ? <>
      {!path && <DetailNavigator label="Editing" fields={group.fields.map(item=>({...item,label:`${item.label}${wardrobeFieldDisabled(item.key,props.value)?' · inactive':''}`}))} value={field.key} onChange={setFieldKey}/>}
      <DnaSection {...props} focusedField={field.key} hideWardrobeOverview collapsed={false} simpleMode={false}/>
    </> : <p className="text-sm text-zinc-400">No controls available in this outfit mode.</p>}
  </div>;
}
