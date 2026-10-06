import { expectedSubjectCount } from './dna';
import { catalogSelection, physiqueKeywords } from './promptCatalog';
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
  'wardrobe.nudity_level', 'wardrobe.nudity_outfit', 'wardrobe.exposure_mode', 'wardrobe.set_lingerie', 'feet.composition_mode',
  'scenario.cast_size', 'scenario.cast_age_mode', 'scenario.cast_age_gap', 'scenario.cast_resemblance',
  'scenario.kink_level', 'style.anatomy_mode']);
const CONTEXT = {
  physique: { height:'height', body_type:'build', shoulders:'shoulders', legs:'legs', proportions:'proportions' },
  face: { eye_shape:'eyes', eye_color:'eyes', jawline:'jawline', nose:'nose', lips:'lips', expression:'expression' },
  hair: { color:'hair', length:'hair', style:'hairstyle', texture:'hair texture', bangs:'bangs' },
  skin: { tone:'skin', texture:'skin texture', freckles:'freckles', tattoos:'tattoos' },
  wardrobe: { garment_color:'garment color', outfit_set_color:'outfit color', palette:'palette', fit:'fit',
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
          phrase = new RegExp(`\\b${context.split(' ')[0]}\\b`, 'i').test(clean(part)) ? clean(part) : `${clean(part)} ${context}`;
        } else if (key === 'identity' && field === 'ethnicity') phrase = `${clean(part)} heritage`;
        else phrase = clean(expandPrompt(key, field, part, {dna, raunch}));
        // Exact, contextual requirements let the preview report what was emitted.
        if (phrase) requirements.push({subject:index, section:key, field, text:clean(phrase)});
        return phrase;
      });
    });
  };
  const people = subjects.map((subject, index) => {
    const dna = subject.dna || {};
    const gender = catalogSelection(dna, 'identity', 'gender');
    const person = ({male:'man', female:'woman', 'non-binary':'non-binary person', androgynous:'androgynous person'})[gender] || 'person';
    const age = Number(dna.identity?.age);
    const identity = join([age ? `${age}-year-old adult ${person}` : `adult ${person}`, ageAppearancePrompt(age), ...section(dna, 'identity', index)]);
    const appearance = join(['physique', 'face', 'hair', 'skin'].flatMap(key => section(dna, key, index)));
    const wardrobe = join([...section(dna, 'wardrobe', index), wardrobeNudity(dna.wardrobe).direction]);
    const pose = join(section(dna, 'pose', index));
    const otherKeys = Object.keys(dna).filter(key => !key.startsWith('_') && !SHARED.has(key) && !['identity','physique','face','hair','skin','wardrobe','pose'].includes(key));
    const other = join(otherKeys.flatMap(key => section(dna, key, index)));
    const prefix = subjects.length > 1 ? `Subject ${subject.label || String.fromCharCode(65 + index)}: ` : '';
    return prefix + (tagged ? join([identity, appearance, wardrobe, pose, other])
      : [identity, appearance && `Appearance: ${appearance}`, wardrobe && `Wearing: ${wardrobe}`, pose && `Pose and framing: ${pose}`, other && `Additional selected details: ${other}`].filter(Boolean).join('. '));
  });
  const primary = subjects[0]?.dna || {};
  const shared = [...SHARED].map(key => {
    const phrases = join(section(primary, key, 0));
    return phrases && (tagged ? phrases : `${title(key)}: ${phrases}`);
  }).filter(Boolean);
  const count = Math.max(subjects.length, expectedSubjectCount(primary));
  const genders = subjects.map(subject => catalogSelection(subject.dna, 'identity', 'gender'));
  const men = genders.filter(gender => gender === 'male').length;
  const women = genders.filter(gender => gender === 'female').length;
  const countTags = count === subjects.length ? join([men && `${men}boy${men > 1 ? 's' : ''}`, women && `${women}girl${women > 1 ? 's' : ''}`, count === 1 && 'solo']) : '';
  const prefix = compiler === 'pony' ? `score_9, score_8_up, source_photo, photorealistic${countTags ? `, ${countTags}` : ''}. `
    : `Photorealistic photograph of exactly ${count === 1 ? 'one' : count} adult ${count === 1 ? 'person' : 'people'}. `;
  const positive = prefix + [...people, ...shared].join('. ') + '.';
  return {positive, requirements, profile:'compact-narrative-v1'};
}
