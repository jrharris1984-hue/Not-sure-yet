import { act } from 'react';
import { createRoot } from 'react-dom/client';
import AIResearchPanel from './AIResearchPanel';
import WebResearchSettings from './WebResearchSettings';
import { endpoints } from '@/lib/api';
jest.mock('react-router-dom',()=>({Link:({to,children,...props})=><a href={to} {...props}>{children}</a>}),{virtual:true});
jest.mock('@/lib/api',()=>({endpoints:{aiResearch:jest.fn(),researchConfig:jest.fn(),saveResearchKey:jest.fn(),removeResearchKey:jest.fn()}}));
let container,root;
beforeEach(()=>{global.IS_REACT_ACT_ENVIRONMENT=true;jest.clearAllMocks();container=document.createElement('div');root=createRoot(container);});
afterEach(()=>act(()=>root.unmount()));
const button=text=>[...container.querySelectorAll('button')].find(item=>item.textContent===text);
const input=async(label,text)=>act(async()=>{const element=container.querySelector(`[aria-label="${label}"]`);Object.getOwnPropertyDescriptor(element.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(element,text);element.dispatchEvent(new Event('input',{bubbles:true}));});
test('research runs explicitly, displays source links, and requires apply before changing a prompt',async()=>{
 const onApply=jest.fn();await act(async()=>root.render(<AIResearchPanel context="original prompt" onApply={onApply}/>));
 expect(endpoints.aiResearch).not.toHaveBeenCalled();
 await input('Research question','Official camera settings');
 endpoints.aiResearch.mockResolvedValue({answer:'Advice [S1]',suggested_prompt:'Candidate prompt',sources:[{id:'S1',title:'Author',url:'https://author.example/model',cited:true}]});
 await act(async()=>button('Search and research').click());
 expect(endpoints.aiResearch).toHaveBeenCalledWith('Official camera settings','original prompt');
 expect(onApply).not.toHaveBeenCalled();expect(container.querySelector('a[href="https://author.example/model"]')).not.toBeNull();
 await input('Research suggested prompt','Reviewed prompt');act(()=>button('Apply researched prompt').click());
 expect(onApply).toHaveBeenCalledWith('Reviewed prompt');
});
test('research errors are visible and never apply a prompt',async()=>{
 await act(async()=>root.render(<AIResearchPanel/>));await input('Research question','Model settings');
 endpoints.aiResearch.mockRejectedValue({response:{data:{detail:'Configure a search key'}}});
 await act(async()=>button('Search and research').click());expect(container.querySelector('[role="alert"]').textContent).toBe('Configure a search key');
 expect(button('Apply researched prompt')).toBeUndefined();
});
test('search keys are entered separately and cleared from the field after saving',async()=>{
 endpoints.researchConfig.mockResolvedValue({configured:false});endpoints.saveResearchKey.mockResolvedValue({configured:true});endpoints.removeResearchKey.mockResolvedValue({configured:false});
 await act(async()=>root.render(<WebResearchSettings/>));await input('Ollama web search API key','test-key');
 await act(async()=>button('Save search key').click());expect(endpoints.saveResearchKey).toHaveBeenCalledWith('test-key');
 expect(container.querySelector('input').value).toBe('');expect(container.textContent).not.toContain('test-key');
 await act(async()=>button('Remove search key').click());expect(endpoints.removeResearchKey).toHaveBeenCalledTimes(1);
});
