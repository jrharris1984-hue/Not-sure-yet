import {useRef, useState} from 'react';
import SelectedDetails from './SelectedDetails';
export default function SelectedDetailsDrawer({items,onEdit}) {
  const [open, setOpen] = useState(false);
  const dialog = useRef(null);
  const trigger = useRef(null);
  const close = () => {dialog.current?.close(); setOpen(false); trigger.current?.focus();};
  return <>
    <button ref={trigger} type="button" className="chip min-h-11" onClick={()=>{setOpen(true);dialog.current?.showModal();}}>Selected details ({items.length})</button>
    <dialog ref={dialog} className="selected-details-drawer" aria-labelledby="selected-details-heading" onClose={()=>{setOpen(false);trigger.current?.focus();}} onCancel={()=>setOpen(false)} onClick={event=>{
      const bounds=event.currentTarget.getBoundingClientRect();
      if(event.target===event.currentTarget && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) close();
    }}>
      <div className="selected-details-drawer-inner">
        <header><h2 id="selected-details-heading">Selected details</h2><button type="button" className="chip min-h-11" onClick={close} autoFocus>Close</button></header>
        {open && <SelectedDetails items={items} onEdit={item=>{close();onEdit(item);}} />}
      </div>
    </dialog>
  </>;
}
