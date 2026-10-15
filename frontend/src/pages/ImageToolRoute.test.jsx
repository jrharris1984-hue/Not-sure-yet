import {act} from 'react';
import {createRoot} from 'react-dom/client';
import ImageToolRoute from './ImageToolRoute';
let mockQuery;
jest.mock('react-router-dom',()=>({useParams:()=>({workflowId:'tool'}),Link:({children})=><a>{children}</a>}),{virtual:true});
jest.mock('@tanstack/react-query',()=>({useQuery:()=>mockQuery}));
jest.mock('@/lib/api',()=>({endpoints:{listWorkflows:jest.fn()}}));
jest.mock('@/pages/Builder',()=>()=> <div>Existing builder</div>);
jest.mock('@/pages/ReferenceImageEditor',()=>({__esModule:true,default:()=> <div>Reference editor</div>,REFERENCE_EDIT_STYLES:['flux2_klein_edit','qwen_reference']}));
let container,root;
beforeEach(()=>{global.IS_REACT_ACT_ENVIRONMENT=true;container=document.createElement('div');root=createRoot(container);});
afterEach(()=>act(()=>root.unmount()));
test.each(['flux2_klein_edit','qwen_reference','qwen_edit'])('%s opens the appropriate editor',async style=>{
  mockQuery={data:[{id:'tool',prompt_style:style}]};
  await act(async()=>root.render(<ImageToolRoute/>));
  expect(container.textContent).toContain(style==='qwen_edit'?'Existing builder':'Reference editor');
});
test('missing workflow returns a useful message',async()=>{
  mockQuery={data:[]};await act(async()=>root.render(<ImageToolRoute/>));
  expect(container.textContent).toContain('no longer available');
});
