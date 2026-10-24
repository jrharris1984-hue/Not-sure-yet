import { useEffect, useState } from "react";
export default function useTabPreference(key, fallback) {
  const [value, setValue] = useState(() => {
    try { const saved = JSON.parse(sessionStorage.getItem(key)); return typeof saved === typeof fallback ? saved : fallback; }
    catch { return fallback; }
  });
  useEffect(() => { try { sessionStorage.setItem(key, JSON.stringify(value)); } catch { /* Optional preference only. */ } }, [key, value]);
  return [value, setValue];
}
