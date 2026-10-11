// Editor switches and saved decision snapshots describe how to compile traits,
// not visible traits themselves. Authored custom fields remain prompt content.
export function isPromptMetadata(section, field = '') {
  if (section.startsWith('_') || field.startsWith('_')) return true;
  if (section === 'physique' && /^(bust|butt|hips|waist|thighs)_control_mode$/.test(field)) return true;
  return section === 'wardrobe' && ['outfit_mode', 'set_lingerie_mode', 'garment_priority'].includes(field)
    || section === 'feet' && field === 'composition_mode'
    || section === 'style' && field === 'anatomy_mode';
}
