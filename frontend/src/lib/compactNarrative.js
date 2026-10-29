import { underneathLayer, underneathCoverage } from "./underneathLayer";
import { isPromptMetadata } from "./promptMetadata";
import { expectedSubjectCount } from './dna';
import { catalogControl, catalogSelection, physiqueKeywords } from './promptCatalog';
import { ageAppearancePrompt } from './ageAppearance';
import { buildPromptPriorityPlan } from './promptPriority';
import { expandPrompt } from './promptMap';
import { wardrobeNudity } from './wardrobeNudity';

const clean = value => String(value ?? '').replace(/\s+/g, ' ').trim();
const present = value => value !== undefined && value !== null && value !== '' && value !== 'none';
const join = values => [...new Set(values.filter(Boolean).map(clean))].join(', ');
const title = key => key.replace(/^custom_/, '').replace(/_/g, ' ');
const SHARED = new Set(['scenario', 'scene', 'lighting', 'camera', 'style']);
const SKIP = new Set(['identity.age', 'identity.gender', 'wardrobe.outfit_mode', 'wardrobe.set_lingerie_mode',
  'wardrobe._exposurePrompt', 'wardrobe.nudity_level', 'wardrobe.nudity_outfit', 'wardrobe.exposure_mode', 'wardrobe.set_lingerie', 'feet.composition_mode',
  'scenario.cast_size', 'scenario.cast_age_mode', 'scenario.cast_age_gap', 'scenario.cast_resemblance',
  'scenario.kink_level', 'style.anatomy_mode']);
function visibleStockingWardrobe(dna, index, section, tagged) {
  const wardrobe = dna.wardrobe || {};
  const exposure = wardrobeNudity(wardrobe);
  let pieces = section(dna, 'wardrobe', index);
  const lingerie = clean(wardrobe.set_lingerie || wardrobe.underwear);
  const override = wardrobe._exposurePrompt;
  const compact = override?.mode === (exposure.selection || exposure.mode) && (tagged && override.short_tags || override.short);
  const direction = clean(compact ? exposure.direction.replace(override.text, compact) : exposure.direction);

  // In full-set mode the matching lingerie can be emitted once as a wardrobe
  // field and again inside the exposure instruction. Keep one authoritative copy.
  if (lingerie && direction.toLowerCase().includes(lingerie.toLowerCase())) {
    pieces = pieces.filter(piece => clean(piece).toLowerCase() !== lingerie.toLowerCase());
  }

  const layer = underneathLayer(wardrobe, dna._catalogSelections?.wardrobe?.set_lingerie);
  const alreadyIncluded = layer && [...pieces, direction].some(piece => clean(piece).toLowerCase().includes(layer.value.toLowerCase()));
  return join([...pieces, direction, layer && !alreadyIncluded ? layer.text : '', underneathCoverage(wardrobe, layer?.value)]);
}

// A crop label alone is easy to lose behind a long appearance description.
// Give the resolved full-length selection an early, concrete camera instruction.
function fullLengthDirection(dna) {
  const framing = catalogControl(dna, 'pose', 'distance');
  if (!['full body', 'wide shot'].includes(framing)) return '';
  const reclining = /\b(?:lying|reclining|on back|on stomach)\b/i.test(catalogControl(dna, 'pose', 'action') || '');
  const lead = framing === 'wide shot' ? 'Wide environmental full-length photograph' : 'Full-length photograph';
  return `${lead}: the entire person fits inside the image from the top of the head to both complete feet, including any worn footwear, with space above the head and below the soles; camera far enough away to include the whole body.${reclining ? ' Include the entire reclining body with space on every side.' : ''}`;
}

const CONTEXT = {
  physique: { height:'height', body_type:'build', shoulders:'shoulders', legs:'legs', proportions:'proportions' },
  face: { eye_shape:'eyes', eye_color:'eyes', jawline:'jawline', nose:'nose', lips:'lips', expression:'expression' },
  hair: { color:'hair', length:'hair', style:'hairstyle', texture:'hair texture', bangs:'bangs' },
  skin: { tone:'skin', texture:'skin texture', freckles:'freckles', tattoos:'tattoos' },
  wardrobe: { garment_color:'garment color', outfit_set_color:'outfit color', palette:'clothing palette', fit:'clothing fit',
    material:'clothing material', garment_pattern:'garment pattern',
    heel_color:'footwear color', heel_finish:'footwear finish', heel_height:'heel height',
    hosiery_color:'hosiery color', hosiery_pattern:'hosiery pattern', hosiery_denier:'hosiery denier',
    nail_color:'fingernails', nail_shape:'fingernail shape', glasses_color:'glasses color' },
  pose: { action:'pose', angle:'view', distance:'framing', focus:'composition focus', hands:'hands', body_language:'body language' },
  scene: { environment:'setting', background:'background', era:'era', indoor_outdoor:'location' },
  lighting: { source:'light', style:'lighting', mood:'lighting mood', direction:'light direction', color_temp:'light temperature' },
  camera: { lens:'lens', angle:'camera angle', aperture:'aperture', aspect_ratio:'aspect ratio' },
};

