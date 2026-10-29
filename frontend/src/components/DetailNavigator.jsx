import {ChevronLeft,ChevronRight} from 'lucide-react';
export default function DetailNavigator({fields,value,onChange,label='Editing detail',summary}) {
  const index=fields.findIndex(field=>field.key===value);
  return <div className="detail-navigator">
    <label className="detail-navigator-select"><span>Editing</span><select aria-label={label} value={value} onChange={event=>onChange(event.target.value)}>{fields.map(field=><option key={field.key} value={field.key}>{field.label}</option>)}</select></label>
    <div className="detail-navigator-actions"><button type="button" aria-label="Previous detail" title="Previous detail" disabled={index<=0} onClick={()=>onChange(fields[index-1].key)}><ChevronLeft size={18}/></button><span>{index+1} / {fields.length}</span><button type="button" aria-label="Next detail" title="Next detail" disabled={index<0 || index>=fields.length-1} onClick={()=>onChange(fields[index+1].key)}><ChevronRight size={18}/></button></div>
    {summary && <p className="workspace-current-value">{summary}</p>}
  </div>;
}
