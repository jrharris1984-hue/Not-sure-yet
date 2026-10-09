import { act } from 'react';
import { createRoot } from 'react-dom/client';
import SmartPhotoshootProgress, { photoshootRunPending, photoshootRunRows } from './SmartPhotoshootProgress';

jest.mock('@/lib/media', () => ({ mediaUrl: url => url }));
const run = { label: 'Editorial', shots: [{ title: 'Hero' }, { title: 'Portrait' }], requests: [{ id: 'a', status: 'queued' }], queuing: true, error: '' };
let container, root;
beforeEach(() => { global.IS_REACT_ACT_ENVIRONMENT = true; container = document.createElement('div'); root = createRoot(container); });
afterEach(() => act(() => root.unmount()));

test('queue feedback becomes live progress, keeps shot association, and opens completed images', () => {
  const onSelectRender = jest.fn();
  act(() => root.render(<SmartPhotoshootProgress run={run} onSelectRender={onSelectRender} />));
  expect(container.textContent).toContain('Adding photoshoot to queue');
  expect(container.textContent).toContain('Preparing');
  const submitted = { ...run, requests: [...run.requests, { id: 'b', status: 'queued' }], queuing: false };
  const completed = { id: 'a', status: 'done', output_files: ['hero.png'] };
  const renders = [{ id: 'unrelated', status: 'done' }, { id: 'b', status: 'running' }, completed];
  act(() => root.render(<SmartPhotoshootProgress run={submitted} renders={renders} onSelectRender={onSelectRender} />));
  expect(container.textContent).toContain('1 of 2 images completed');
  expect(container.textContent).toContain('Photoshoot in progress');
  expect(container.querySelector('progress').value).toBe(1);
  act(() => container.querySelector('[aria-label="View photoshoot shot 1"]').click());
  expect(onSelectRender).toHaveBeenCalledWith(completed);
  expect(photoshootRunPending(submitted, renders)).toBe(true);
  renders[1] = { id: 'b', status: 'done' };
  act(() => root.render(<SmartPhotoshootProgress run={submitted} renders={renders} />));
  expect(container.textContent).toContain('Photoshoot finished');
  expect(photoshootRunPending(submitted, renders)).toBe(false);
});

test('partial submission shows unqueued shots and failures without pretending they rendered', () => {
  const partial = { ...run, queuing: false, error: 'Second request failed' };
  act(() => root.render(<SmartPhotoshootProgress run={partial} renders={[{ id: 'a', status: 'failed', error: 'ComfyUI unavailable' }]} />));
  expect(container.textContent).toContain('Not queued');
  expect(container.textContent).toContain('0 of 2 images completed');
  expect(container.textContent).toContain('Second request failed');
  expect(container.textContent).toContain('ComfyUI unavailable');
  expect(photoshootRunPending(partial, [{ id: 'a', status: 'failed' }])).toBe(false);
  expect(photoshootRunRows(null)).toEqual([]);
});
