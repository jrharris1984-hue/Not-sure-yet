import { act } from 'react';
import { createRoot } from 'react-dom/client';
import PromptAlignmentCard from './PromptAlignmentCard';

test('compact requirements expose every subject age and expand hidden details', () => {
  const mustMatch = [
    {key:'A:identity.gender',label:'Subject A Gender',value:'female'},
    {key:'A:identity.age',label:'Subject A Age',value:75},
    {key:'A:physique.body_type',label:'Subject A Body Type',value:'apple'},
    {key:'A:pose.action',label:'Subject A Action',value:'standing'},
    {key:'B:identity.gender',label:'Subject B Gender',value:'male'},
    {key:'B:identity.age',label:'Subject B Age',value:45},
  ];
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement('div');
  const root = createRoot(container);
  act(() => root.render(<PromptAlignmentCard analysis={{alignmentScore:100,alignmentLabel:'Good match',mustCount:6}} priorityPlan={{mustMatch}}/>));
  expect(container.textContent).toContain('Subject A Age: 75');
  expect(container.textContent).toContain('Subject B Age: 45');
  expect(container.textContent).not.toContain('Subject B Gender: male');
  expect(container.querySelector('button').textContent).toBe('Show 1 more');
  act(() => container.querySelector('button').click());
  expect(container.textContent).toContain('Subject B Gender: male');
  expect(container.querySelector('button').getAttribute('aria-expanded')).toBe('true');
  act(() => container.querySelector('button').click());
  expect(container.textContent).toContain('Subject B Age: 45');
  act(() => root.unmount());
});
