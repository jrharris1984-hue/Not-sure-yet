import {Children, Fragment, isValidElement, useState} from 'react';

// Keep panels mounted so switching tools does not discard drafts or scan results.
export default function WorkspaceToolSections({children}) {
  const flatten=items=>Children.toArray(items).flatMap(item=>isValidElement(item) && item.type===Fragment?flatten(item.props.children):isValidElement(item)?[item]:[]);
  const panels=flatten(children);
  const panelId=(panel,index)=>panel.props['data-tool-id'] || String(index);
  const [selected,setSelected]=useState('');
  const active=panels.find((panel,index)=>panelId(panel,index)===selected) || panels[0];
  return <div className="workspace-tool-sections">
    <nav aria-label="Tool categories" className="workspace-tool-navigation">
      {panels.map((panel,index)=>{const id=panel.props['data-tool-id'] || String(index);return <button type="button" key={id} aria-pressed={panel===active} onClick={()=>setSelected(id)}>{panel.props['data-tool-label'] || `Tools ${index+1}`}</button>;})}
    </nav>
    {panels.map((panel,index)=>{
      const contents=panel.type==='details' ? Children.toArray(panel.props.children).filter(child=>!isValidElement(child) || child.type!=='summary') : panel;
      return <section key={panel.props['data-tool-id'] || index} hidden={panel!==active} className="workspace-tool-panel" aria-label={panel.props['data-tool-label'] || 'Tools'}>{contents}</section>;
    })}
  </div>;
}
