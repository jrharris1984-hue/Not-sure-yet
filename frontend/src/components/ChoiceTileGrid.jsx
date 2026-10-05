import { Check, Smile, Shirt, Palette, Sparkles } from 'lucide-react';
import PoseIcon from './PoseIcon';

export default function ChoiceTileGrid({ field, sectionKey, value, onChange, query = '', disabled = false }) {
  const options = [...new Set([...(field.options || []), ...(field.groups || []).flatMap(group => group.options || [])])];
  const label = option => field.optionLabels?.[option] || option;
  const visible = options.filter(option => `${option} ${label(option)}`.toLowerCase().includes(query.trim().toLowerCase()));
  const Icon = sectionKey === 'face' ? Smile : sectionKey === 'wardrobe' ? Shirt : ['hair', 'skin', 'lighting'].includes(sectionKey) ? Palette : Sparkles;
  return <div className="grid grid-cols-2 gap-2" aria-label={`${field.label} choices`}>
    {visible.map(option => {
      const selected = Array.isArray(value) ? value.includes(option) : value === option;
      return <button key={option} type="button" aria-pressed={selected} disabled={disabled}
        data-testid={`tile-${sectionKey}-${field.key}-${option.replace(/\s+/g, '-')}`}
        onClick={() => onChange(field.type === 'chips_multi'
          ? selected ? (value || []).filter(item => item !== option) : [...(Array.isArray(value) ? value : []), option]
          : selected ? '' : option)}
        className={`relative flex min-h-[88px] min-w-0 flex-col items-center justify-center gap-2 rounded-xl border-2 px-2 py-3 text-center text-xs transition-colors disabled:opacity-40 ${selected ? 'border-cyan-400 bg-cyan-400/10 text-cyan-100' : 'border-zinc-800 bg-[#171720] text-zinc-300'}`}>
        {selected && <Check className="absolute right-2 top-2 h-3.5 w-3.5 text-cyan-300" aria-hidden="true" />}
        {field.type === 'pose_chips' ? <PoseIcon name={option} size={38} active={selected} /> : <Icon className="h-5 w-5 opacity-70" aria-hidden="true" />}
        <span className="break-words font-medium">{label(option)}</span>
      </button>;
    })}
    {!visible.length && <p className="col-span-2 py-6 text-center text-xs text-zinc-500">No matching choices.</p>}
  </div>;
}
