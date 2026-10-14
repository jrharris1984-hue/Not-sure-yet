import { useState } from 'react';
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

export default function DesktopDnaEditor({ enabled, ...props }) {
  const groups = desktopEditingGroups(props.section);
  const [groupKey, setGroupKey] = useState('');
  const [fieldKey, setFieldKey] = useState('');
  if (!enabled || !groups.length || props.focusedField) return <DnaSection {...props} />;
  const group = groups.find(item => item.key === groupKey) || groups[0];
  const fields = [...new Map(group.fields.filter(field => field.key !== 'outfit_mode').map(field => [desktopFieldTarget(props.section.key, field.key), field])).keys()]
    .map(key => props.section.fields.find(field => field.key === key) || group.fields.find(field => desktopFieldTarget(props.section.key, field.key) === key));
  const active = fields.find(field => field.key === fieldKey) || fields.find(field => props.section.key !== 'wardrobe' || !wardrobeFieldDisabled(field.key, props.value)) || fields[0];
  return <div className="space-y-3" data-testid="desktop-focused-editor">
    <nav className="sticky top-20 z-20 rounded-xl border border-white/10 bg-[#12141C]/95 p-3 backdrop-blur" aria-label={`${props.section.title} editing groups`}>
      <p className="mb-2 text-xs text-zinc-400">{props.section.title} / <span className="text-white">{group.label}</span> · choose one detail to edit</p>
      <div className="flex flex-wrap gap-2">{groups.map(item => <button key={item.key} type="button"
        aria-pressed={group.key === item.key} onClick={() => { setGroupKey(item.key); setFieldKey(''); }}
        className={`chip ${group.key === item.key ? 'active' : ''}`}>{item.label}</button>)}</div>
    </nav>
    <div className="grid grid-cols-2 gap-2" aria-label={`${group.label} details`}>
      {fields.map(field => {
        const unavailable = props.section.key === 'wardrobe' && wardrobeFieldDisabled(field.key, props.value);
        return <button key={field.key} type="button" aria-pressed={active.key === field.key}
          onClick={() => { setFieldKey(field.key); if (props.collapsed) props.onToggleCollapsed?.(); }} data-testid={`desktop-edit-${field.key}`}
          className={`min-w-0 rounded-xl border p-3 text-left ${active.key === field.key ? 'border-cyan-400/60 bg-cyan-400/10' : 'border-white/10 bg-black/10'}`}>
          <span className="block text-xs font-semibold text-white">{field.label}</span>
          <span className="mt-1 block truncate text-xs text-zinc-400" title={selectionSummary(field, props.value || {}, props.section.key)}>{selectionSummary(field, props.value || {}, props.section.key)}</span>
          {unavailable && <span className="mt-1 block text-[10px] text-amber-200">Controlled by outfit mode</span>}
          {props.fieldLocks?.[field.key] && <span className="mt-1 block text-[10px] text-amber-200">Locked</span>}
        </button>;
      })}
    </div>
    <DnaSection {...props} focusedField={active.key} />
  </div>;
}
