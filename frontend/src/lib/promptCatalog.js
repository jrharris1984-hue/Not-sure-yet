import { useSyncExternalStore } from 'react';
import { expandPrompt } from './promptMap';
import { wardrobeExposure } from './wardrobeNudity';

export const SHARED_POSE_SECTION = {
  key: 'shared_poses',
  title: 'Shared Poses',
  fields: [
    {
      key: 'two_people',
      label: '2 people',
      type: 'pose_chips',
      groups: [
        {name:'Portrait',options:['side by side','shoulder to shoulder','formal portrait pose','casual candid pose','looking at camera together','mirrored pose','staggered standing']},
        {name:'Interaction',options:['facing each other','looking at each other','close conversational pose','leaning together','embracing','hugging from behind','holding hands','arm in arm']},
        {name:'Movement',options:['walking together','walking arm in arm','dancing together','one behind the other']},
        {name:'Seated & mixed levels',options:['seated together','seated side by side','seated facing each other','one seated and one standing']},
        {name:'Angles',options:['back to back','over-the-shoulder pairing']},
      ],
    },
    {
      key: 'group',
      label: '3–4 people',
      type: 'pose_chips',
      groups: [
        {name:'Group composition',options:['group portrait','staggered lineup','semicircle','standing at different depths']},
        {name:'Interaction',options:['walking together','seated group','hands joined','casual candid group']},
      ],
    },
  ],
};

export function promptLibrarySections(base = []) {
  const scenario = base.find(section => section.key === 'scenario');
  const identity = base.find(section => section.key === 'identity');
  const rest = base.filter(section => !['scenario','identity','shared_poses'].includes(section.key));
  const poseIndex = rest.findIndex(section => section.key === 'pose');
  const ordered = [scenario, identity, ...rest].filter(Boolean);
  const insertAt = poseIndex >= 0 ? ordered.findIndex(section => section.key === 'pose') + 1 : ordered.length;
  ordered.splice(insertAt, 0, SHARED_POSE_SECTION);
  return ordered;
}

export function sharedPoseGroups(count = 2, config = catalog) {
  const section = catalogSections([SHARED_POSE_SECTION], config)[0];
  const field = section.fields.find(item => item.key === (count === 2 ? 'two_people' : 'group'));
  if (!field) return [];
  const options = new Map((field.options || []).map(value => [value, {
    value,
    label: field.optionLabels?.[value] || value,
  }]));
  const savedSection = config.sections?.find(item => item.key === SHARED_POSE_SECTION.key);
  const savedField = savedSection?.fields?.find(item => item.key === field.key);
  const savedOptions = new Map((savedField?.options || []).map(option => [option.value, option]));
  const groups = field.groups?.length ? field.groups : [{name:'Choices',options:field.options || []}];
  return groups.map(group => ({
    label: group.name,
    poses: group.options.map(value => {
      const display = options.get(value) || { value, label:value };
      const saved = savedOptions.get(value);
      return {
        value,
        label: saved?.label || display.label,
        prompt: saved?.keywords?.trim() || value,
      };
    }),
  }));
}

