import { act } from 'react';
import { createRoot } from 'react-dom/client';
import SmartPhotoshootLibrary from './SmartPhotoshootLibrary';
import { endpoints } from '@/lib/api';

let mockSettings;
const mockSetQueryData = jest.fn((key, value) => { mockSettings = value; });
jest.mock('@tanstack/react-query', () => ({ useQuery: () => ({ data: mockSettings }), useQueryClient: () => ({ setQueryData: mockSetQueryData }) }));
jest.mock('@/lib/api', () => ({ endpoints: { settings: jest.fn(), updateSettings: jest.fn() } }));
jest.mock('sonner', () => ({ toast: { success: jest.fn() } }));
let root, container;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true; jest.clearAllMocks();
  mockSetQueryData.mockImplementation((key, value) => { mockSettings = value; });
  mockSettings = { custom_photoshoot_presets: [{ key: 'custom_saved', label: 'My saved plan', category: 'Saved plans', sequence: [{ title: 'Hero', framing: 'full body', expression: '', pose_prompt: 'walking' }] }] };
  container = document.createElement('div'); root = createRoot(container);
});
afterEach(() => act(() => root.unmount()));
const click = text => [...container.querySelectorAll('button')].find(button => button.textContent === text).click();

test('Library opens saved shots for bulk editing and preserves unrelated saved shoots', async () => {
  act(() => root.render(<SmartPhotoshootLibrary />));
  expect(container.textContent).toContain('My saved plan');
  expect(container.querySelector('[data-testid="smart-photoshoot-library"]')).toBeTruthy();
  act(() => click('My saved plan1 shots · Edit shots'));
  expect(container.querySelector('[data-testid="photoshoot-bulk-editor"]')).toBeTruthy();
  const other = { key: 'custom_other', label: 'Other shoot', sequence: [{ title: 'Other', framing: 'portrait' }] };
  endpoints.settings.mockResolvedValue({ custom_photoshoot_presets: [...mockSettings.custom_photoshoot_presets, other] });
  endpoints.updateSettings.mockImplementation(async body => body);
  await act(async () => click('Save changes'));
  const saved = endpoints.updateSettings.mock.calls[0][0].custom_photoshoot_presets;
  expect(saved).toHaveLength(2); expect(saved).toContainEqual(other);
  expect(saved.find(item => item.key === 'custom_saved').sequence[0].pose_prompt).toBe('walking');
  expect(mockSetQueryData).toHaveBeenCalledWith(['settings'], expect.any(Object));
  expect(container.querySelector('[role="dialog"]')).toBeNull();
});

test('built-in styles can be edited in the Library', () => {
  act(() => root.render(<SmartPhotoshootLibrary />));
  act(() => { const filter = container.querySelector('[aria-label="Photoshoot library filter"]'); filter.value = 'all'; filter.dispatchEvent(new Event('change', { bubbles: true })); });
  act(() => click('Editorial6 shots · Edit built-in style'));
  expect(container.textContent).toContain('Save built-in edits');
  expect(container.textContent).not.toContain('Delete preset');
  expect(container.querySelectorAll('[aria-label^="Select shot"]')).toHaveLength(6);
});

test('bulk additions are reviewed before one settings write that preserves newer saved shoots', async () => {
  const newer = { key: 'custom_newer', label: 'Newer saved shoot', sequence: [{ title: 'Newer', framing: 'portrait' }] };
  endpoints.settings.mockResolvedValue({ custom_photoshoot_presets: [...mockSettings.custom_photoshoot_presets, newer] });
  endpoints.updateSettings.mockImplementation(async body => body);
  act(() => root.render(<SmartPhotoshootLibrary />));
  act(() => click('Load example'));
  act(() => click('Review import'));
  expect(container.textContent).toContain('Studio portrait set');
  expect(container.textContent).toContain('2 shoots to add');
  expect(endpoints.updateSettings).not.toHaveBeenCalled();
  await act(async () => { const button = [...container.querySelectorAll('button')].find(button => button.textContent === 'Save 2 shoots'); button.click(); button.click(); });
  expect(endpoints.updateSettings).toHaveBeenCalledTimes(1);
  const saved = endpoints.updateSettings.mock.calls[0][0].custom_photoshoot_presets;
  expect(saved).toHaveLength(4); expect(saved).toContainEqual(newer);
  expect(saved).toContainEqual(mockSettings.custom_photoshoot_presets.find(item => item.key === 'custom_saved'));
  expect(container.textContent).toContain('Added 2 shoots');
});

test('Library edits built-ins under their existing key and can restore the original', async () => {
  endpoints.settings.mockImplementation(async () => mockSettings);
  endpoints.updateSettings.mockImplementation(async body => body);
  act(() => root.render(<SmartPhotoshootLibrary />));
  act(() => { const filter = container.querySelector('[aria-label="Photoshoot library filter"]'); filter.value = 'all'; filter.dispatchEvent(new Event('change', { bubbles: true })); });
  act(() => click('Editorial6 shots · Edit built-in style'));
  await act(async () => click('Save built-in edits'));
  expect(endpoints.updateSettings.mock.calls[0][0].custom_photoshoot_presets.some(item => item.key === 'editorial')).toBe(true);
  expect([...container.querySelectorAll('button')].map(button => button.textContent)).toContain('Editorial6 shots · Edit shots');
  act(() => click('Editorial6 shots · Edit shots'));
  expect(container.textContent).toContain('Restore built-in style');
  await act(async () => click('Restore built-in style'));
  const current = endpoints.updateSettings.mock.calls[1][0].custom_photoshoot_presets;
  expect(current.some(item => item.key === 'editorial')).toBe(false);
  expect(current.some(item => item.key === 'custom_saved')).toBe(true);
});

test('download all produces a JSON file containing built-in and saved shoot sequences', () => {
  jest.useFakeTimers();
  const oldCreate = URL.createObjectURL, oldRevoke = URL.revokeObjectURL;
  let exported;
  const blob = jest.spyOn(global, 'Blob').mockImplementation(parts => { exported = parts.join(''); return {}; });
  URL.createObjectURL = jest.fn(() => 'blob:shoot-library'); URL.revokeObjectURL = jest.fn();
  const anchor = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () {
    expect(this.download).toBe('ultra-studio-smart-photoshoots-all.json');
  });
  try {
    act(() => root.render(<SmartPhotoshootLibrary />));
    act(() => click('Download all shoots JSON'));
    const entries = JSON.parse(exported);
    expect(entries.find(item => item.key === 'editorial').sequence).toHaveLength(6);
    expect(entries.find(item => item.key === 'custom_saved').sequence[0].pose_prompt).toBe('walking');
    act(() => jest.runOnlyPendingTimers());
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:shoot-library');
  } finally {
    anchor.mockRestore(); blob.mockRestore(); URL.createObjectURL = oldCreate; URL.revokeObjectURL = oldRevoke; jest.useRealTimers();
  }
});
