import { useSyncExternalStore } from 'react';
import { expandPrompt } from './promptMap';
import { withCoveragePrompt, COVERAGE_BEHAVIORS } from './wardrobeNudity';
import {setCoverageCatalog} from './coverageCatalog';
import {SIMPLE_COVERAGE_OPTIONS} from './simpleCoverage';

export const PROMPT_LIBRARY_FILE_LIMIT = 2000000;
export function parsePromptLibraryBackup(text, bytes) {
  if (bytes > PROMPT_LIBRARY_FILE_LIMIT) throw new Error('Backup is too large (maximum 2 MB).');
  return validateCatalogDraft(JSON.parse(text));
}

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
        {name:'Boudoir pairs',options:[
          'two adults reclining side by side on a chaise, shoulders turned toward the camera',
          'one adult seated at the edge of a bed while the other stands beside them, both fully in frame',
          'two adults seated close together on a bed, knees angled in opposite directions, relaxed editorial expressions',
          'one adult reclining against pillows while the other sits nearby, both faces visible',
          'two adults leaning back to back against a studio wall, balanced full-length composition',
        ]},
        {name:'Lingerie editorial pairs',options:[
          'two adults standing at different depths in coordinated lingerie, one facing camera and one in three-quarter view',
          'two adults posing side by side in contrasting coordinated lingerie looks, relaxed hands and clear silhouettes',
          'one adult adjusts a robe lapel while the other sits on a vanity stool, candid boudoir moment',
          'two adults seated on a chaise with shoulders nearly touching, one looking toward camera and one toward the window',
          'two adults standing beside a full-length mirror, one facing the mirror and the other turned toward camera',
        ]},
        {name:'Playful editorial pairs',options:[
          'two adults sharing a lighthearted laugh while walking through a softly lit studio',
          'one adult offers a hand to help the other rise from a chaise, natural candid movement',
          'two adults playfully exchange a satin robe, keeping both people and the garment clearly visible',
          'two adults dancing together at an easy pace, hands placed naturally and bodies clearly separated',
          'one adult seated on a chair while the other leans lightly over its back, friendly editorial pose',
        ]},
        {name:'Seated & reclining pairs',options:[
          'two adults seated at opposite ends of a sofa, turned inward toward one another',
          'one adult kneels upright on a cushioned bench while the other sits beside them, both in full view',
          'two adults reclining in opposite directions on a broad bed, heads turned toward the same camera',
          'one adult seated on the floor beside a chaise while the other reclines above, layered but distinct silhouettes',
          'two adults sitting back to back on the floor, shoulders touching and legs arranged in opposite directions',
        ]},
      ],
    },
    {
      key: 'group',
      label: '3–4 people',
      type: 'pose_chips',
      groups: [
        {name:'Group composition',options:['group portrait','staggered lineup','semicircle','standing at different depths']},
        {name:'Interaction',options:['walking together','seated group','hands joined','casual candid group']},
        {name:'Boudoir group portraits',options:[
          'three or four adults arranged in a relaxed seated arc on a broad chaise, every face visible',
          'three or four adults posed at staggered heights around a bed, with clear space between each silhouette',
          'three or four adults standing in a shallow V formation, shoulders angled inward toward the camera',
          'three or four adults arranged in a balanced studio portrait, two standing behind and the others seated in front',
          'three or four adults reclining in parallel along a wide sofa, heads turned toward the same camera',
        ]},
        {name:'Lingerie editorial groups',options:[
          'three or four adults in coordinated lingerie looks posed in a clean staggered lineup, each outfit visible',
          'three or four adults arranged around a vanity, one seated and the others standing at separate depths',
          'three or four adults in a loose semicircle beside a full-length mirror, each person reflected only once',
          'three or four adults grouped around a chaise in a fashion-editorial composition, distinct natural poses',
          'three or four adults posed in alternating seated and standing positions against one continuous backdrop',
        ]},
        {name:'Playful group moments',options:[
          'three or four adults sharing a candid laugh in a dressing room, naturally spaced and looking toward one another',
          'three or four adults walking together across one studio set, relaxed stride and clear separation',
          'three or four adults playfully arranging a satin robe and accessories before a shoot, candid editorial moment',
          'three or four adults gathered around a seated friend, warm expressions and unobstructed faces',
          'three or four adults turning toward camera together after a shared conversation, spontaneous group portrait',
        ]},
        {name:'Seated & reclining groups',options:[
          'three or four adults seated along one sofa at alternating angles, hands relaxed and limbs distinct',
          'three or four adults arranged on floor cushions in a shallow semicircle, full figures visible',
          'three or four adults lounging at separate positions across a wide bed, each body clearly separated',
          'three or four adults posed on different steps of a studio riser, balanced spacing and eye lines',
          'three or four adults seated around a low table in a relaxed boudoir editorial scene, all faces visible',
        ]},
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
  const baseField = SHARED_POSE_SECTION.fields.find(item => item.key === (count === 2 ? 'two_people' : 'group'));
  if (!baseField) return [];
  const savedSection = config.sections?.find(item => item.key === SHARED_POSE_SECTION.key);
  const savedField = savedSection?.fields?.find(item => item.key === baseField.key);
  const savedOptions = new Map((savedField?.options || []).map(option => [option.value, option]));
  if(savedSection?.exact_fields) {
    const groups=new Map();
    for(const option of savedField?.options||[]) {
      const label=option.group||'Custom poses';
      if(!groups.has(label))groups.set(label,[]);
      groups.get(label).push({value:option.value,label:option.label||option.value,prompt:option.keywords?.trim()||option.value});
    }
    return [...groups].map(([label,poses])=>({label,poses}));
  }
  const seen = new Set();
  const groups = baseField.groups.map(group => ({
    label: group.name,
    poses: group.options.map(value => {
      const saved = savedOptions.get(value);
      if (saved?.group && saved.group !== group.name) return null;
      seen.add(value);
      return { value, label: saved?.label || value, prompt: saved?.keywords?.trim() || value };
    }).filter(Boolean),
  }));
  // Keep shipped presets accessible even when an older saved library contains
  // only a subset. Preserve custom entries and their authored keywords.
  for (const option of savedField?.options || []) {
    if (seen.has(option.value)) continue;
    seen.add(option.value);
    const label = option.group || 'Custom poses';
    let group = groups.find(item => item.label === label);
    if (!group) {
      group = { label, poses: [] };
      groups.push(group);
    }
    group.poses.push({
      value: option.value,
      label: option.label || option.value,
      prompt: option.keywords?.trim() || option.value,
    });
  }
  return groups;
}

let catalog = {sections:[]};
const listeners = new Set();
export const getPromptCatalog = () => catalog;
export function setPromptCatalog(value) {
  catalog = value && Array.isArray(value.sections) ? value : {sections:[]};
  setCoverageCatalog(catalog);
  listeners.forEach(fn => fn());
}
export function usePromptCatalog() {
  return useSyncExternalStore(fn => {listeners.add(fn); return () => listeners.delete(fn);}, getPromptCatalog);
}
export const newCatalogKey = () => `custom_${(globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`).replace(/-/g,'')}`;
export function editableSection(section) {
  return {key:section.key,title:section.title,fields:section.fields.map(field => ({
    key:field.key,label:field.label,type:field.type,
    options:section.key==='wardrobe' && field.key==='exposure_mode' ? SIMPLE_COVERAGE_OPTIONS.map(option=>({...option})) : (field.groups ? field.groups.flatMap(group => group.options.map(value => ({value,label:field.optionLabels?.[value] || value,keywords:'',group:group.name}))) : (field.options || []).map(value => ({value,label:field.optionLabels?.[value] || value,keywords:'',group:''}))),
  }))};
}
// Include newly shipped controls without replacing edits or removed choices.
export function editableLibrarySection(base, saved) {
  if (!saved) return base ? editableSection(base) : undefined;
  if (!base || saved.exact_fields) return saved;
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
    if (saved.exact_fields) return {...section,title:saved.title,fields:saved.fields.map(field => buildField(section.fields.find(item => item.key === field.key),field,true))};
    return {...section,title:saved.title,fields:section.fields.map(field => buildField(field,saved.fields.find(item => item.key === field.key),false)).concat(saved.fields.filter(field => !section.fields.some(item => item.key === field.key)).map(field => buildField(null,field,false)))};
  });
  return result.concat(config.sections.filter(section => section.key !== SHARED_POSE_SECTION.key && !base.some(item => item.key === section.key)).map(section => ({...section,fields:section.fields.map(field => buildField(null,field))}))).filter(section=>section.key!=="kink").map(section => section.key === "scenario"
    ? {...section, fields:section.fields.filter(field => field.key !== "kink_level")}
    : section);
}
function buildField(base, saved, exactFields = false) {
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
  let options = saved.options || [];
  if (base?.key === 'exposure_mode' && !exactFields) {
    const savedByValue = new Map(options.map(option => [option.value, option]));
    const defaults = SIMPLE_COVERAGE_OPTIONS.map(option => {
      const existing = savedByValue.get(option.value);
      return {...option, ...existing, keywords: existing?.keywords?.trim() ? existing.keywords : option.keywords,
        group: existing?.group || option.group};
    });
    const shipped = new Set(defaults.map(option => option.value));
    options = [...defaults, ...options.filter(option => !shipped.has(option.value))];
  }
  const groupNames = [...new Set(options.map(option => option.group || 'Choices'))];
  return {...base,key:saved.key,label:saved.label,type:base?.type || saved.type || 'chips',
    options:options.map(option => option.value),
    groups:groupNames.length > 1 || options.some(option => option.group) ? groupNames.map(name => ({name,options:options.filter(option => (option.group || 'Choices') === name).map(option => option.value)})) : undefined,
    optionLabels:Object.fromEntries(options.map(option => [option.value,option.label])),
  };
}
// Stable option values keep saved characters intact when display names change.
export const catalogSelection = (dna, section, field) => dna?._catalogSelections?.[section]?.[field] ?? dna?.[section]?.[field];
// Behavior follows stable choices; authored custom choices use their wording.
// A field removed by render QC must not become active again from its snapshot.
export const catalogControl = (dna, section, field) => {
  const value=dna?.[section]?.[field];
  if (!value || (Array.isArray(value) && !value.length)) return value;
  const selected=catalogSelection(dna,section,field);
  return typeof selected==='string' && selected.startsWith('custom_') ? value : selected;
};

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
  const result = {...dna,kink:{}};
  if (preserveSelections) result._catalogSelections = {};
  for (const section of config.sections) {
    if (section.key==='kink' || !dna[section.key]) continue;
    result[section.key] = {...dna[section.key]};
    if (preserveSelections) result._catalogSelections[section.key] = {...dna[section.key]};
    if (section.exact_fields) {
      const allowed = new Set(section.fields.map(field => field.key));
      for (const key of Object.keys(result[section.key])) if (!allowed.has(key)) {
        delete result[section.key][key];
        if (preserveSelections) delete result._catalogSelections[section.key][key];
      }
    }
    for (const field of section.fields) {
      const translate = value => {
        const option = field.options?.find(item => item.value === value);
        const keywords = option?.keywords.trim();
        const phrase = section.key === 'physique' && keywords ? physiqueKeywords(keywords, field.key, dna) : keywords;
        // A supplied override filtered down to nothing must stay inactive,
        // rather than falling back to the label that caused the conflict.
        return option ? keywords ? phrase : (String(value).startsWith('custom_') ? option.label : value) : section.exact_fields || String(value || '').startsWith('custom_') ? '' : value;
      };
      const value = dna[section.key][field.key];
      if (section.key === 'wardrobe' && field.key === 'exposure_mode') {
        result.wardrobe = withCoveragePrompt(result.wardrobe, config);
        continue;
      }
      if (value !== undefined && ['chips','chips_multi','pose_chips'].includes(field.type)) {
        result[section.key][field.key] = Array.isArray(value) ? value.map(translate).filter(Boolean) : translate(value);
        if (section.exact_fields && preserveSelections) {
          const allowed = new Set(field.options.map(option => option.value));
          result._catalogSelections[section.key][field.key] = Array.isArray(value) ? value.filter(item => allowed.has(item)) : allowed.has(value) ? value : '';
        }
      }
    }
  }
  return result;
}
export function customCatalogPrompt(dna = {}, config = catalog) {
  const phrases=[];
  for(const section of config.sections) for(const field of section.fields) {
    if (section.key==='kink') continue;
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
  if(!value || !Array.isArray(value.sections) || value.sections.length>60 || JSON.stringify(value).length>1000000)throw new Error('Choose a valid prompt library (maximum 60 categories).');
  if(!unique(value.sections.map(section => section?.key)))throw new Error('Category identifiers must be unique.');
  for(const section of value.sections) {
    if (section?.exact_fields !== undefined && typeof section.exact_fields !== 'boolean') throw new Error('Exact category fields must be true or false.');
    if(!validKey(section?.key) || !validText(section.title) || !Array.isArray(section.fields) || section.fields.length>120 || !unique(section.fields.map(field => field?.key)))throw new Error('Enter valid category and subcategory names.');
    for(const field of section.fields) {
      if(!validKey(field?.key) || !validText(field.label) || !['chips','chips_multi','pose_chips','slider','text'].includes(field.type) || !Array.isArray(field.options) || field.options.length>300 || !unique(field.options.map(option => option?.value)))throw new Error('Invalid subcategory or duplicate choices.');
      if(field.options.some(option => !validText(option?.value) || !validText(option.label) || !validText(option.keywords,true,1500) || !validText(option.group || '',true) || !validText(option.reference_url === undefined ? '' : option.reference_url,true,1000) || (option.reference_url && !/^https:\/\/\S+$/.test(option.reference_url)) || !validText(option.reference_media_id === undefined ? '' : option.reference_media_id,true,200) || (option.reference_media_id && !/^[A-Za-z0-9_-]+$/.test(option.reference_media_id)) || !validText(option.notes === undefined ? '' : option.notes,true,1000) || !validText(option.short === undefined ? '' : option.short,true,500) || !validText(option.short_tags === undefined ? '' : option.short_tags,true,500) || (option.coverage_mode !== undefined && (section.key!=='wardrobe' || field.key!=='exposure_mode' || !COVERAGE_BEHAVIORS.includes(option.coverage_mode)))))throw new Error('Enter valid choice names, groups and keywords; compact wording allows 500 characters.');
    }
  }
  const rules=value.rules || [];
  if(!Array.isArray(rules) || rules.length>100 || !unique(rules.map(rule => rule?.key)) || rules.some(rule => !validKey(rule?.key) || !validText(rule.label) || !validText(rule.text,false,1500) || !['positive','negative'].includes(rule.kind) || !['all','image','edit','video','text_video'].includes(rule.scope) || typeof rule.enabled!=='boolean'))throw new Error('Enter a name and wording for each rule.');
  return value;
}
