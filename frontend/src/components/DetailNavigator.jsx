import {useId,useRef,useState} from 'react';
import {LayoutGrid,ChevronLeft,ChevronRight} from 'lucide-react';
export default function DetailNavigator({fields,value,onChange,label='Editing detail',summary}) {
  const [expanded,setExpanded]=useState(false);
  const pickerId=useId(), trigger=useRef(null);
  const choose=key=>{onChange(key);setExpanded(false);trigger.current?.focus();};
  const index=fields.findIndex(field=>field.key===value);
  return <div className="detail-navigator">
    <label className="detail-navigator-select"><span>Editing</span><select aria-label={label} value={value} onChange={event=>onChange(event.target.value)}>{fields.map(field=><option key={field.key} value={field.key}>{field.label}</option>)}</select></label>
    <div className="detail-navigator-actions">{fields.length>3 && <button ref={trigger} type="button" className="detail-map-toggle" aria-expanded={expanded} aria-controls={pickerId} onClick={()=>setExpanded(open=>!open)}><LayoutGrid size={15} aria-hidden="true"/><span>All details</span></button>}<button type="button" aria-label="Previous detail" title="Previous detail" disabled={index<=0} onClick={()=>onChange(fields[index-1].key)}><ChevronLeft size={18}/></button><span>{index+1} / {fields.length}</span><button type="button" aria-label="Next detail" title="Next detail" disabled={index<0 || index>=fields.length-1} onClick={()=>onChange(fields[index+1].key)}><ChevronRight size={18}/></button></div>
    {fields.length>3 && expanded && <div id={pickerId} className="detail-map" role="group" aria-label="Choose a detail" onKeyDown={event=>{if(event.key==='Escape'){event.stopPropagation();setExpanded(false);trigger.current?.focus();}}}>
      {fields.map(field=><button type="button" key={field.key} aria-pressed={value===field.key} onClick={()=>choose(field.key)}>{field.label}<ChevronRight size={14} aria-hidden="true"/></button>)}
    </div>}
    {summary && <p className="workspace-current-value">{summary}</p>}
  </div>;
}
