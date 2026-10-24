import { useEffect, useState } from "react";

function readPreference(key, fallback) {
  if (!key) return fallback;
  try {
    const saved = JSON.parse(sessionStorage.getItem(key));
    return typeof saved === typeof fallback && saved !== null &&
      (typeof saved !== "number" || Number.isFinite(saved)) ? saved : fallback;
  } catch { return fallback; }
}

// Preferences belong to a browser tab and a control, never to character data.
export default function useTabPreference(key, fallback) {
  const [state, setState] = useState(() => ({ key, value: readPreference(key, fallback) }));
  let current = state;
  if (state.key !== key) {
    current = { key, value: readPreference(key, fallback) };
    setState(current);
  }
  useEffect(() => {
    if (!key || state.key !== key) return;
    try { sessionStorage.setItem(key, JSON.stringify(state.value)); } catch { /* Optional preference only. */ }
  }, [key, state]);
  const setValue = next => setState(previous => {
    const value = previous.key === key ? previous.value : readPreference(key, fallback);
    return { key, value: typeof next === "function" ? next(value) : next };
  });
  return [current.value, setValue];
}
