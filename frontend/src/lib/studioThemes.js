import { useSyncExternalStore } from 'react';
const STORAGE_KEY = 'ultra-studio:color-theme:v1';
let sessionTheme = 'studio';
export const STUDIO_THEMES = [
  { id: 'studio', name: 'Studio', description: 'Original green accents and graphite surfaces.', accent: '#86efac', rgb: '74, 222, 128', secondary: '#93c5fd', secondaryRgb: '96, 165, 250', hue: '142 71% 75%', canvas: '#050507', surface: '#191922', top: '#343443', middle: '#242432', bottom: '#1b1b26', detail: '#242430' },
  { id: 'spider', name: 'Spider-Man inspired', description: 'Hero red, electric blue, and dark midnight panels.', accent: '#fb7185', rgb: '251, 113, 133', secondary: '#60a5fa', secondaryRgb: '96, 165, 250', hue: '351 95% 71%', canvas: '#070b17', surface: '#151f35', top: '#303d59', middle: '#202b43', bottom: '#151e32', detail: '#202b43' },
  { id: 'midnight', name: 'Midnight', description: 'Cool blue and cyan on deep navy.', accent: '#93c5fd', rgb: '147, 197, 253', secondary: '#67e8f9', secondaryRgb: '103, 232, 249', hue: '213 97% 78%', canvas: '#060b16', surface: '#162033', top: '#30425b', middle: '#203049', bottom: '#152137', detail: '#203049' },
  { id: 'amethyst', name: 'Amethyst', description: 'Soft violet with pink highlights.', accent: '#c4b5fd', rgb: '196, 181, 253', secondary: '#f9a8d4', secondaryRgb: '249, 168, 212', hue: '255 92% 85%', canvas: '#0d0715', surface: '#22172e', top: '#443453', middle: '#32243f', bottom: '#24192f', detail: '#32243f' },
  { id: 'ember', name: 'Ember', description: 'Warm copper and amber on charcoal.', accent: '#fdba74', rgb: '253, 186, 116', secondary: '#fde68a', secondaryRgb: '253, 230, 138', hue: '31 97% 72%', canvas: '#100a07', surface: '#2b211b', top: '#4a3b30', middle: '#35291f', bottom: '#261c16', detail: '#35291f' },
  { id: 'ocean', name: 'Ocean', description: 'Sea-glass teal with blue highlights.', accent: '#5eead4', rgb: '94, 234, 212', secondary: '#7dd3fc', secondaryRgb: '125, 211, 252', hue: '167 85% 64%', canvas: '#06100f', surface: '#172b2b', top: '#304b4d', middle: '#203637', bottom: '#17282a', detail: '#203637' },
];
export function getStudioTheme() {
  let id = sessionTheme;
  try { id = window.localStorage.getItem(STORAGE_KEY) || 'studio'; } catch { /* Session fallback. */ }
  return STUDIO_THEMES.some(theme => theme.id === id) ? id : 'studio';
}
export function applyStudioTheme(id) {
  const theme = STUDIO_THEMES.find(item => item.id === id) || STUDIO_THEMES[0];
  const root = document.documentElement;
  root.dataset.studioTheme = theme.id;
  const values = { accent: theme.accent, secondary: theme.secondary, 'accent-wash': `rgba(${theme.rgb}, .14)`, 'accent-edge': `rgba(${theme.rgb}, .45)`,
    'secondary-wash': `rgba(${theme.secondaryRgb}, .12)`, canvas: theme.canvas, surface: theme.surface, detail: theme.detail,
    'control-top': theme.top, 'control-middle': theme.middle, 'control-bottom': theme.bottom };
  for (const [key, value] of Object.entries(values)) root.style.setProperty(`--studio-${key}`, value);
  root.style.setProperty('--primary', theme.hue); root.style.setProperty('--ring', theme.hue);
  return theme.id;
}
export function setStudioTheme(id) {
  sessionTheme = applyStudioTheme(id);
  try { window.localStorage.setItem(STORAGE_KEY, sessionTheme); } catch { /* Session fallback. */ }
  window.dispatchEvent(new Event('studio-theme-change'));
}
export function useStudioTheme() {
  return useSyncExternalStore(callback => {
    window.addEventListener('studio-theme-change', callback); window.addEventListener('storage', callback);
    return () => { window.removeEventListener('studio-theme-change', callback); window.removeEventListener('storage', callback); };
  }, getStudioTheme, () => 'studio');
}
export function initializeStudioTheme() {
  applyStudioTheme(getStudioTheme());
  const update = event => { if (event.key === STORAGE_KEY || event.key === null) applyStudioTheme(getStudioTheme()); };
  window.addEventListener('storage', update);
  return () => window.removeEventListener('storage', update);
}
