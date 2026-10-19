const KEY='ultra-studio-canvas-draft-v1';
export function loadStudioDraft() {
  try {
    const draft=JSON.parse(sessionStorage.getItem(KEY));
    if(draft?.version!==1 || !['character','describe','image'].includes(draft.mode) || !Array.isArray(draft.people) || !draft.people.length || draft.people.length>2 || draft.people.some(person=>!person?.dna || typeof person.dna!=='object' || typeof person.name!=='string'))return null;
    return draft;
  } catch {return null;}
}
export function saveStudioDraft(draft) {
  try {sessionStorage.setItem(KEY,JSON.stringify({...draft,version:1}));return true;}catch{return false;}
}
