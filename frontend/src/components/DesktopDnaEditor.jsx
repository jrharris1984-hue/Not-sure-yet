import MobileDetailPath from "./MobileDetailPath";
import DetailNavigator from './DetailNavigator';
import WardrobeEditor from './WardrobeEditor';
import useTabPreference from '@/hooks/useTabPreference';
import { useEffect, useState } from 'react';
import DnaSection from './DnaSection';
import { desktopEditingGroups, desktopFieldTarget } from '@/lib/desktopEditingGroups';
import { sizeControlSummary } from '@/lib/physiqueControlPriority';
import { wardrobeFieldDisabled } from '@/lib/wardrobeMode';

function selectionSummary(field, value, section) {
  if (section === 'physique') {
    const size = sizeControlSummary(field.key, value, field.optionLabels);
    if (size) return size;
  }
  const selected = value[field.key];
  const label = option => field.optionLabels?.[option] || String(option).replace(/^custom_/, '').replace(/_/g, ' ');
  return Array.isArray(selected) ? selected.map(label).join(', ') || 'Not selected'
    : selected === undefined || selected === null || selected === '' ? 'Not selected' : label(selected);
}

export default function DesktopDnaEditor({ enabled, requestedField, workbench=false, path=null, ...props }) {
  const [fieldKey, setFieldKey] = useTabPreference(`ultra:detail-field:${props.section.key}`, '');
  const simpleFields = props.simpleMode && props.simpleFieldKeys?.length
    ? props.section.fields.filter(field => props.simpleFieldKeys.includes(field.key) || desktopFieldTarget(props.section.key,field.key)===fieldKey) : props.section.fields;
  const configuredGroups = desktopEditingGroups({ ...props.section, fields: simpleFields });
  const groups = configuredGroups.length ? configuredGroups : [{key:"details",label:props.section.title,fields:simpleFields}];
  const [search, setSearch] = useState('');
  const matchingGroups = groups.map(group => ({ ...group, fields: group.fields.filter(field =>
    `${group.label} ${field.label} ${field.key}`.toLowerCase().includes(search.trim().toLowerCase())) })).filter(group => group.fields.length);
  const [groupKey, setGroupKey] = useTabPreference(`ultra:detail-group:${props.section.key}`, '');
  useEffect(() => {
    if (!requestedField?.field) return;
    const target = desktopFieldTarget(props.section.key, requestedField.field);
    const selectedGroup = groups.find(group=>group.fields.some(field=>desktopFieldTarget(props.section.key,field.key)===target));
    setSearch('');
    if (selectedGroup) setGroupKey(selectedGroup.key);
    setFieldKey(target);
    // The request is an explicit navigation event, not a reaction to edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedField]);
  if (props.section.key === 'wardrobe') return <WardrobeEditor path={path} {...props} requestedField={requestedField}/>;
  if (!enabled || !simpleFields.length || !groups.length || props.focusedField) return <>{path && <MobileDetailPath groups={[]} path={path}/>}<DnaSection {...props} /></>;
  if(workbench) {
    const seen=new Set();
    const menu=groups.map(group=>({...group, fields:group.fields.flatMap(field=>{
      const key=desktopFieldTarget(props.section.key,field.key);
      if(seen.has(key))return [];
      seen.add(key);return [props.section.fields.find(item=>item.key===key)||field];
    })})).filter(group=>group.fields.length);
    const current=menu.flatMap(group=>group.fields).find(field=>field.key===fieldKey)||menu[0]?.fields[0];
    if(!current)return <DnaSection {...props}/>;
    return <div className="bench-field-editor">
      {path?<MobileDetailPath groups={menu} value={current.key} path={path} onChange={key=>{setFieldKey(key);if(props.collapsed)props.onToggleCollapsed?.();}}/>:<label className="bench-setting-label">Detail<select aria-label="Character detail" value={current.key} onChange={e=>{setFieldKey(e.target.value);if(props.collapsed)props.onToggleCollapsed?.();}}>
        {menu.map(group=><optgroup key={group.key} label={group.label}>{group.fields.map(field=><option key={field.key} value={field.key}>{field.label}</option>)}</optgroup>)}
      </select></label>}
      <DnaSection {...props} focusedField={current.key}/>
    </div>;
  }
  const searchControl = <label className="block text-xs text-zinc-400">Find a detail
    <input type="search" className="studio-control-search mt-2" placeholder={`Search ${props.section.title.toLowerCase()}…`}
      value={search} onChange={event => { setSearch(event.target.value); setFieldKey(''); }} /></label>;
  const group = matchingGroups.find(item => item.key === groupKey) || matchingGroups[0] || groups[0];
  const fields = [...new Map(group.fields.filter(field => field.key !== 'outfit_mode' || group.fields.length === 1).map(field => [desktopFieldTarget(props.section.key, field.key), field])).keys()]
    .map(key => props.section.fields.find(field => field.key === key) || group.fields.find(field => desktopFieldTarget(props.section.key, field.key) === key));
  const active = fields.find(field => field.key === fieldKey) || fields.find(field => props.section.key !== 'wardrobe' || !wardrobeFieldDisabled(field.key, props.value)) || fields[0];
  return <div className="space-y-3" data-testid="desktop-focused-editor">
    <nav className="desktop-detail-navigation sticky top-20 z-20 rounded-xl border border-white/10 bg-[#12141C]/95 p-3 backdrop-blur" aria-label={`${props.section.title} editing groups`}>
      <details className="desktop-detail-search"><summary>Find a detail</summary>{searchControl}</details>
      <p className="mt-3 mb-2 text-xs text-zinc-400">{props.section.title} / <span className="text-white">{group.label}</span> · choose one detail to edit</p>
      <div className="flex flex-wrap gap-2">{matchingGroups.map(item => <button key={item.key} type="button"
        aria-pressed={group.key === item.key} onClick={() => { setGroupKey(item.key); setFieldKey(''); }}
        className={`chip ${group.key === item.key ? 'active' : ''}`}>{item.label}</button>)}</div>
    </nav>
    {matchingGroups.length>0 && <DetailNavigator fields={fields.map(field=>({...field,label:`${field.label}${props.fieldLocks?.[field.key]?' · locked':''}`}))} value={active.key}
      onChange={key=>{setFieldKey(key);if(props.collapsed)props.onToggleCollapsed?.();}} summary={selectionSummary(active,props.value || {},props.section.key)}/>}
    {matchingGroups.length ? <DnaSection {...props} focusedField={active.key} />
      : <p role="status" className="rounded-xl border hairline p-4 text-sm text-zinc-400">No matching details in this view. Clear your search{props.simpleMode ? ' or open all controls' : ''}.</p>}
    {props.simpleMode && simpleFields.length < props.section.fields.length && <button type="button"
      className="min-h-11 w-full rounded-xl border border-dashed hairline p-3 text-sm text-cyan-200"
      onClick={props.onRequestAdvanced}>Show all {props.section.title.toLowerCase()} controls</button>}
  </div>;
}
