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

export function loraStrengthProfile(value, family) {
  if (!value || typeof value !== 'object') return {};
  const {minStrength:low, defaultStrength:mid, maxStrength:high} = value;
  const cap = family === 'krea2' ? 3.5 : 2;
  if (![low, mid, high].every(n => typeof n === 'number' && Number.isFinite(n)) ||
      low < -cap || high > cap || low >= high || mid < low || mid > high) return {};
  return {minStrength:low, defaultStrength:mid, maxStrength:high, profileConfigured:true};
}

export function removeLoraPreference(name) {
  const preferences = readLoraPreferences();
  delete preferences[loraFileKey(name)];
  try {
    localStorage.setItem(KEY, JSON.stringify(preferences));
    window.dispatchEvent(new Event(LORA_PREFERENCES_CHANGED));
    return true;
  } catch { return false; }
}
