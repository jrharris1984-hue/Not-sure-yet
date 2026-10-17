import { act } from 'react';
import { createRoot } from 'react-dom/client';
import RenderSetupDetails from './RenderSetupDetails';
import { endpoints } from '@/lib/api';
jest.mock('@/lib/api', () => ({ endpoints: { listWorkflows: jest.fn(), compareWorkflow: jest.fn() } }));
let container, root;
beforeEach(() => { global.IS_REACT_ACT_ENVIRONMENT = true; container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); jest.clearAllMocks(); });
afterEach(() => { act(() => root.unmount()); container.remove(); });
test('shows dispatched components and distinguishes absent historical metadata', () => {
  act(() => root.render(<RenderSetupDetails render={{id:'a', model_setup:{models:['actual-model'], encoders:['actual-encoder'], vaes:['actual-vae'], loras:[{name:'adapter',strength_model:.4}], sampling:[{node_id:'7',type:'KSampler',steps:8,cfg:1}]}}}/>));
  expect(container.textContent).toContain('actual-model');
  expect(container.textContent).toContain('actual-encoder');
  expect(container.textContent).toContain('adapter · model 0.4');
  expect(container.textContent).toContain('steps: 8');
  act(() => root.render(<RenderSetupDetails render={{id:'old'}}/>));
  expect(container.textContent).toContain('no component snapshot');
});
test('loads eligible workflows on demand and queues from the selected source', async () => {
  endpoints.listWorkflows.mockResolvedValue([{id:'target',name:'Krea',kind:'image',prompt_style:'krea2'}, {id:'video',kind:'video',prompt_style:'wan_t2v'}]);
  endpoints.compareWorkflow.mockResolvedValue({id:'queued'});
  act(() => root.render(<RenderSetupDetails render={{id:'source'}} compare/>));
  expect(endpoints.listWorkflows).not.toHaveBeenCalled();
  await act(async () => { const details=container.querySelector('details'); details.open=true; details.dispatchEvent(new Event('toggle')); });
  expect(container.querySelectorAll('option')).toHaveLength(2);
  act(() => { const select=container.querySelector('select'); select.value='target'; select.dispatchEvent(new Event('change',{bubbles:true})); });
  await act(async () => container.querySelector('button').click());
  expect(endpoints.compareWorkflow).toHaveBeenCalledWith('source','target');
  expect(container.textContent).toContain('Comparison queued');
});
