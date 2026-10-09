import { CUSTOM_FRAMING_OPTIONS, CUSTOM_EXPRESSION_OPTIONS, SMART_PHOTOSHOOT_PRESETS, SMART_SHOOT_CATEGORIES } from './batchSmartPhotoshoot';

export const PHOTOSHOOT_IMPORT_EXAMPLE = JSON.stringify([
  { label: 'Studio portrait set', category: 'Portrait', sequence: [
    { title: 'Hero', framing: 'full body', camera_match: 'front', expression: 'neutral' },
    { title: 'Portrait', framing: 'waist-up', camera_match: '3/4', expression: 'smile' },
  ] },
  { label: 'City fashion set', category: 'Fashion', sequence: [
    { title: 'Walking', framing: 'full body', pose_prompt: 'walking confidently along a city street', camera_match: '3/4', expression: 'serious' },
    { title: 'Leaning', framing: 'thigh-up', pose_prompt: 'leaning against a wall with relaxed shoulders', camera_match: 'front' },
  ] },
], null, 2);

const builtins = Object.fromEntries(SMART_SHOOT_CATEGORIES.flatMap(category => category.presets.map(preset => [preset.key, { ...preset, categoryLabel: category.label }])));
const matcherText = matcher => String(matcher?.source || '').replace(/\\\//g, '/');

export function photoshootPresetForExport(preset) {
  return {
    key: preset.key, label: preset.label, category: preset.categoryLabel || preset.category || 'Custom', description: preset.description || '',
    sequence: preset.sequence.map(item => {
      const source = item.raw || item;
      return {
        title: source.title || 'Shot', pose_group: source.pose_group ?? matcherText(item.poseGroup),
        camera_match: source.camera_match ?? matcherText(item.camera), framing: source.framing || '', expression: source.expression || '',
        ...(Object.hasOwn(source, 'pose_prompt') ? { pose_prompt: source.pose_prompt || '', pose_label: source.pose_label || '' } : {}),
        ...(Object.hasOwn(source, 'camera_pose_angle') ? { camera_pose_angle: source.camera_pose_angle || '', camera_angle: source.camera_angle || '' } : {}),
      };
    }),
  };
}

const slug = value => value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 60);
const object = value => value && typeof value === 'object' && !Array.isArray(value);
const text = (value, label, max, required = false) => {
  if (value != null && typeof value !== 'string') throw new Error(`${label} must be text.`);
  const result = (value || '').trim();
  if ((required && !result) || result.length > max) throw new Error(`${label} ${required && !result ? 'is required' : `must be at most ${max} characters`}.`);
  return result;
};

