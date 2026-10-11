import { api } from './api';
import { updateAssistantResearch, researchableRequest, getAssistantResearch } from './assistantResearch';

beforeEach(() => updateAssistantResearch({ enabled: false }));

const capture = () => {
  const seen = [];
  api.defaults.adapter = async config => {
    seen.push(config);
    return { data: { prompt: 'same assistant response' }, status: 200, statusText: 'OK', headers: {}, config };
  };
  return seen;
};

test('Ollama internet access is off by default and can be enabled globally', async () => {
  expect(researchableRequest('/media-library/media/7/reanalyze')).toBe(true);
  const seen = capture();

  await api.post('/ai/scene-draft', { text: 'private prompt' });
  expect(seen[0].headers['X-Ultra-Web-Research']).toBeUndefined();

  updateAssistantResearch({ enabled: true });
  await api.post('/ai/scene-draft', { text: 'private prompt' });
  expect(seen[1].headers['X-Ultra-Web-Research']).toBe('1');
  expect(seen[1].headers['X-Ultra-Research-Focus']).toBeUndefined();
  expect(JSON.parse(seen[1].data)).toEqual({ text: 'private prompt' });

  await api.post('/ai/research', { query: 'manual question' });
  await api.post('/renders/id/recover', {});
  expect(seen[2].headers['X-Ultra-Web-Research']).toBeUndefined();
  expect(seen[3].headers['X-Ultra-Web-Research']).toBeUndefined();
});

test('research source headers reach both the suggestion and shared research panel', async () => {
  updateAssistantResearch({enabled:true});
  const research={sources:[{id:'S1', title:'Guide', url:'https://author.example/guide', cited:false}]};
  api.defaults.adapter=async config=>({data:{prompt:'Keep this suggestion'},status:200,headers:{'x-ultra-research-result':btoa(JSON.stringify(research))},config});
  const response=await api.post('/ai/video-prompt',{});
  expect(response.data).toEqual({prompt:'Keep this suggestion',research});
  expect(getAssistantResearch().result).toEqual(research);
});
test('missing or malformed optional research metadata preserves assistant output and clears stale sources', async () => {
  updateAssistantResearch({enabled:true,result:{sources:[{id:'OLD'}]}});
  for (const header of [undefined,'invalid base64','e30=']) {
    api.defaults.adapter=async config=>({data:{prompt:'Valid suggestion'},status:200,headers:{'x-ultra-research-result':header},config});
    expect((await api.post('/ai/video-prompt',{})).data).toEqual({prompt:'Valid suggestion'});
    expect(getAssistantResearch().result).toBeNull();
  }
});
test('turning research off removes a header carried by a retried request', async () => {
  const seen=capture();
  await api.post('/ai/video-prompt',{}, {headers:{'X-Ultra-Web-Research':'1'}});
  expect(seen[0].headers['X-Ultra-Web-Research']).toBeUndefined();
});
