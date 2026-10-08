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

test('built-in styles can be customized as new copies in the Library', () => {
  act(() => root.render(<SmartPhotoshootLibrary />));
  act(() => { const filter = container.querySelector('[aria-label="Photoshoot library filter"]'); filter.value = 'all'; filter.dispatchEvent(new Event('change', { bubbles: true })); });
  act(() => click('Editorial6 shots · Customize a copy'));
  expect(container.textContent).toContain('Save custom preset');
  expect(container.textContent).not.toContain('Delete preset');
  expect(container.querySelectorAll('[aria-label^="Select shot"]')).toHaveLength(6);
});
