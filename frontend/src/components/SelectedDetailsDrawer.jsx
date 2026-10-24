import {useRef} from 'react';
import SelectedDetails from './SelectedDetails';
export default function SelectedDetailsDrawer({items,onEdit}) {
  const dialog = useRef(null);
  const trigger = useRef(null);
  const close = () => {dialog.current?.close(); trigger.current?.focus();};
  return <>
    <button ref={trigger} type="button" className="chip min-h-11" onClick={()=>dialog.current?.showModal()}>Selected details ({items.length})</button>
    <dialog ref={dialog} className="selected-details-drawer" aria-labelledby="selected-details-heading" onClick={event=>{if(event.target===event.currentTarget) close();}}>
      <div className="selected-details-drawer-inner">
        <header><h2 id="selected-details-heading">Selected details</h2><button type="button" className="chip min-h-11" onClick={close} autoFocus>Close</button></header>
        <SelectedDetails items={items} onEdit={item=>{close();onEdit(item);}} />
      </div>
    </dialog>
  </>;
}
