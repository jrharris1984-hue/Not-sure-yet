import {act} from 'react';
import {createRoot} from 'react-dom/client';
import CharacterPicker from './CharacterPicker';
import {endpoints} from '@/lib/api';
const mockNavigate=jest.fn();
jest.mock('react-router-dom',()=>({Link:({to,children,...props})=><a href={to} {...props}>{children}</a>,useNavigate:()=>mockNavigate}),{virtual:true});
jest.mock('@/lib/api',()=>({API_BASE:'/api',endpoints:{listCharacters:jest.fn(),duplicateCharacter:jest.fn(),updateCharacter:jest.fn()}}));
let root,container;
beforeEach(()=>{global.IS_REACT_ACT_ENVIRONMENT=true;container=document.createElement('div');document.body.appendChild(container);root=createRoot(container);jest.clearAllMocks();});
afterEach(()=>{act(()=>root.unmount());container.remove();});
const rows=[{id:'a',name:'Alex',favorite:true,tags:['studio'],dna:{identity:{archetype:'artist'}}},{id:'b',name:'Blair',tags:['outdoor'],dna:{identity:{archetype:'athlete'}}}];
async function paint(props={}){await act(async()=>root.render(<CharacterPicker onClose={jest.fn()} {...props}/>));}
const click=async text=>{await act(async()=>[...container.querySelectorAll('button')].find(b=>b.textContent===text).click());};
test('filters locally, displays clear reuse actions and duplicates without editing the original',async()=>{
 endpoints.listCharacters.mockResolvedValue(rows);endpoints.duplicateCharacter.mockResolvedValue({id:'copy'});
 await paint();expect(container.querySelectorAll('article')).toHaveLength(2);
 await click('Favorites');expect(container.querySelectorAll('article')).toHaveLength(1);
 expect(container.querySelector('a[href="/character/a"]')).not.toBeNull();
 await click('Make a copy');expect(endpoints.duplicateCharacter).toHaveBeenCalledWith('a');expect(mockNavigate).toHaveBeenCalledWith('/character/copy');
 expect(endpoints.updateCharacter).not.toHaveBeenCalled();
});
test('photoshoot choices carry the chosen character to the existing shoot flow',async()=>{
 endpoints.listCharacters.mockResolvedValue(rows);await paint({intent:'shoot'});
 expect(container.querySelector('a[href="/shoots?character=a"]')).not.toBeNull();
 const input=container.querySelector('input[type="search"]');
 act(()=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'outdoor');input.dispatchEvent(new Event('input',{bubbles:true}));});
 expect(container.querySelectorAll('article')).toHaveLength(1);expect(container.textContent).toContain('Blair');
 expect(endpoints.listCharacters).toHaveBeenCalledTimes(1);
});
test('load failures offer retry and empty libraries offer a starting point',async()=>{
 endpoints.listCharacters.mockRejectedValueOnce(new Error('offline')).mockResolvedValue([]);
 await paint();expect(container.querySelector('[role="alert"]')).not.toBeNull();
 await click('Try again');expect(container.textContent).toContain('Your character collection starts here');expect(container.querySelector('a[href="/character/new"]')).not.toBeNull();
});
test('large collections reveal more cards on demand without repeating the request',async()=>{
 endpoints.listCharacters.mockResolvedValue(Array.from({length:15},(_,i)=>({id:String(i),name:`Person ${i}`})));
 await paint();expect(container.querySelectorAll('article')).toHaveLength(12);
 await click('Show more characters (3 remaining)');expect(container.querySelectorAll('article')).toHaveLength(15);
 expect(endpoints.listCharacters).toHaveBeenCalledTimes(1);
});
