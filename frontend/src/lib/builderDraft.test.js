import { builderDraftKey, clearBuilderDraft, readBuilderDraft, writeBuilderDraft, resetWorkspaceDrafts, startWorkspaceSession } from './builderDraft';
afterEach(() => { resetWorkspaceDrafts(); jest.restoreAllMocks(); });
it('recovers a draft after an app reload without changing the URL', () => {
  writeBuilderDraft('a', {name:'Work in progress', subjects:[{id:'one'}]});
  const browser = {history:{replaceState:jest.fn()}};
  startWorkspaceSession(browser);
  expect(readBuilderDraft('a')).toMatchObject({version:1,name:'Work in progress'});
  expect(browser.history.replaceState).not.toHaveBeenCalled();
});
it('clears only the requested draft and supports explicit reset', () => {
  writeBuilderDraft('a', {name:'A'}); writeBuilderDraft('b', {name:'B'});
  clearBuilderDraft('a'); expect(readBuilderDraft('a')).toBeNull();
  expect(readBuilderDraft('b').name).toBe('B');
  resetWorkspaceDrafts(); expect(readBuilderDraft('b')).toBeNull();
});
it('ignores corrupt drafts', () => {
  sessionStorage.setItem(builderDraftKey('bad'), '{broken');
  expect(readBuilderDraft('bad')).toBeNull();
});
it('retains an in-memory copy when browser storage is full', () => {
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {throw new Error('quota');});
  expect(writeBuilderDraft('a', {name:'Still here'})).toBe(false);
  expect(readBuilderDraft('a').name).toBe('Still here');
});
