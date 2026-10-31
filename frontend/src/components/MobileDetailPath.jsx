import {useLayoutEffect} from 'react';

// Both standard details and wardrobe use the same reading order.
export default function MobileDetailPath({groups,value,onChange,path,label='Character detail'}) {
  const fields=groups.flatMap(group=>group.fields);
  const index=fields.findIndex(field=>field.key===value);
  const move=direction=>{
    const next=fields[index+direction];
    if(next)onChange(next.key);
    else path.cross(direction);
  };
  const entry=path.entry;
  useLayoutEffect(()=>{
    if(!entry)return;
    const field=entry.edge==='last'?fields[fields.length-1]:fields[0];
    if(field)onChange(field.key);
    path.consume();
    // Apply a boundary crossing once, never on subsequent character edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[entry]);
  return <nav className="mobile-detail-path" aria-label="Guided editing">
    <button type="button" aria-label="Previous editing step" disabled={index<=0 && !path.previous} onClick={()=>move(-1)}>‹ Previous</button>
    <label><small>{path.category}{fields.length>0?` · ${index+1}/${fields.length}`:''}</small>
      {fields.length>0 && <select aria-label={label} value={value} onChange={e=>onChange(e.target.value)}>{groups.map(group=><optgroup key={group.key} label={group.label}>{group.fields.map(field=><option key={field.key} value={field.key}>{field.label}</option>)}</optgroup>)}</select>}
    </label>
    <button type="button" aria-label="Next editing step" disabled={index>=fields.length-1 && !path.next} onClick={()=>move(1)}>Next ›</button>
  </nav>;
}
