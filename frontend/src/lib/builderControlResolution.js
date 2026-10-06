import { POSE_ACTION_PROMPTS } from './photographyPoses';
import { catalogSelection } from './promptCatalog';
import { resolveWardrobeMode } from "./wardrobeMode";
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
  dna.wardrobe = resolveWardrobeMode(dna.wardrobe);
  const p = dna.pose, f = dna.feet, w = dna.wardrobe;
  // A named pose with defined arm placement owns the hands; do not ask the
  // same arms to occupy a second position. Custom wording remains untouched.
  const selectedPose = catalogSelection(dna, 'pose', 'action');
  const poseKey = POSE_ACTION_PROMPTS[selectedPose] ? selectedPose : POSE_ACTION_PROMPTS[p.action] ? p.action
    : Object.keys(POSE_ACTION_PROMPTS).find(key => POSE_ACTION_PROMPTS[key] === p.action);
  const handsDefined = new Set([
    'standing thumbs in pockets', 'standing arms loosely crossed', 'standing one hand on waist',
    'standing hands on hips', 'standing arms up', 'seated hands folded in lap',
    'leaning forearms on railing', 'adjusting jacket lapel', 'kneeling hands floor',
    'all fours', 'hands on knees',
  ]);
  const customHands = /\b(?:hands?|forearms?|arms?|wrists?|thumbs?)\s+(?:(?:are|resting|placed|raised|bound|folded|loosely|hooked|planted|leaning)\s+)*(?:on|in|at|over|above|behind|against|crossed|bound|folded|up)\b/i.test(p.action || '');
  if (handsDefined.has(poseKey) || customHands) omit('pose', 'hands', 'The selected pose already defines arm and hand placement. The separate Hand position is inactive for this pose.');
  if (poseKey && p.body_language && lower(POSE_ACTION_PROMPTS[poseKey]).split(/[^a-z-]+/).includes(lower(p.body_language))) {
    omit('pose', 'body_language', 'The selected pose already includes this body language.');
  }
  if (poseKey === 'reverse view' && p.angle && p.angle !== 'back') {
    p.angle = 'back';
    notes.push({section:'pose',field:'angle',text:'Reverse view uses the rear camera view instead of a competing body angle.'});
  }

  if (w.outfit_mode === 'full') {
    if (!w.outfit_set) notes.push({ section: 'wardrobe', field: 'outfit_set', text: 'Choose a complete outfit set or switch to Custom for individual garments.' });
    omit('feet', 'hosiery', 'The full outfit set controls hosiery. Switch Wardrobe to Custom to use separate hosiery.');
  }
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
    const lingerie = [saved.outfit_set, saved.outfit_preset].find(value => /lingerie|negligee|chemise|babydoll|bra|bralette|knickers|teddy|corselette|corset and garters|sheer bodysuit/i.test(value || ''));
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
  if (w.outfit_set) {
    let set = w.outfit_set;
    if (w.heel_type || w.footwear) set = set.replace(/\b(?:(?:embroidered|embellished|platform)\s+)?(?:heels|stilettos|pumps|boots|sandals|flats|shoes)\b/gi, '');
    if (w.hosiery_type || f.hosiery) set = set.replace(/\b(?:(?:sheer|seamed|fishnet|lace)\s+)?(?:stockings|thigh-highs)\b/gi, '');
    if (set !== w.outfit_set) {
      w.outfit_set = set.replace(/\b(with|and)\s*(?=,|$)/gi, '').replace(/,\s*(?=,|$)/g, '').replace(/\s+/g, ' ').trim();
      notes.push({ section: 'wardrobe', field: 'outfit_set', text: 'Separate footwear and hosiery selections replace those items in the complete outfit set; the rest of the set stays active.' });
    }
  }
  if (w.heel_type) omit('wardrobe', 'footwear', 'The selected heel type overrides the general footwear choice.');
  if (w.hosiery_type) omit('feet', 'hosiery', 'Wardrobe hosiery controls coverage; the Feet hosiery fallback is inactive.');
  const footwear = lower(w.heel_type || w.footwear);
  const visibility = footVisibility(w, f);
  if (visibility.hasHosiery || visibility.hasShoe) {
    const state = list(f.foot_state);
    const keep = state.filter(v => (v !== 'bare' || visibility.bare) && !(visibility.hasHosiery && ['in socks', 'in nylons'].includes(v)));
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
  const bodyPose = lower(p.action);
  const standing = /standing|walking|running|lunging|squatting|crouch/.test(bodyPose);
  const seated = /sitting|seated/.test(bodyPose);
  const stance = lower(f.foot_pose);
  if (focus && bodyPose) {
    const conflictingStance =
      (/walking|standing on tiptoe/.test(stance) && !/standing|walking|running/.test(bodyPose)) ||
      (/feet dangling/.test(stance) && !seated) ||
      (standing && /feet resting on a cushion|soles facing lens/.test(stance));
    if (conflictingStance) omit('feet', 'foot_pose', 'The main body pose controls stance. This foot pose is inactive until you choose a compatible body pose.');
    if (standing && /soles up|soles together|sole showcase|sole toward camera|both soles toward camera|crossed ankles soles visible/.test(lower(f.sole_presentation))) {
      omit('feet', 'sole_presentation', 'This sole presentation needs raised or repositioned feet. The standing or squatting body pose stays primary.');
    }
    if (standing && ['sole close-up', 'POV under foot', 'low angle sole', 'both soles in foreground'].includes(f.framing)) {
      omit('feet', 'framing', 'This under-sole framing conflicts with the weight-bearing pose. Choose a seated or lying pose, or another foot crop.');
    }
  }
  if (/feet dangling/.test(lower(f.foot_pose))) {
    omit('feet', 'ground_surface', 'Dangling feet do not rest on a surface. The scene still supplies the surroundings.');
  }
  if (focus && /toes pointed|toes flexed/.test(lower(f.foot_pose))) {
    const expected = stance === 'toes pointed' ? 'toe point' : 'toes flexed';
    if (list(f.toes).some(v => ['toe curl', 'toe spread', 'toe point', 'toes flexed'].includes(v) && v !== expected)) {
      f.toes = list(f.toes).filter(v => !['toe curl', 'toe spread', 'toe point', 'toes flexed'].includes(v));
      notes.push({ section: 'feet', field: 'toes', text: 'The selected foot pose controls toe position.' });
    }
  }
  if (['from above', 'from below'].includes(p.angle) && ['eye-level', 'low', 'high', 'birds-eye'].includes(dna.camera.angle)) omit('camera', 'angle', 'Pose & framing already controls camera height. The separate Camera height is inactive.');
  if (/bald|shaved/.test(lower(dna.hair.style))) for (const field of ['length', 'texture', 'bangs']) omit('hair', field, 'The selected shaved/bald hairstyle replaces this hair detail.');
  if (/bun|chignon|ponytail|updo|braid|locs|twists/i.test(dna.hair.style) && ['pixie', 'short bob'].includes(dna.hair.length)) omit('hair', 'length', 'The selected tied or braided hairstyle replaces the conflicting short haircut.');
  if (/pixie|buzz|bob/i.test(dna.hair.style) && ['long', 'waist-length'].includes(dna.hair.length)) omit('hair', 'length', 'The selected short hairstyle replaces the conflicting long hair length.');
  if (Number(dna.skin.glow) > 0 && ['matte', 'dewy', 'oiled', 'sweat-glistening', 'satin skin finish'].includes(dna.skin.texture)) omit('skin', 'texture', 'The Glow slider controls skin finish; the competing finish preset is inactive.');
  const environment = lower(dna.scene.environment);
  const indoor = /bedroom|bathroom|studio|office|living room|kitchen/.test(environment);
  const outdoor = /beach|forest|park|garden|street|desert/.test(environment);
  if ((indoor && dna.scene.indoor_outdoor === 'outdoor') || (outdoor && dna.scene.indoor_outdoor === 'indoor')) omit('scene', 'indoor_outdoor', 'The selected environment controls whether the scene is indoors or outdoors.');
  const surface = lower(f.ground_surface);
  const indoorSurface = ['polished wood floor', 'tile floor', 'soft carpet', 'silk sheets', 'velvet cushion', 'marble floor'].includes(surface);
  const outdoorSurface = ['warm sand', 'wet sand', 'grass'].includes(surface);
  const inside = indoor || (!outdoor && dna.scene.indoor_outdoor === 'indoor');
  const outside = outdoor || (!indoor && dna.scene.indoor_outdoor === 'outdoor');
  if ((inside && outdoorSurface) || (outside && indoorSurface)) omit('feet', 'ground_surface', 'The selected scene takes priority over a conflicting indoor/outdoor surface under the feet.');
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
  ['scenario', 'explicit_level', 'scenario intensity', 100],
];
export function sliderPromptSignature(dna = {}, existing = "") {
  return sliders.flatMap(([section, key, label, max]) => {
    const raw = dna[section]?.[key];
    if (!Number.isFinite(Number(raw)) || raw === '' || raw === undefined || raw === null) return [];
    const value = Math.max(0, Math.min(max, Number(raw)));
    if (key !== 'age' && !value) return []; // 0 restores the preset.
    if (['bust_scale'].includes(key) && Number(dna.physique?.implant_volume) > 0) return [];
    if (key === 'implant_volume' && !value) return [];
    if (key === 'age') return new RegExp(`\\b${value}(?:-year-old|\\s*(?:years?\\b|yo\\b))`, 'i').test(existing) ? [] : [`age ${value} years`];
    return [`${label} ${value}/${max}`];
  }).join(', ');
}
