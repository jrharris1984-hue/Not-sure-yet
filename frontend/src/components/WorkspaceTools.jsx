import {useId,useRef,useState} from 'react';
import ToolPortalContext from './ToolPortalContext';
import WorkspaceToolSections from './WorkspaceToolSections';

export default function WorkspaceTools({compact,children}) {
  const dialog=useRef(null),trigger=useRef(null),heading=useId();
  const [visited,setVisited]=useState(false);
  const close=()=>{dialog.current?.close();trigger.current?.focus();};
  const content=typeof children==='function'?children({close}):children;
  if(!compact) return <>{content}</>;
  return <div className="workspace-tools-launcher" data-testid="workspace-tools">
    <button ref={trigger} type="button" className="chip min-h-11" aria-haspopup="dialog" onClick={()=>{setVisited(true);dialog.current?.showModal();}}>Tools <span>Presets, randomizers & assistant</span></button>
    <dialog ref={dialog} className="workspace-tools-drawer" aria-labelledby={heading} onClose={()=>trigger.current?.focus()} onClick={event=>{
      const bounds=event.currentTarget.getBoundingClientRect();
      if(event.target===event.currentTarget && (event.clientX<bounds.left || event.clientX>bounds.right || event.clientY<bounds.top || event.clientY>bounds.bottom))close();
    }}>
      <header><div><h2 id={heading}>Tools</h2><p>Choose a tool. Your editing choices stay saved.</p></div><button type="button" className="chip min-h-11" onClick={close} autoFocus>Close</button></header>
      {visited && <ToolPortalContext.Provider value={dialog}><WorkspaceToolSections>{content}</WorkspaceToolSections></ToolPortalContext.Provider>}
    </dialog>
  </div>;
}
