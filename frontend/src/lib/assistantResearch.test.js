import { api } from './api';
import { getAssistantResearch, updateAssistantResearch, researchableRequest } from './assistantResearch';
beforeEach(()=>updateAssistantResearch({enabled:false,focus:'',result:null}));
const capture=()=>{const seen=[];api.defaults.adapter=async config=>{seen.push(config);return {data:{prompt:'same assistant response'},status:200,statusText:'OK',headers:{},config};};return seen;};
test('research is off by default and applies only to interactive AI posts',async()=>{
 expect(researchableRequest('/media-library/media/7/reanalyze')).toBe(true);
 const seen=capture();await api.post('/ai/scene-draft',{text:'private prompt'});
 expect(seen[0].headers['X-Ultra-Web-Research']).toBeUndefined();
 updateAssistantResearch({enabled:true,focus:'historic lighting'});
 await api.post('/ai/scene-draft',{text:'private prompt'});
 expect(seen[1].headers['X-Ultra-Web-Research']).toBe('1');
 expect(seen[1].headers['X-Ultra-Research-Focus']).toBe('historic%20lighting');
 expect(JSON.parse(seen[1].data)).toEqual({text:'private prompt'});
 await api.post('/ai/research',{query:'manual question'});await api.post('/renders/id/recover',{});
 expect(seen[2].headers['X-Ultra-Web-Research']).toBeUndefined();expect(seen[3].headers['X-Ultra-Web-Research']).toBeUndefined();
});
test('explicit researched prompting is not searched twice',async()=>{
 const seen=capture();updateAssistantResearch({enabled:true});
 await api.post('/ai/video-prompt',{instruction:'move',use_web_research:true});
 expect(seen[0].headers['X-Ultra-Web-Research']).toBeUndefined();
});
test('actual retrieved links are made available without replacing the response',async()=>{
 updateAssistantResearch({enabled:true});
 const result={sources:[{id:'S1',url:'https://author.example',title:'Guide'}]};
 api.defaults.adapter=async config=>({data:{prompt:'original answer'},status:200,statusText:'OK',headers:{'x-ultra-research-result':btoa(JSON.stringify(result))},config});
 const response=await api.post('/ai/edit-prompt',{});
 expect(response.data.prompt).toBe('original answer');expect(getAssistantResearch().result).toEqual(result);
});
