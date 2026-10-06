import { confirmPermanentDelete } from './permanentDeleteConfirmation';
beforeEach(() => window.localStorage.clear());
afterEach(() => jest.restoreAllMocks());
test('acknowledged warning is shown once for all subsequent delete actions', () => {
  const confirm = jest.spyOn(window, 'confirm').mockReturnValue(true);
  expect(confirmPermanentDelete('Permanently delete this image?')).toBe(true);
  expect(confirmPermanentDelete('Delete selected images?')).toBe(true);
  expect(confirmPermanentDelete('Delete all QC items?')).toBe(true);
  expect(confirm).toHaveBeenCalledTimes(1);
  expect(window.localStorage.getItem('ultra-studio:permanent-delete-acknowledged:v1')).toBe('true');
});
test('cancelling the first warning cancels deletion and does not acknowledge it', () => {
  const confirm = jest.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true);
  expect(confirmPermanentDelete('Delete?')).toBe(false);
  expect(confirmPermanentDelete('Delete?')).toBe(true);
  expect(confirm).toHaveBeenCalledTimes(2);
});
