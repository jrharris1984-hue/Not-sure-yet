import {act} from 'react';
import {createRoot} from 'react-dom/client';
import SelectionPromptAudit from './SelectionPromptAudit';

let container, root;
beforeEach(()=>{global.IS_REACT_ACT_ENVIRONMENT=true; container=document.createElement('div'); root=createRoot(container);});
afterEach(()=>act(()=>root.unmount()));
const manifest=[
  {key:'hair',label:'Hair · Color',value:'Black',expected:'black hair',terms:['black hair']},
  {key:'top',label:'Wardrobe · Top',value:'Blouse',inactive:'Complete set replaces the separate top.',terms:['blouse']},
  {key:'eyes',label:'Face · Eye color',value:'Blue',expected:'blue eyes',terms:['blue eyes']},
];

test('shows counts and inactive reasons without changing the prompt',()=>{
  act(()=>root.render(<SelectionPromptAudit positive="Portrait with black hair" manifest={manifest}/>));
  const details=container.querySelector('details');
  expect(details.open).toBe(false);
  expect(details.querySelector('summary').textContent).toContain('1 included · 1 inactive · 1 not detected');
  expect(container.querySelector('[data-status="inactive"]').textContent).toContain('Complete set replaces');
  expect(container.textContent).toContain('does not guarantee');
});

test('filters missing details and updates when an edited final prompt changes',()=>{
  act(()=>root.render(<SelectionPromptAudit positive="black hair" manifest={manifest}/>));
  const filter=container.querySelector('select');
  act(()=>{filter.value='missing'; filter.dispatchEvent(new Event('change',{bubbles:true}));});
  expect(container.querySelectorAll('li')).toHaveLength(1);
  expect(container.querySelector('li').textContent).toContain('Eye color');
  act(()=>root.render(<SelectionPromptAudit positive="black hair, blue eyes" manifest={manifest}/>));
  expect(container.querySelectorAll('li')).toHaveLength(0);
  expect(container.textContent).toContain('No selections in this group.');
  expect(container.querySelector('summary').textContent).toContain('2 included · 1 inactive · 0 not detected');
});

test('hides the checklist for workflows with no selection manifest',()=>{
  act(()=>root.render(<SelectionPromptAudit positive="Adjust lighting"/>));
  expect(container.textContent).toBe('');
});
