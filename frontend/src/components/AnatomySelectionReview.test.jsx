import {act} from 'react';
import {createRoot} from 'react-dom/client';
import AnatomySelectionReview from './AnatomySelectionReview';
let container,root;
beforeEach(()=>{global.IS_REACT_ACT_ENVIRONMENT=true;container=document.createElement('div');root=createRoot(container);});
afterEach(()=>act(()=>root.unmount()));
const value={areolas:'large brown',areola_size:'small areolas'};
const props={value,catalog:{sections:[]},fields:[],locks:{}};
test('review does not mutate saved choices until cleanup is applied',()=>{
  const onChange=jest.fn();
  act(()=>root.render(<AnatomySelectionReview {...props} onChange={onChange}/>));
  expect(container.textContent).toContain('Overlapping selections found');
  expect(onChange).not.toHaveBeenCalled();
  act(()=>container.querySelector('button').click());
  expect(onChange).toHaveBeenCalledWith({areolas:'',areola_size:'small areolas',areola_color:'warm brown areolas'});
  expect(value.areolas).toBe('large brown');
});
test('locked selections disable cleanup and explain why',()=>{
  act(()=>root.render(<AnatomySelectionReview {...props} locks={{areola_size:true}} onChange={jest.fn()}/>));
  expect(container.querySelector('button').disabled).toBe(true);
  expect(container.textContent).toContain('Unlock the preset');
});
