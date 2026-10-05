import { wardrobeNudity } from "./wardrobeNudity";
import { footVisibility } from './footVisibility';
// Resolve shared visual controls on a copy. Saved selections remain editable.
const list = value => Array.isArray(value) ? value : value ? [value] : [];
const lower = value => String(value || '').toLowerCase();
export function resolveBuilderControls(source = {}) {
  const dna = JSON.parse(JSON.stringify(source));
  for (const section of ['pose', 'feet', 'wardrobe', 'hair', 'skin', 'scene', 'camera']) dna[section] ||= {};
  const notes = [];
  const omit = (section, field, text) => {
    if (!dna[section][field] || (Array.isArray(dna[section][field]) && !dna[section][field].length)) return;
    dna[section][field] = Array.isArray(dna[section][field]) ? [] : '';
    notes.push({ section, field, text });
  };
  const p = dna.pose, f = dna.feet, w = dna.wardrobe;
  const croppedAboveFeet = ['waist-up', 'thigh-up', 'knees-up', 'portrait', 'close-up'].includes(p.distance);
  const focus = f.composition_mode === 'feet focus' || (!f.composition_mode && p.focus === 'feet' && !croppedAboveFeet);
  if (!focus && p.focus === 'feet' && croppedAboveFeet) {
    p.focus = 'full frame';
    notes.push({ section: 'pose', field: 'focus', text: 'This crop excludes feet. Select Feet focus to switch to a foot crop.' });
  }
  if (focus) {
    if (p.focus !== 'feet') notes.push({ section: 'pose', field: 'focus', text: 'Feet focus controls the composition priority. Switch Feet to supporting detail to use the Pose focus.' });
    p.focus = 'feet';
    if (f.framing) {
      const distance = f.framing === 'full body' ? 'full body' : 'detail shot';
      if (p.distance !== distance) notes.push({ section: 'pose', field: 'distance', text: `Feet framing (${f.framing}) controls the crop while Feet focus is active.` });
      p.distance = distance;
    }
  } else {
    if (f.composition_mode === 'supporting detail' && p.focus === 'feet') {
      p.focus = 'full frame';
      notes.push({ section: 'pose', field: 'focus', text: 'Feet is set to supporting detail, so the overall frame stays primary.' });
    }
    omit('feet', 'framing', 'Pose & framing controls the crop. Choose Feet focus to use a separate foot crop.');
    omit('feet', 'sole_presentation', 'Sole presentation requires Feet focus; foot appearance stays a supporting detail.');
    if (p.action) omit('feet', 'foot_pose', 'The body pose controls stance. Choose Feet focus to use a separate foot pose.');
  }
  // Imported or older recipes can contain combinations the current chips prevent.
  for (const [field, groups] of Object.entries({
    toes: [['toe curl', 'toe spread', 'toe point', 'toe scrunch', 'big toe out', 'wiggling toes', 'toes flexed', 'toes gripping fabric']],
    foot_state: [['bare', 'in nylons', 'in socks'], ['dirty', 'muddy', 'freshly washed']],
  })) {
    let values = list(f[field]);
    for (const group of groups) {
      const selected = values.filter(v => group.includes(v));
      if (selected.length > 1) {
        const kept = selected.at(-1);
        values = values.filter(v => !group.includes(v) || v === kept);
        notes.push({ section: 'feet', field, text: `Kept ${kept} instead of incompatible saved choices.` });
      }
    }
    if (f[field] !== undefined) f[field] = values;
  }
  if (w.dress_style || w.skirt_style || (w.top && w.top !== 'none') || (w.bottom && w.bottom !== 'none')) {
    omit('wardrobe', 'outfit_set', 'Individual garments override the complete outfit set.');
    omit('wardrobe', 'outfit_preset', 'Individual garments override the outfit preset.');
  } else if (w.outfit_set) omit('wardrobe', 'outfit_preset', 'The complete outfit set overrides the outfit preset.');
  if (w.dress_style) {
    omit('wardrobe', 'top', 'The selected dress replaces the separate top.');
    omit('wardrobe', 'bottom', 'The selected dress replaces the separate bottom.');
    omit('wardrobe', 'skirt_style', 'The selected dress replaces the separate skirt.');
  } else if (w.skirt_style) omit('wardrobe', 'bottom', 'The selected skirt replaces the separate bottom.');
  const exposure = wardrobeNudity(w);
  if (exposure.mode !== 'use selected outfit' && ['nude', 'topless', 'bottomless'].includes(w.outfit_preset)) {
    omit('wardrobe', 'outfit_preset', 'Clothing coverage overrides the conflicting Bare preset. Choose Use selected outfit to follow that preset.');
  }
  if (exposure.mode === 'lingerie only') {
    const saved = source.wardrobe || {};
    const lingerie = [saved.outfit_set, saved.outfit_preset].find(value => /lingerie|negligee|chemise|babydoll|corset and garters|sheer bodysuit/i.test(value || ''));
    for (const field of ['outfit_set', 'outfit_set_color', 'outfit_preset', 'dress_style', 'skirt_style', 'top', 'bottom', 'state', 'material', 'garment_pattern', 'fit']) {
      omit('wardrobe', field, 'Lingerie only replaces outer clothing. Your outfit stays saved for other coverage choices.');
    }
    if (lingerie) w.outfit_preset = lingerie;
    else if (!w.underwear || w.underwear === 'none') {
      w.outfit_preset = 'lace lingerie set';
      notes.push({ section: 'wardrobe', field: 'underwear', text: 'Lingerie only uses a lace lingerie set until you select a lingerie detail or preset.' });
    }
  }
  if (exposure.mode === 'lingerie showing') {
    if (!w.underwear || w.underwear === 'none') w.underwear = 'lace lingerie set';
    omit('wardrobe', 'state', 'Lingerie showing opens the outer outfit instead of the separate clothing-state choice.');
  }
  if (exposure.mode === 'partially nude') {
    omit('wardrobe', 'state', 'Partial nudity controls coverage instead of the separate clothing-state choice. Some clothing stays on.');
    if (![w.outfit_set, w.outfit_preset, w.dress_style, w.skirt_style, w.top, w.bottom, w.underwear].some(item => item && item !== 'none')) {
      w.underwear = 'plain briefs';
      notes.push({ section: 'wardrobe', field: 'exposure_mode', text: 'Partial nudity keeps plain briefs on when no garment is selected. Choose a garment to customize the remaining coverage.' });
    }
  }
  if (exposure.suppressClothing) {
    for (const field of ['outfit_set', 'outfit_set_color', 'outfit_preset', 'dress_style', 'skirt_style', 'top', 'bottom', 'underwear', 'material', 'garment_color', 'garment_pattern', 'palette', 'fit', 'state']) {
      omit('wardrobe', field, 'Clothing coverage overrides this garment detail. Your selection stays saved; choose Use selected outfit or Open or shifted outfit to include it.');
    }
  } else if (exposure.mode === 'open or shifted outfit') {
    if (![w.outfit_set, w.outfit_preset, w.dress_style, w.skirt_style, w.top, w.bottom, w.underwear].some(item => item && item !== 'none')) {
      notes.push({ section: 'wardrobe', field: 'exposure_mode', text: 'Choose an outfit preset, complete set, or individual garment for Open or shifted outfit.' });
    }
    omit('wardrobe', 'state', 'Open or shifted outfit controls garment position instead of the separate clothing-state choice.');
  }
  if (w.outfit_set && (w.heel_type || w.hosiery_type || w.footwear)) notes.push({ section: 'wardrobe', field: 'outfit_set', text: 'This complete set may include shoes or hosiery. Use individual garments when you need separate footwear choices.' });
  if (w.heel_type) omit('wardrobe', 'footwear', 'The selected heel type overrides the general footwear choice.');
  if (w.hosiery_type) omit('feet', 'hosiery', 'Wardrobe hosiery controls coverage; the Feet hosiery fallback is inactive.');
  const hosiery = lower(w.hosiery_type || f.hosiery);
  const footwear = lower(w.heel_type || w.footwear);
  const visibility = footVisibility(w, f);
  if ((hosiery && hosiery !== 'bare') || (footwear && footwear !== 'barefoot')) {
    const state = list(f.foot_state);
    const keep = state.filter(v => (v !== 'bare' || visibility.bare) && !(hosiery && hosiery !== 'bare' && ['in socks', 'in nylons'].includes(v)));
    if (keep.length !== state.length) {
      f.foot_state = keep;
      notes.push({ section: 'feet', field: 'foot_state', text: 'Selected footwear and hosiery control coverage instead of the conflicting foot-state choice.' });
    }
  }
  if (footwear === 'barefoot' && !visibility.bare) omit('wardrobe', 'footwear', 'Selected hosiery replaces the barefoot description.');
  if (!visibility.toesVisible) {
    for (const field of ['pedicure', 'pedicure_art', 'toenail_shape', 'toe_length', 'toes', 'foot_accessories']) {
      omit('feet', field, 'Hidden by the selected closed footwear or opaque foot covering. Use bare feet, open footwear, or toeless hosiery to show this detail.');
    }
  }
  if (!visibility.soleVisible) {
    for (const field of ['sole_texture', 'arch', 'sole_presentation']) omit('feet', field, 'Footwear or footed hosiery covers the sole. Select bare feet or footless hosiery to show bare sole details.');
  }
  if (!focus && p.action) {
    const toePositions = ['toe curl', 'toe spread', 'toe point', 'toe scrunch', 'big toe out', 'wiggling toes', 'toes flexed', 'toes gripping fabric'];
    if (list(f.toes).some(value => toePositions.includes(value))) {
      f.toes = list(f.toes).filter(value => !toePositions.includes(value));
      notes.push({ section: 'feet', field: 'toes', text: 'The main body pose controls toe position; foot accessories remain available.' });
    }
  }
  if (f.pedicure === 'natural nails') omit('feet', 'pedicure_art', 'Natural nails takes priority over painted nail art.');
  if (!focus && croppedAboveFeet) for (const field of Object.keys(f)) {
    if (field !== 'composition_mode') omit('feet', field, 'Outside the selected crop. Choose a wider frame or Feet focus to show this detail.');
  }
  const stance = lower(f.foot_pose);
  if (focus && /walking|standing on tiptoe/.test(stance) && p.action && !/standing|walking/.test(lower(p.action))) {
    omit('pose', 'action', 'The selected standing/walking foot pose replaces the conflicting body pose.');
  }
  if (focus && /toes pointed|toes flexed/.test(stance)) {
    const expected = stance === 'toes pointed' ? 'toe point' : 'toes flexed';
    if (list(f.toes).some(v => ['toe curl', 'toe spread', 'toe point', 'toes flexed'].includes(v) && v !== expected)) {
      f.toes = list(f.toes).filter(v => !['toe curl', 'toe spread', 'toe point', 'toes flexed'].includes(v));
      notes.push({ section: 'feet', field: 'toes', text: 'The selected foot pose controls toe position.' });
    }
  }
  if ((p.angle === 'from above' && dna.camera.angle === 'low') || (p.angle === 'from below' && ['high', 'birds-eye'].includes(dna.camera.angle))) omit('camera', 'angle', 'Pose & framing controls camera height instead of the opposing Camera angle.');
  if (/bald|shaved/.test(lower(dna.hair.style))) for (const field of ['length', 'texture', 'bangs']) omit('hair', field, 'The selected shaved/bald hairstyle replaces this hair detail.');
  if (/bun|chignon|ponytail|updo|braid|locs|twists/i.test(dna.hair.style) && ['pixie', 'short bob'].includes(dna.hair.length)) omit('hair', 'length', 'The selected tied or braided hairstyle replaces the conflicting short haircut.');
  if (/pixie|buzz|bob/i.test(dna.hair.style) && ['long', 'waist-length'].includes(dna.hair.length)) omit('hair', 'length', 'The selected short hairstyle replaces the conflicting long hair length.');
  if (Number(dna.skin.glow) > 0 && ['matte', 'dewy', 'oiled', 'sweat-glistening', 'satin skin finish'].includes(dna.skin.texture)) omit('skin', 'texture', 'The Glow slider controls skin finish; the competing finish preset is inactive.');
  const environment = lower(dna.scene.environment);
  const indoor = /bedroom|bathroom|studio|office|living room|kitchen/.test(environment);
  const outdoor = /beach|forest|park|garden|street|desert/.test(environment);
  if ((indoor && dna.scene.indoor_outdoor === 'outdoor') || (outdoor && dna.scene.indoor_outdoor === 'indoor')) omit('scene', 'indoor_outdoor', 'The selected environment controls whether the scene is indoors or outdoors.');
  return { dna, notes };
}