export function parsePhotoshootImport(source) {
  if (source.length > 10 * 1024 * 1024) throw new Error('Import is too large. Use a JSON file under 10 MB.');
  let parsed;
  try { parsed = JSON.parse(source); } catch { throw new Error('Could not read JSON. Paste a JSON array of shoots, or use Load example to see the format.'); }
  const input = Array.isArray(parsed) ? parsed : parsed?.custom_photoshoot_presets || parsed?.presets || (object(parsed) && parsed.sequence ? [parsed] : null);
  if (!Array.isArray(input) || !input.length || input.length > 200) throw new Error('Import needs 1 to 200 shoot entries in a JSON array.');
  const seen = new Set();
  return input.map((item, index) => {
    const prefix = `Shoot ${index + 1}`;
    if (!object(item)) throw new Error(`${prefix} must be an object.`);
    const label = text(item.label, `${prefix} name (label)`, 120, true);
    const category = text(item.category, `${prefix} category`, 80) || 'Custom';
    const description = text(item.description, `${prefix} description`, 500);
    let key = text(item.key, `${prefix} key`, 80) || `custom_${slug(label) || `import_${index + 1}`}`;
    if (!/^[a-z0-9_-]+$/.test(key)) throw new Error(`${prefix} key may use lowercase letters, numbers, hyphens and underscores.`);
    if (seen.has(key)) throw new Error(`${prefix} repeats the key '${key}'. Give each shoot a different key or name.`);
    seen.add(key);
    if (!Array.isArray(item.sequence) || item.sequence.length < 1 || item.sequence.length > 20) throw new Error(`${prefix} needs 1 to 20 shots in sequence.`);
    const sequence = item.sequence.map((shot, shotIndex) => {
      const place = `${prefix}, shot ${shotIndex + 1}`;
      if (!object(shot)) throw new Error(`${place} must be an object.`);
      const clean = {
        title: text(shot.title, `${place} title`, 100, true),
        pose_group: text(shot.pose_group, `${place} pose family`, 160),
        camera_match: text(shot.camera_match, `${place} camera`, 160),
        framing: text(shot.framing, `${place} framing`, 30),
        expression: text(shot.expression, `${place} expression`, 30),
      };
      if (!CUSTOM_FRAMING_OPTIONS.includes(clean.framing)) throw new Error(`${place} framing must be one of: ${CUSTOM_FRAMING_OPTIONS.filter(Boolean).join(', ')}.`);
      if (!CUSTOM_EXPRESSION_OPTIONS.includes(clean.expression)) throw new Error(`${place} expression must be one of: ${CUSTOM_EXPRESSION_OPTIONS.filter(Boolean).join(', ')}.`);
      if (Object.hasOwn(shot, 'pose_prompt')) {
        clean.pose_prompt = text(shot.pose_prompt, `${place} exact pose prompt`, 2000);
        clean.pose_label = text(shot.pose_label, `${place} pose label`, 2000);
      }
      if (Object.hasOwn(shot, 'camera_pose_angle')) {
        clean.camera_pose_angle = text(shot.camera_pose_angle, `${place} saved pose angle`, 30);
        clean.camera_angle = text(shot.camera_angle, `${place} saved camera angle`, 30);
        if (!['', 'front', '3/4', 'profile', 'over-shoulder'].includes(clean.camera_pose_angle) || !['', 'eye-level', 'low', 'high', 'foot level'].includes(clean.camera_angle) || !!clean.camera_pose_angle !== !!clean.camera_angle) throw new Error(`${place} saved camera needs a supported pose angle and camera angle together.`);
      }
      return clean;
    });
    return { key, label, category, description, sequence };
  });
}

export function mergePhotoshootImport(existing, imported, mode = 'skip') {
  if (!['skip', 'copy', 'update'].includes(mode)) throw new Error('Choose skip, copy, or update for existing keys.');
  const records = new Map(existing.map(item => [item.key, item]));
  const keys = new Set([...Object.keys(SMART_PHOTOSHOOT_PRESETS), ...records.keys()]);
  const added = [], updated = [], skipped = [], actions = [];
  for (const preset of imported) {
    let key = preset.key;
    if (keys.has(key) && mode === 'skip') { skipped.push(preset); actions.push('Skip existing key'); continue; }
    if (keys.has(key) && mode === 'update') {
      const baseline = photoshootPresetForExport(records.get(key) || builtins[key]);
      if (JSON.stringify(baseline) === JSON.stringify(photoshootPresetForExport(preset))) {
        skipped.push(preset); actions.push('Unchanged · skip'); continue;
      }
      records.set(key, preset); updated.push(preset); actions.push(Object.hasOwn(builtins, key) ? 'Update built-in style' : 'Update saved shoot'); continue;
    }
    if (keys.has(key)) {
      const stem = key.slice(0, 68);
      let suffix = 2;
      while (keys.has(`${stem}_copy_${suffix}`)) suffix += 1;
      key = `${stem}_copy_${suffix}`;
    }
    keys.add(key); const created = { ...preset, key }; records.set(key, created); added.push(created);
    actions.push(key === preset.key ? 'New shoot' : `Add copy · ${key}`);
  }
  if (records.size > 100) throw new Error(`This would save ${records.size} shoots and built-in edits. The Library supports 100; remove some saved shoots or import fewer at once.`);
  return { presets: [...records.values()], added, updated, skipped, actions };
}
