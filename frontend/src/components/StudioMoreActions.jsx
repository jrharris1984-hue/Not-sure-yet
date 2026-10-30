import {useEffect,useRef} from 'react';
import {MoreHorizontal} from 'lucide-react';

export default function StudioMoreActions({children}) {
  const menu=useRef(null);
  useEffect(()=>{
    const dismiss=event=>{if(menu.current && !menu.current.contains(event.target))menu.current.open=false;};
    document.addEventListener('pointerdown',dismiss);
    return ()=>document.removeEventListener('pointerdown',dismiss);
  },[]);
  return <details ref={menu} className="studio-more-actions" onKeyDown={event=>{
    if(event.key==='Escape' && !event.target.closest('dialog')) {
      event.stopPropagation();menu.current.open=false;menu.current.querySelector('summary')?.focus();
    }
  }}>
    <summary><MoreHorizontal size={18} aria-hidden="true"/><span>More</span></summary>
    <div className="studio-more-panel" aria-label="More studio actions">{children}</div>
  </details>;
}
