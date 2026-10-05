const KEY = 'ultra-studio:lora-preferences:v1';
export const LORA_PREFERENCES_CHANGED = 'ultra-studio:lora-preferences-changed';
export const loraFileKey = name => String(name || '').replace(/\\/g, '/').toLowerCase();
export function readLoraPreferences() {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) || '{}');
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  } catch { return {}; }
}
export function saveLoraPreference(name, patch) {
  const preferences = readLoraPreferences();
  preferences[loraFileKey(name)] = {...preferences[loraFileKey(name)], ...patch};
  try {
    localStorage.setItem(KEY, JSON.stringify(preferences));
    window.dispatchEvent(new Event(LORA_PREFERENCES_CHANGED));
    return true;
  } catch { return false; }
}