// Compile resolved fields, never infer selections from an expanded prompt.
// Only explicit short wording may replace custom keywords; otherwise retain them.
export function buildCompactNarrative(subjects, catalog = {sections:[]}, compiler = 'standard', raunch = false) {
  const tagged = ['sdxl', 'sdxl_dmd2', 'pony'].includes(compiler);
  const requirements = [];
  const section = (dna, key, index) => {
    const numeric = buildPromptPriorityPlan({dna});
    const numericItems = [...numeric.mustMatch, ...numeric.important, ...numeric.detail];
    return Object.entries(dna[key] || {}).flatMap(([field, value]) => {
      if (isPromptMetadata(key, field)) return [];
      if (value === 'none' && ['hair.bangs', 'skin.freckles'].includes(`${key}.${field}`)) {
        const phrase = `no ${field}`;
        requirements.push({subject:index, section:key, field, text:phrase});
        return [phrase];
      }
      if (SKIP.has(`${key}.${field}`) || !present(value) || Array.isArray(value) && !value.length) return [];
      if (typeof value === 'number') {
        if (key === 'identity') return [];
        const phrase = numericItems.find(item => item.key === `${key}.${field}`)?.phrase;
        if (phrase) requirements.push({subject:index, section:key, field, text:phrase});
        return phrase ? [phrase] : [];
      }
      if (typeof value === 'object' && !Array.isArray(value)) return [];
      const selected = catalogSelection(dna, key, field);
      const options = catalog.sections?.find(item => item.key === key)?.fields?.find(item => item.key === field)?.options || [];
      return (Array.isArray(value) ? value : [value]).map((part, partIndex) => {
        const original = Array.isArray(selected) ? selected[partIndex] : selected;
        const option = Array.isArray(value) ? options.find(item => item.value === part || item.keywords?.trim() === clean(part)) : options.find(item => item.value === original);
        const override = tagged && option?.short_tags?.trim() || option?.short?.trim();
        let phrase;
        if (override) phrase = key === 'physique' ? physiqueKeywords(override, field, dna) : override;
        else if (option?.keywords?.trim() || key.startsWith('custom_') || field.startsWith('custom_')) phrase = clean(part);
        else if (CONTEXT[key]?.[field]) {
          const context = CONTEXT[key][field];
          if (key === 'wardrobe' && field === 'material') part = expandPrompt(key,field,part,{dna,raunch});
          phrase = new RegExp(`\\b${context.split(' ')[0]}\\b`, 'i').test(clean(part)) ? clean(part) : `${clean(part)} ${context}`;
        } else if (key === 'identity' && field === 'ethnicity') phrase = `${clean(part)} heritage`;
        else phrase = clean(expandPrompt(key, field, part, {dna, raunch}));
        // Exact, contextual requirements let the preview report what was emitted.
        if (phrase) requirements.push({subject:index, section:key, field, text:clean(phrase)});
        return phrase;
      });
    });
  };
  const sceneCast = [];
  const people = subjects.map((subject, index) => {
    const dna = subject.dna || {};
    const gender = catalogSelection(dna, 'identity', 'gender');
    const person = ({male:'man', female:'woman', 'non-binary':'non-binary person', androgynous:'androgynous person'})[gender] || 'person';
    const age = Number(dna.identity?.age);
    const identity = join([age ? `${age}-year-old adult ${person}` : `adult ${person}`, ageAppearancePrompt(age), ...section(dna, 'identity', index)]);
    const appearance = join(['physique', 'face', 'hair', 'skin'].flatMap(key => section(dna, key, index)));
    const wardrobe = visibleStockingWardrobe(dna, index, section, tagged);
    const pose = join(section(dna, 'pose', index));
    const otherKeys = Object.keys(dna).filter(key => !key.startsWith('_') && !SHARED.has(key) && !['identity','physique','face','hair','skin','wardrobe','pose'].includes(key));
    const other = join(otherKeys.flatMap(key => section(dna, key, index)));
    sceneCast.push({label:subject.label || String.fromCharCode(65 + index), identity, appearance, wardrobe, pose, details:other});
    const prefix = subjects.length > 1 ? `Subject ${subject.label || String.fromCharCode(65 + index)}: ` : '';
    return prefix + (tagged ? join([identity, appearance, wardrobe, pose, other])
      : [identity, appearance && `Appearance: ${appearance}`, wardrobe && `Wearing: ${wardrobe}`, pose && `Pose and framing: ${pose}`, other && `Additional selected details: ${other}`].filter(Boolean).join('. '));
  });
  const primary = subjects[0]?.dna || {};
  const sceneShared = [];
  const shared = [...SHARED].map(key => {
    const phrases = join(section(primary, key, 0));
    if (phrases) sceneShared.push({section:key,text:phrases});
    return phrases && (tagged ? phrases : `${title(key)}: ${phrases}`);
  }).filter(Boolean);
  const count = Math.max(subjects.length, expectedSubjectCount(primary));
  const genders = subjects.map(subject => catalogSelection(subject.dna, 'identity', 'gender'));
  const men = genders.filter(gender => gender === 'male').length;
  const women = genders.filter(gender => gender === 'female').length;
  const countTags = count === subjects.length ? join([men && `${men}boy${men > 1 ? 's' : ''}`, women && `${women}girl${women > 1 ? 's' : ''}`, count === 1 && 'solo']) : '';
  const prefix = compiler === 'pony' ? `score_9, score_8_up, source_photo, photorealistic${countTags ? `, ${countTags}` : ''}. `
    : `Photorealistic photograph of exactly ${count === 1 ? 'one' : count} adult ${count === 1 ? 'person' : 'people'}. `;
  const framing = subjects.map((subject, index) => {
    const direction = fullLengthDirection(subject.dna || {});
    return direction && (subjects.length > 1 ? `Framing for Subject ${subject.label || String.fromCharCode(65 + index)}: ${direction}` : direction);
  }).filter(Boolean).join(' ');
  const positive = prefix + (framing ? framing + ' ' : '') + [...people, ...shared].join('. ') + '.';
  return {positive, requirements, profile:'compact-narrative-v1', sceneParts:{lead:prefix, framing, cast:sceneCast, shared:sceneShared, count}};
}