let catalog = {sections:[]};
const listeners = new Set();
export const getPromptCatalog = () => catalog;
export function setPromptCatalog(value) {
  catalog = value && Array.isArray(value.sections) ? value : {sections:[]};
  listeners.forEach(fn => fn());
}
export function usePromptCatalog() {
  return useSyncExternalStore(fn => {listeners.add(fn); return () => listeners.delete(fn);}, getPromptCatalog);
}
export const newCatalogKey = () => `custom_${(globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`).replace(/-/g,'')}`;
export function editableSection(section) {
  return {key:section.key,title:section.title,fields:section.fields.map(field => ({
    key:field.key,label:field.label,type:field.type,
    options:(field.groups ? field.groups.flatMap(group => group.options.map(value => ({value,label:field.optionLabels?.[value] || value,keywords:'',group:group.name}))) : (field.options || []).map(value => ({value,label:field.optionLabels?.[value] || value,keywords:'',group:''}))),
  }))};
}
// Include newly shipped controls without replacing edits or removed choices.
export function editableLibrarySection(base, saved) {
  if (!saved) return base ? editableSection(base) : undefined;
  if (!base) return saved;
  const defaults = editableSection(base);
  return {...saved, fields:[...defaults.fields.map(field => saved.fields.find(item => item.key === field.key) || field),
    ...saved.fields.filter(field => !defaults.fields.some(item => item.key === field.key))]};
}
export function exportPromptLibrary(base, config) {
  return {...config, sections:catalogSections(base, config).map(section => {
    const editable = editableLibrarySection(base.find(item => item.key === section.key), config.sections.find(item => item.key === section.key)) || editableSection(section);
    return {...editable, fields:editable.fields.map(field => ({...field, options:field.options.map(option => ({...option,
      base_keywords:section.key === 'shared_poses' ? option.value : expandPrompt(section.key, field.key, option.value),
    }))}))};
  })};
}
export function catalogSections(base, config = catalog) {
  const result = base.map(section => {
    const saved = config.sections.find(item => item.key === section.key);
    if (!saved) return section;
    return {...section,title:saved.title,fields:section.fields.map(field => buildField(field,saved.fields.find(item => item.key === field.key))).concat(saved.fields.filter(field => !section.fields.some(item => item.key === field.key)).map(field => buildField(null,field)))};
  });
  return result.concat(config.sections.filter(section => section.key !== SHARED_POSE_SECTION.key && !base.some(item => item.key === section.key)).map(section => ({...section,fields:section.fields.map(field => buildField(null,field))}))).map(section => section.key === "scenario"
    ? {...section, fields:section.fields.filter(field => field.key !== "kink_level")}
    : section);
}
function buildField(base, saved) {
  if (!saved) return base;
  if (base && !['chips','chips_multi','pose_chips'].includes(base.type)) return {...base,label:saved.label};
  if (base?.key === 'ethnicity' && base.groups) {
    const builtins = base.groups.flatMap(group => group.options.map(value => ({
      value, label:base.optionLabels?.[value] || value, keywords:'', group:group.name,
    })));
    const existing = new Map((saved.options || []).map(option => [option.value, option]));
    saved = {...saved, options:[
      ...builtins.map(option => ({...option, ...existing.get(option.value), group:option.group,
        label:existing.get(option.value)?.label === option.value ? option.label : existing.get(option.value)?.label || option.label})),
      ...(saved.options || []).filter(option => !builtins.some(builtin => builtin.value === option.value)),
    ]};
  }
  const options = saved.options || [];
  const groupNames = [...new Set(options.map(option => option.group || 'Choices'))];
  return {...base,key:saved.key,label:saved.label,type:base?.type || saved.type || 'chips',
    options:options.map(option => option.value),
    groups:groupNames.length > 1 || options.some(option => option.group) ? groupNames.map(name => ({name,options:options.filter(option => (option.group || 'Choices') === name).map(option => option.value)})) : undefined,
    optionLabels:Object.fromEntries(options.map(option => [option.value,option.label])),
  };
}
// Stable option values keep saved characters intact when display names change.
export const catalogSelection = (dna, section, field) => dna?._catalogSelections?.[section]?.[field] ?? dna?.[section]?.[field];

// Preset prose must not reintroduce traits owned by independent controls.
export function physiqueKeywords(keywords, field, dna = {}) {
  const physique = dna.physique || {};
  const controls = [
    ['height', /\b(?:petite|tall|short|statuesque|towering|height|stature)\b/i],
    ['hips', /\bhips?\b|waist-to-hip/i, 'hip_scale'],
    ['waist', /\bwaist\b|midsection|stomach/i, 'waist_scale'],
    ['shoulders', /\bshoulders?\b/i],
    ['thighs', /\bthighs?\b/i, 'thigh_scale'],
    ['legs', /\blegs?\b|inseam|limbs/i],
    ['body_type', /\b(?:athletic|muscular|fitness|petite) build\b|fitness physique/i],
    ['bust', /\b(?:breasts?|bust|boobs?|tits?)\b/i, 'bust_scale'],
    ['butt', /\b(?:butt(?:ocks)?|glutes?|booty|ass)\b/i, 'butt_scale'],
  ];
  const family = key => ['bust', 'bust_shape', 'implant_volume'].includes(key) ? 'bust'
    : ['butt', 'glute_shape'].includes(key) ? 'butt' : key;
  return keywords.split(',').map(clause => clause.trim()
    .replace(/\b(?:female|male)\s+/gi, '')
    .replace(/\b(?:woman|man)\b/gi, 'person')
  ).filter(clause => {
    if (!clause) return false;
    if (dna.skin?.freckles === 'none' && /freckl/i.test(clause)) return false;
    if (field === 'body_type' && physique.muscularity != null && physique.muscularity !== ''
        && Number.isFinite(Number(physique.muscularity)) && Number(physique.muscularity) <= 30
        && /\bmuscl|\bmuscular|\bbodybuilder|\bripped|\bdefined abs|\btoned|\bgym-built/i.test(clause)) return false;
    return !controls.some(([key, pattern, slider]) => family(field) !== family(key)
      && (physique[key] || slider && Number(physique[slider]) > 0) && pattern.test(clause));
  }).join(', ');
}

export function catalogDna(dna = {}, config = catalog, preserveSelections = false) {
  const result = {...dna};
  if (preserveSelections) result._catalogSelections = {};
  for (const section of config.sections) {
    if (!dna[section.key]) continue;
    result[section.key] = {...dna[section.key]};
    if (preserveSelections) result._catalogSelections[section.key] = {...dna[section.key]};
    for (const field of section.fields) {
      const translate = value => {
        const option = field.options?.find(item => item.value === value);
        const keywords = option?.keywords.trim();
        const phrase = section.key === 'physique' && keywords ? physiqueKeywords(keywords, field.key, dna) : keywords;
        // A supplied override filtered down to nothing must stay inactive,
        // rather than falling back to the label that caused the conflict.
        return option ? keywords ? phrase : (String(value).startsWith('custom_') ? option.label : value) : String(value || '').startsWith('custom_') ? '' : value;
      };
      const value = dna[section.key][field.key];
      if (section.key === 'wardrobe' && field.key === 'exposure_mode') {
        const mode = wardrobeExposure(dna.wardrobe);
        const option = field.options?.find(item => item.value === mode);
        if (option) result.wardrobe._exposurePrompt = {mode, text:option.keywords?.trim() || expandPrompt('wardrobe', 'exposure_mode', mode), short:option.short?.trim(), short_tags:option.short_tags?.trim()};
        continue;
      }
      if (value !== undefined && ['chips','chips_multi','pose_chips'].includes(field.type)) result[section.key][field.key] = Array.isArray(value) ? value.map(translate).filter(Boolean) : translate(value);
    }
  }
  return result;
}
export function customCatalogPrompt(dna = {}, config = catalog) {
  const phrases=[];
  for(const section of config.sections) for(const field of section.fields) {
    if (!section.key.startsWith('custom_') && !field.key.startsWith('custom_')) continue;
    const selected=dna[section.key]?.[field.key];
    for(const value of (Array.isArray(selected) ? selected : [selected])) {
      const option=field.options?.find(item => item.value===value);
      if(option) phrases.push(option.keywords.trim() || option.label);
    }
  }
  return [...new Set(phrases)].join('; ');
}

export function applyCatalogRules(result, kind='image', config=catalog, negativeEnabled=true) {
  kind = ['pony','face','krea_style'].includes(kind) ? 'image' : ['enhance','variation'].includes(kind) ? 'edit' : kind;
  const rules=(config.rules || []).filter(rule => rule.enabled && rule.text?.trim() && (rule.scope==='all' || rule.scope===kind));
  const positive=rules.filter(rule => rule.kind==='positive').map(rule => rule.text.trim());
  const negative=negativeEnabled && result.negativeStrategy!=='zeroed' ? rules.filter(rule => rule.kind==='negative').map(rule => rule.text.trim()) : [];
  const prompt=[result.positive,...positive].filter(Boolean).join('; ');
  return {...result,positive:prompt,negative:[result.negative,...negative].filter(Boolean).join(', '),...(result.promptWords !== undefined ? {promptWords:prompt.trim().split(/\s+/).filter(Boolean).length} : {})};
}

export function validateCatalogDraft(value) {
  const validText=(text,empty=false,max=200) => typeof text==='string' && text.length<=max && (empty || !!text.trim());
  const validKey=key => validText(key,false,64) && /^[a-z][a-z0-9_]*$/.test(key) && !['constructor','prototype','__proto__'].includes(key);
  const unique=values => new Set(values).size===values.length;
  if(!value || !Array.isArray(value.sections) || value.sections.length>60 || JSON.stringify(value).length>500000)throw new Error('Choose a valid prompt library (maximum 60 categories).');
  if(!unique(value.sections.map(section => section?.key)))throw new Error('Category identifiers must be unique.');
  for(const section of value.sections) {
    if(!validKey(section?.key) || !validText(section.title) || !Array.isArray(section.fields) || section.fields.length>80 || !unique(section.fields.map(field => field?.key)))throw new Error('Enter valid category and subcategory names.');
    for(const field of section.fields) {
      if(!validKey(field?.key) || !validText(field.label) || !['chips','chips_multi','pose_chips','slider','text'].includes(field.type) || !Array.isArray(field.options) || field.options.length>300 || !unique(field.options.map(option => option?.value)))throw new Error('Invalid subcategory or duplicate choices.');
      if(field.options.some(option => !validText(option?.value) || !validText(option.label) || !validText(option.keywords,true,1500) || !validText(option.group || '',true) || !validText(option.short === undefined ? '' : option.short,true,500) || !validText(option.short_tags === undefined ? '' : option.short_tags,true,500)))throw new Error('Enter valid choice names, groups and keywords; compact wording allows 500 characters.');
    }
  }
  const rules=value.rules || [];
  if(!Array.isArray(rules) || rules.length>100 || !unique(rules.map(rule => rule?.key)) || rules.some(rule => !validKey(rule?.key) || !validText(rule.label) || !validText(rule.text,false,1500) || !['positive','negative'].includes(rule.kind) || !['all','image','edit','video','text_video'].includes(rule.scope) || typeof rule.enabled!=='boolean'))throw new Error('Enter a name and wording for each rule.');
  return value;
}