// Exact values survive each compiler's word budget. Numbers express a requested
// visual direction; they do not guarantee a measurable change in the image.
const sliders = [
  ['identity', 'age', 'age', 80], ['physique', 'muscularity', 'muscularity', 100],
  ['physique', 'bust_scale', 'bust size', 100], ['physique', 'implant_volume', 'implant visual size', 5000],
  ['physique', 'butt_scale', 'glute size', 300], ['physique', 'thigh_scale', 'thigh size', 100],
  ['physique', 'hip_scale', 'hip width', 100], ['physique', 'waist_scale', 'waist width', 100],
  ['skin', 'glow', 'skin glow', 100],
  ['scenario', 'explicit_level', 'scenario intensity', 100], ['scenario', 'kink_level', 'scenario styling intensity', 100],
];
export function sliderPromptSignature(dna = {}) {
  return sliders.flatMap(([section, key, label, max]) => {
    const raw = dna[section]?.[key];
    if (!Number.isFinite(Number(raw)) || raw === '' || raw === undefined || raw === null) return [];
    const value = Math.max(0, Math.min(max, Number(raw)));
    if (key !== 'age' && !value) return []; // 0 restores the preset.
    if (['bust_scale'].includes(key) && Number(dna.physique?.implant_volume) > 0) return [];
    if (key === 'implant_volume' && !value) return [];
    if (key === 'age') return [`age ${value} years`];
    return [`${label} ${value}/${max}`];
  }).join(', ');
}
