const PREFIX = "ultra-studio:builder-draft:v1:";
const drafts = new Map();
export const builderDraftKey = characterId => `${PREFIX}${characterId || "new"}`;
export function readBuilderDraft(characterId) {
  const draft = drafts.get(builderDraftKey(characterId));
  return draft ? JSON.parse(draft) : null;
}
export function writeBuilderDraft(characterId, draft) {
  drafts.set(builderDraftKey(characterId), JSON.stringify({version:1,savedAt:Date.now(),...draft}));
}
export function clearBuilderDraft(characterId) {
  drafts.delete(builderDraftKey(characterId));
}
export function resetWorkspaceDrafts() {
  drafts.clear();
}
let description = '';
export const readDescriptionDraft = () => description;
export const writeDescriptionDraft = text => { description = text; };
export function startWorkspaceSession(browser = window) {
  resetWorkspaceDrafts();
  description = '';
  // A new app load starts on Your Talent Roster, including restored browser URLs.
  browser.history.replaceState(null, '', '/');
}
