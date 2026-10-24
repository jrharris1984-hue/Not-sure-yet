import {act} from 'react';
import {createRoot} from 'react-dom/client';
import DesignCategoryNavigation from './DesignCategoryNavigation';
let root,container;
beforeEach(()=>{global.IS_REACT_ACT_ENVIRONMENT=true;container=document.createElement('div');document.body.appendChild(container);root=createRoot(container);});
afterEach(()=>{act(()=>root.unmount());container.remove();});
test('retains uncategorized custom sections and calls the chosen destination without changing data',()=>{
  const onSection=jest.fn(),onReview=jest.fn();
  act(()=>root.render(<DesignCategoryNavigation stages={[{key:'people',title:'People',sections:['identity']}]} sections={[{key:'identity',title:'Identity'},{key:'custom',title:'My custom category'}]} activeSection="identity" onSection={onSection} onReview={onReview}/>));
  expect(container.querySelector('[aria-current="page"]').textContent).toBe('Identity');
  act(()=>[...container.querySelectorAll('button')].find(b=>b.textContent==='My custom category').click());
  expect(onSection).toHaveBeenCalledWith('custom');
  act(()=>[...container.querySelectorAll('button')].find(b=>b.textContent==='Review & create').click());
  expect(onReview).toHaveBeenCalledTimes(1);
});

test('an empty category search can be cleared without navigating or editing data', () => {
  const onSection=jest.fn();
  act(()=>root.render(<DesignCategoryNavigation stages={[]} sections={[{key:'hair',title:'Hair'}]} activeSection="hair" onSection={onSection}/>));
  const input=container.querySelector('input');
  act(()=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'unavailable category');input.dispatchEvent(new Event('input',{bubbles:true}));});
  expect(container.querySelector('[role="status"]').textContent).toContain('No matching categories');
  act(()=>[...container.querySelectorAll('button')].find(button=>button.textContent==='Clear search').click());
  expect(container.querySelector('[aria-current="page"]').textContent).toBe('Hair');
  expect(onSection).not.toHaveBeenCalled();
});
