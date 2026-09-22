const PREFIX = "ultra-studio:builder-draft:v1:";

export const builderDraftKey = (characterId) => `${PREFIX}${characterId || "new"}`;

export function readBuilderDraft(characterId) {
  if (typeof window === "undefined") return null;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(builderDraftKey(characterId)) || "null");
    return parsed?.version === 1 ? parsed : null;
  } catch {
    return null;
  }
}

export function writeBuilderDraft(characterId, draft) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(builderDraftKey(characterId), JSON.stringify({ version: 1, savedAt: Date.now(), ...draft }));
}

export function clearBuilderDraft(characterId) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(builderDraftKey(characterId));
}
