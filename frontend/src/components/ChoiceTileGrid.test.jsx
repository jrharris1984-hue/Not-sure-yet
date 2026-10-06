import { act } from 'react';
import { createRoot } from 'react-dom/client';
import ChoiceTileGrid from './ChoiceTileGrid';

test('named groups narrow choices and All restores every option, including ungrouped additions', () => {
  global.IS_REACT_ACT_ENVIRONMENT=true;
  const container=document.createElement('div');document.body.appendChild(container);const root=createRoot(container);
  const field={key:'material',label:'Material',type:'chips',options:['cotton','leather','linen'],groups:[{name:'Soft',options:['cotton']},{name:'Outerwear',options:['leather']}]};
  try {
    act(()=>root.render(<ChoiceTileGrid field={field} sectionKey="wardrobe" value="leather" onChange={()=>{}} />));
    expect(container.querySelectorAll('[data-testid^="tile-"]')).toHaveLength(3);
    act(()=>Array.from(container.querySelectorAll('button')).find(button=>button.textContent==='Soft (1)').click());
    expect(container.querySelectorAll('[data-testid^="tile-"]')).toHaveLength(1);
    act(()=>Array.from(container.querySelectorAll('button')).find(button=>button.textContent==='All (3)').click());
    expect(container.querySelectorAll('[data-testid^="tile-"]')).toHaveLength(3);
    expect(container.querySelector('[data-testid="tile-wardrobe-material-leather"]').getAttribute('aria-pressed')).toBe('true');
  } finally { act(()=>root.unmount());container.remove(); }
});
