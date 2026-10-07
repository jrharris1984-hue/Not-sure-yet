import { useSyncExternalStore } from 'react';

let state = { enabled: false, result: null };
const listeners = new Set();
export const getAssistantResearch = () => state;
export function updateAssistantResearch(patch) {
  state = { ...state, ...patch };
  listeners.forEach(listener => listener());
}
export function useAssistantResearch() {
  return useSyncExternalStore(listener => { listeners.add(listener); return () => listeners.delete(listener); }, getAssistantResearch, getAssistantResearch);
}
export function researchableRequest(url = '') {
  return (/^\/ai\//.test(url) && !/^\/ai\/research/.test(url)) || /^\/renders\/[^/]+\/(alignment|improve\/preview)$/.test(url) || /^\/media-library\/media\/[^/]+\/reanalyze$/.test(url);
}
