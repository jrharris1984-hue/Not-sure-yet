import { useSyncExternalStore } from 'react';
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
    options:(field.groups ? field.groups.flatMap(group => group.options.map(value => ({value,label:value,keywords:'',group:group.name}))) : (field.options || []).map(value => ({value,label:value,keywords:'',group:''}))),
  }))};
}
export function catalogSections(base, config = catalog) {
  const result = base.map(section => {
    const saved = config.sections.find(item => item.key === section.key);
    if (!saved) return section;
    return {...section,title:saved.title,fields:section.fields.map(field => buildField(field,saved.fields.find(item => item.key === field.key))).concat(saved.fields.filter(field => !section.fields.some(item => item.key === field.key)).map(field => buildField(null,field)))};
  });
  return result.concat(config.sections.filter(section => !base.some(item => item.key === section.key)).map(section => ({...section,fields:section.fields.map(field => buildField(null,field))}))).map(section => section.key === "scenario"
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
function physiqueKeywords(keywords, field, physique = {}) {
  const controls = [
    ['height', /\b(?:petite|tall|short|statuesque|towering|height|stature)\b/i],
    ['hips', /\bhips?\b|waist-to-hip/i, 'hip_scale'],
    ['waist', /\bwaist\b|midsection|stomach/i, 'waist_scale'],
    ['shoulders', /\bshoulders?\b/i],
    ['thighs', /\bthighs?\b/i, 'thigh_scale'],
    ['legs', /\blegs?\b|inseam|limbs/i],
    ['body_type', /\b(?:athletic|muscular|fitness|petite) build\b|fitness physique/i],
  ];
  return keywords.split(',').map(clause => clause.trim()).filter(clause => clause && !controls.some(([key, pattern, slider]) =>
    field !== key && (physique[key] || slider && Number(physique[slider]) > 0) && pattern.test(clause)
  )).join(', ');
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
        const phrase = section.key === 'physique' && keywords ? physiqueKeywords(keywords, field.key, dna.physique) : keywords;
        return option ? phrase || (String(value).startsWith('custom_') ? option.label : value) : String(value || '').startsWith('custom_') ? '' : value;
      };
      const value = dna[section.key][field.key];
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
      if(field.options.some(option => !validText(option?.value) || !validText(option.label) || !validText(option.keywords,true,1500) || !validText(option.group || '',true)))throw new Error('Enter valid choice names, groups and keywords (maximum 1,500 characters).');
    }
  }
  const rules=value.rules || [];
  if(!Array.isArray(rules) || rules.length>100 || !unique(rules.map(rule => rule?.key)) || rules.some(rule => !validKey(rule?.key) || !validText(rule.label) || !validText(rule.text,false,1500) || !['positive','negative'].includes(rule.kind) || !['all','image','edit','video','text_video'].includes(rule.scope) || typeof rule.enabled!=='boolean'))throw new Error('Enter a name and wording for each rule.');
  return value;
}
