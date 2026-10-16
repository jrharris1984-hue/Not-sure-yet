import { useEffect, useState } from "react";

export const PINNED_SECTIONS_KEY = "ultra-studio:pinned-sections:v1";
export const MAX_PINNED_SECTIONS = 6;
function parsePins(raw, sections) {
  try {
    const values = JSON.parse(raw || "[]");
    if (!Array.isArray(values)) return [];
    const valid = new Set(sections.map((section) => section.key));
    return [...new Set(values.filter((value) => typeof value === "string" && valid.has(value)))].slice(0, MAX_PINNED_SECTIONS);
  } catch { return []; }
}
export function usePinnedSections(sections) {
  const [pinned, setPinned] = useState(() => {
    try { return parsePins(window.localStorage.getItem(PINNED_SECTIONS_KEY), sections); } catch { return []; }
  });
  useEffect(() => {
    try { window.localStorage.setItem(PINNED_SECTIONS_KEY, JSON.stringify(pinned)); } catch { /* Pins still work during this session when storage is unavailable. */ }
  }, [pinned]);
  useEffect(() => {
    const update = (event) => {
      if (event.key === PINNED_SECTIONS_KEY) setPinned(parsePins(event.newValue, sections));
    };
    window.addEventListener("storage", update);
    return () => window.removeEventListener("storage", update);
  }, [sections]);
  const toggle = (key) => {
    if (!sections.some((section) => section.key === key)) return;
    setPinned((current) => current.includes(key) ? current.filter((value) => value !== key)
      : current.length < MAX_PINNED_SECTIONS ? [...current, key] : current);
  };
  return { pinned, toggle, limit: MAX_PINNED_SECTIONS };
}
