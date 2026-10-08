import { act } from 'react';
import { createRoot } from 'react-dom/client';
import useCharacterPreview from './useCharacterPreview';
import { endpoints } from '@/lib/api';
import { CHARACTER_PREVIEW_JOB_KEY, CHARACTER_CAPTURE_JOB_KEY } from '@/lib/characterPreview';

jest.mock('@/lib/api', () => ({ endpoints: { dispatchRender: jest.fn(), pollRender: jest.fn() } }));
let root, preview;
function Harness({ requestKey }) { preview = useCharacterPreview(requestKey); return null; }
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  jest.useFakeTimers(); jest.clearAllMocks(); sessionStorage.clear();
  root = createRoot(document.createElement('div'));
});
afterEach(() => { act(() => root.unmount()); jest.useRealTimers(); });
const advance = async () => act(async () => { jest.advanceTimersByTime(3000); });

test('double clicks queue only one preview and edited selections mark the result stale', async () => {
  let resolve;
  endpoints.dispatchRender.mockImplementation(() => new Promise(done => { resolve = done; }));
  act(() => root.render(<Harness requestKey="old" />));
  let pending;
  act(() => { pending = preview.update({ seed: 1 }); preview.update({ seed: 1 }); });
  expect(endpoints.dispatchRender).toHaveBeenCalledTimes(1);
  expect(preview.busy).toBe(true);
  await act(async () => { resolve({ id: 'p1', status: 'queued' }); await pending; });
  act(() => root.render(<Harness requestKey="new" />));
  expect(preview.pendingStale).toBe(true);
  endpoints.pollRender.mockResolvedValue({ id: 'p1', status: 'done', output_files: ['/preview.png'] });
  await advance();
  expect(preview.image).toBe('/preview.png');
  expect(preview.busy).toBe(false);
  expect(preview.stale).toBe(true);
});

test('queued preview resumes after navigation and transient polling errors retry without dispatching again', async () => {
  sessionStorage.setItem(CHARACTER_PREVIEW_JOB_KEY, JSON.stringify({ render: { id: 'existing', status: 'running' }, requestKey: 'same' }));
  act(() => root.render(<Harness requestKey="same" />));
  endpoints.pollRender.mockRejectedValueOnce(new Error('offline')).mockResolvedValue({ id: 'existing', status: 'done', output_files: ['/existing.png'] });
  await advance();
  expect(preview.busy).toBe(true);
  expect(preview.error).toContain('Retrying');
  await advance();
  expect(preview.image).toBe('/existing.png');
  expect(preview.stale).toBe(false);
  expect(preview.error).toBe('');
  expect(endpoints.dispatchRender).not.toHaveBeenCalled();
});

test('failed jobs show their error and allow a new manual preview', async () => {
  endpoints.dispatchRender.mockResolvedValueOnce({ id: 'bad', status: 'offline', error: 'ComfyUI unavailable' })
    .mockResolvedValueOnce({ id: 'good', status: 'done', output_files: ['/good.png'] });
  act(() => root.render(<Harness requestKey="same" />));
  await act(async () => preview.update({}));
  expect(preview.error).toBe('ComfyUI unavailable');
  expect(preview.busy).toBe(false);
  await act(async () => preview.update({}));
  expect(preview.image).toBe('/good.png');
  expect(preview.error).toBe('');
});

test('unmount clears scheduled polling', async () => {
  endpoints.dispatchRender.mockResolvedValue({ id: 'pending', status: 'queued' });
  act(() => root.render(<Harness requestKey="same" />));
  await act(async () => preview.update({}));
  act(() => root.render(null));
  await advance();
  expect(endpoints.pollRender).not.toHaveBeenCalled();
});

test('dispatch errors and completed jobs without an image remain retryable', async () => {
  endpoints.dispatchRender.mockRejectedValueOnce({ response: { data: { detail: 'Model missing' } } })
    .mockResolvedValueOnce({ id: 'empty', status: 'done', output_files: [] });
  act(() => root.render(<Harness requestKey="same" />));
  await act(async () => preview.update({}));
  expect(preview.error).toBe('Model missing');
  expect(preview.busy).toBe(false);
  await act(async () => preview.update({}));
  expect(preview.error).toContain('without an image');
  expect(preview.busy).toBe(false);
});


test('capture resumes independently while preview keeps its completed image and provenance', async () => {
  const previewPayload = { seed: 15, hidden_from_gallery: true };
  sessionStorage.setItem(CHARACTER_PREVIEW_JOB_KEY, JSON.stringify({ render: { id: 'preview', status: 'done', output_files: ['/preview.png'] }, image: '/preview.png', imageKey: 'preview-key', requestKey: 'preview-key', imageRender: { id: 'preview', status: 'done' }, imagePayload: previewPayload }));
  sessionStorage.setItem(CHARACTER_CAPTURE_JOB_KEY, JSON.stringify({ render: { id: 'capture', status: 'queued' }, requestKey: 'capture-key', submittedPayload: { seed: 15, hidden_from_gallery: false } }));
  let capture;
  function Pair() { preview = useCharacterPreview('preview-key'); capture = useCharacterPreview('capture-key', CHARACTER_CAPTURE_JOB_KEY, 'Capture'); return null; }
  act(() => root.render(<Pair />));
  expect(preview.busy).toBe(false); expect(capture.busy).toBe(true);
  endpoints.pollRender.mockResolvedValue({ id: 'capture', status: 'done', output_files: ['/capture.png'] });
  await advance();
  expect(preview.image).toBe('/preview.png'); expect(preview.imageRender.id).toBe('preview');
  expect(preview.imagePayload).toEqual(previewPayload);
  expect(capture.image).toBe('/capture.png'); expect(capture.imagePayload.seed).toBe(15);
  expect(capture.stale).toBe(false);
  expect(JSON.parse(sessionStorage.getItem(CHARACTER_CAPTURE_JOB_KEY)).imageRender.id).toBe('capture');
  expect(endpoints.dispatchRender).not.toHaveBeenCalled();
});

test('an explicit request key records the seed actually submitted during an unlocked update', async () => {
  endpoints.dispatchRender.mockResolvedValue({ id: 'preview', status: 'done', output_files: ['/image.png'] });
  act(() => root.render(<Harness requestKey="old-seed" />));
  await act(async () => preview.update({ seed: 777 }, 'new-seed'));
  act(() => root.render(<Harness requestKey="new-seed" />));
  expect(preview.stale).toBe(false); expect(preview.imagePayload.seed).toBe(777);
});
