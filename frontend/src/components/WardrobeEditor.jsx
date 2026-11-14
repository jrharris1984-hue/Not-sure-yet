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
export default function WardrobeEditor({requestedField, ...props}) {
  const [groupKey,setGroupKey]=useState('clothes');
  const [fieldKey,setFieldKey]=useState('');
  const [showInactive,setShowInactive]=useState(false);
  const [search,setSearch]=useState('');
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
  const allDetails=groups.flatMap(item=>item.fields.map(detail=>({detail,group:item.key})));
  const detailIndex=allDetails.findIndex(item=>item.group===group?.key && item.detail.key===field?.key);
  const moveDetail=offset=>{const target=allDetails[detailIndex+offset];if(target){setGroupKey(target.group);setFieldKey(target.detail.key);setSearch('');}else if(props.onSectionAdvance)props.onSectionAdvance(offset);};
  return <div className="space-y-4 min-w-0" data-testid="wardrobe-focused-editor">
    <WardrobeOverview value={props.value} fields={props.section.fields} disabled={!!props.locked || !!props.fieldLocks?.outfit_mode}
      onModeChange={mode=>props.onChange(editWardrobeField(props.value,'outfit_mode',mode))}
      showInactive={showInactive} onShowInactive={setShowInactive}/>
    <label className="wardrobe-smart-search">Find wardrobe detail<input type="search" value={search} onChange={event=>setSearch(event.target.value)} placeholder="Search outfits, shoes, fabric…" /></label>
    {search.trim() && <div className="wardrobe-smart-results" role="group" aria-label="Wardrobe search results">{source.flatMap(item=>item.fields.filter(field=>`${item.key} ${field.label} ${field.key}`.toLowerCase().includes(search.trim().toLowerCase())).map(field=><button key={field.key} type="button" onClick={()=>{const target=navigation.find(nav=>nav.groups.includes(item.key));if(target)setGroupKey(target.key);setFieldKey(field.key);if(wardrobeFieldDisabled(field.key,props.value))setShowInactive(true);setSearch('');}}>{field.label}{wardrobeFieldDisabled(field.key,props.value)?' · inactive':''}</button>))}</div>}
    <nav className="wardrobe-category-tabs flex flex-wrap gap-2" aria-label="Wardrobe navigation">{groups.map(item=><button key={item.key} type="button" className={`chip min-h-11 ${item.key===group?.key?'active':''}`} aria-pressed={item.key===group?.key}
      onClick={()=>{setGroupKey(item.key);setFieldKey('');}}>{item.label}</button>)}</nav>
    <label className="wardrobe-mobile-category">Clothing category
      <select aria-label="Clothing category" value={group?.key || ''} onChange={event=>{setGroupKey(event.target.value);setFieldKey('');}}>
        {groups.map(item=><option key={item.key} value={item.key}>{item.label}</option>)}
      </select>
    </label>
    {field ? <>
      <div className="wardrobe-desktop-detail-nav"><DetailNavigator label="Editing" fields={group.fields.map(item=>({...item,label:`${item.label}${wardrobeFieldDisabled(item.key,props.value)?' · inactive':''}`}))} value={field.key} onChange={setFieldKey}/></div>
      <label className="wardrobe-mobile-detail-nav">Customize
        <select aria-label="Wardrobe detail" value={field.key} onChange={event=>setFieldKey(event.target.value)}>
          {group.fields.map(item=><option key={item.key} value={item.key}>{item.label}{wardrobeFieldDisabled(item.key,props.value)?' · inactive':''}</option>)}
        </select>
      </label>
      <DnaSection {...props} focusedField={field.key} hideWardrobeOverview collapsed={false} simpleMode={false}/>
      <nav className="bench-detail-stepper" aria-label="Navigate every wardrobe detail">
        <button type="button" disabled={detailIndex<=0 && !props.hasPreviousSection} onClick={()=>moveDetail(-1)}>← Previous detail</button>
        <span aria-live="polite">{detailIndex+1} of {allDetails.length}<small>{field.label}</small></span>
        <button type="button" disabled={detailIndex>=allDetails.length-1 && !props.hasNextSection} onClick={()=>moveDetail(1)}>Next detail →</button>
      </nav>
    </> : <p className="text-sm text-zinc-400">No controls available in this outfit mode.</p>}
  </div>;
}
