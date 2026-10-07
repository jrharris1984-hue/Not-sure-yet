import { api } from './api';
import { updateAssistantResearch, researchableRequest } from './assistantResearch';

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
