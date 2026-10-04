import { act } from 'react';
import { createRoot } from 'react-dom/client';
import VariationInstruction from './VariationInstruction';
import { endpoints } from '@/lib/api';
jest.mock('@/lib/api', () => ({ endpoints: { aiEditPrompt: jest.fn() } }));
let root, container;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div'); document.body.appendChild(container);
  root = createRoot(container); endpoints.aiEditPrompt.mockReset();
});
afterEach(() => { act(() => root.unmount()); container.remove(); });
test('asks AI for a variation instruction and requires review before changing the dispatched wording', async () => {
  const onChange = jest.fn();
  endpoints.aiEditPrompt.mockResolvedValue({ prompt: 'A subtle smile. Keep all other details unchanged.' });
  act(() => root.render(<VariationInstruction value="a slight smile" onChange={onChange} aiProvider="Ollama" />));
  await act(async () => container.querySelector('[data-testid="btn-clarify-variation"]').click());
  expect(endpoints.aiEditPrompt).toHaveBeenCalledWith('a slight smile', true, 'variation');
  expect(onChange).not.toHaveBeenCalled();
  expect(container.querySelector('[aria-label="AI variation suggestion"]').value).toContain('subtle smile');
  act(() => container.querySelector('[data-testid="btn-apply-variation-wording"]').click());
  expect(onChange).toHaveBeenCalledWith('A subtle smile. Keep all other details unchanged.');
});
test.each([Promise.reject.bind(Promise), () => Promise.resolve({ prompt: '' })])('AI failure leaves the original wording intact', async result => {
  const onChange = jest.fn(); endpoints.aiEditPrompt.mockImplementation(() => result(new Error('AI unavailable')));
  act(() => root.render(<VariationInstruction value="warmer lighting" onChange={onChange} />));
  await act(async () => container.querySelector('[data-testid="btn-clarify-variation"]').click());
  expect(container.querySelector('[role="alert"]')).not.toBeNull();
  expect(container.querySelector('[data-testid="textarea-variation-prompt"]').value).toBe('warmer lighting');
  expect(onChange).not.toHaveBeenCalled();
});
