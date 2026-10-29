import {act} from 'react';
import {createRoot} from 'react-dom/client';
import WardrobeOverview,{wardrobeOverview} from './WardrobeOverview';
import {SECTIONS} from '@/lib/dna';
import {setPromptCatalog} from '@/lib/promptCatalog';
const fields=SECTIONS.find(section=>section.key==='wardrobe').fields;
afterEach(()=>setPromptCatalog({sections:[]}));
test('full outfit summary excludes saved separates and never changes them',()=>{
  const value={outfit_mode:'full',outfit_set:'navy suit and loafers',set_lingerie_mode:'none',top:'red shirt',footwear:'sneakers'};
  const before=JSON.stringify(value),result=wardrobeOverview(value,fields);
  expect(result.active.some(item=>item.value==='navy suit and loafers')).toBe(true);
  expect(result.active.some(item=>['top','footwear'].includes(item.key))).toBe(false);
  expect(result.inactive.map(item=>item.key)).toEqual(expect.arrayContaining(['top','footwear']));
  expect(JSON.stringify(value)).toBe(before);
});
test('summary resolves a competing dress and separates using the existing priority rules',()=>{
  const result=wardrobeOverview({outfit_mode:'custom',dress_style:'evening gown',top:'blue shirt',bottom:'black trousers',garment_priority:'separates'},fields);
  expect(result.active.find(item=>item.key==='top').value).toBe('blue shirt');
  expect(result.active.some(item=>item.key==='dress_style')).toBe(false);
  expect(result.notes.join(' ')).toContain('saved dress is inactive');
});
test('custom display labels and unknown garment descriptions survive',()=>{
  const result=wardrobeOverview({outfit_mode:'custom',top:'custom_top'},[{key:'top',label:'Top',optionLabels:{custom_top:'My embroidered jacket'}}]);
  expect(result.active[0].value).toBe('My embroidered jacket');
});
test('mode buttons respect locks and only request an explicit mode change',()=>{
  global.IS_REACT_ACT_ENVIRONMENT=true;
  const container=document.createElement('div'),root=createRoot(container),change=jest.fn(),toggle=jest.fn();
  try {
    act(()=>root.render(<WardrobeOverview fields={fields} value={{outfit_mode:'full'}} disabled onModeChange={change} onShowInactive={toggle}/>));
    act(()=>container.querySelector('[data-testid="wardrobe-mode-custom"]').click());expect(change).not.toHaveBeenCalled();
    act(()=>root.render(<WardrobeOverview fields={fields} value={{outfit_mode:'full'}} onModeChange={change} onShowInactive={toggle}/>));
    act(()=>container.querySelector('[data-testid="wardrobe-mode-custom"]').click());expect(change).toHaveBeenCalledWith('custom');
    act(()=>[...container.querySelectorAll('button')].find(b=>b.textContent.includes('Show inactive')).click());expect(toggle).toHaveBeenCalledWith(true);
  } finally {act(()=>root.unmount());}
});
