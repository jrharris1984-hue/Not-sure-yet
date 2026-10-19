import {loadStudioDraft,saveStudioDraft} from './studioDraft';
import {previewPerson} from './workspacePreview';
beforeEach(()=>sessionStorage.clear());
test('keeps a character draft in the current tab',()=>{
  const draft={mode:'character',people:[previewPerson()],description:'A studio portrait'};
  expect(saveStudioDraft(draft)).toBe(true);expect(loadStudioDraft()).toMatchObject(draft);
});
test('ignores malformed or unsupported drafts',()=>{
  sessionStorage.setItem('ultra-studio-canvas-draft-v1','bad json');expect(loadStudioDraft()).toBeNull();
  saveStudioDraft({mode:'character',people:[]});expect(loadStudioDraft()).toBeNull();
});
