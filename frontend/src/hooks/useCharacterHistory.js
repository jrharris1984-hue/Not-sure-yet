import { useEffect, useReducer } from "react";

const LIMIT = 30;
function changedField(previous, next) {
  const paths = [];
  const visit = (a, b, path) => {
    if (paths.length > 1 || JSON.stringify(a) === JSON.stringify(b)) return;
    if (a && b && typeof a === "object" && typeof b === "object" && !Array.isArray(a) === !Array.isArray(b)) {
      for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) visit(a[key], b[key], `${path}.${key}`);
    } else paths.push(path);
  };
  visit(JSON.parse(previous), JSON.parse(next), "cast");
  return paths.length === 1 ? paths[0] : null;
}
const initial = ({ present, scope, enabled }) => ({ present, scope, enabled, past: [], future: [], lastField: null, lastAt: 0 });
function reduce(state, action) {
  if (action.type === "sync") {
    if (action.scope !== state.scope || !action.enabled || !state.enabled) return initial(action);
    if (action.present === state.present) return state;
    const field = changedField(state.present, action.present);
    const grouped = field && field === state.lastField && action.now - state.lastAt < 500;
    return { ...state, present: action.present, past: grouped ? state.past : [...state.past, state.present].slice(-LIMIT), future: [], lastField: field, lastAt: action.now };
  }
  if (action.type === "undo" && state.past.length) return { ...state, present: state.past[state.past.length - 1], past: state.past.slice(0, -1), future: [state.present, ...state.future], lastField: null };
  if (action.type === "redo" && state.future.length) return { ...state, present: state.future[0], past: [...state.past, state.present].slice(-LIMIT), future: state.future.slice(1), lastField: null };
  return state;
}

export function useCharacterHistory({ subjects, onRestore, scope, enabled = true }) {
  const present = JSON.stringify(subjects);
  const [state, dispatch] = useReducer(reduce, { present, scope, enabled }, initial);
  useEffect(() => { dispatch({ type: "sync", present, scope, enabled, now: Date.now() }); }, [present, scope, enabled]);
  const current = enabled && state.enabled && scope === state.scope && present === state.present;
  const canUndo = current && state.past.length > 0;
  const canRedo = current && state.future.length > 0;
  const undo = () => {
    if (!canUndo) return;
    onRestore(JSON.parse(state.past[state.past.length - 1]));
    dispatch({ type: "undo" });
  };
  const redo = () => {
    if (!canRedo) return;
    onRestore(JSON.parse(state.future[0]));
    dispatch({ type: "redo" });
  };
  return { canUndo, canRedo, undo, redo };
}
