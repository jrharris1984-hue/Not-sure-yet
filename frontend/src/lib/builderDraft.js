const PREFIX = "ultra-studio:builder-draft:v1:";
const drafts = new Map();
export const builderDraftKey = characterId => `${PREFIX}${characterId || "new"}`;
export function readBuilderDraft(characterId) {
  const key = builderDraftKey(characterId);
  try {
    const raw = drafts.get(key) || window.sessionStorage.getItem(key);
    const draft = raw ? JSON.parse(raw) : null;
    return draft?.version === 1 ? draft : null;
  } catch { return null; }
}
export function writeBuilderDraft(characterId, draft) {
  const key = builderDraftKey(characterId);
  const raw = JSON.stringify({...draft, version:1, savedAt:Date.now()});
  drafts.set(key, raw);
  try { window.sessionStorage.setItem(key, raw); return true; }
  catch { return false; }
}
export function clearBuilderDraft(characterId) {
  const key = builderDraftKey(characterId);
  drafts.delete(key);
  try { window.sessionStorage.removeItem(key); } catch { /* Storage unavailable. */ }
}
export function resetWorkspaceDrafts() {
  drafts.clear();
  try {
    Object.keys(window.sessionStorage).filter(key => key.startsWith(PREFIX)).forEach(key => window.sessionStorage.removeItem(key));
  } catch { /* Memory reset still works when storage is unavailable. */ }
}
let description = '';
export const readDescriptionDraft = () => description;
export const writeDescriptionDraft = text => { description = text; };
export function startWorkspaceSession() {
  // Keep the URL and tab-scoped drafts across refreshes. Explicit reset clears drafts.
  drafts.clear();
  description = '';
}
