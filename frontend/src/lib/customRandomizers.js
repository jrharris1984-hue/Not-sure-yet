import { SECTIONS } from './dna';
import { HERITAGE_OUTFIT_GROUP } from './heritageStyling';
import { photoCastIssues } from './photoConsistency';
const sections = new Set(['face','hair','skin','pose','scene','lighting','camera','style']);
export const customRandomizerFields = () => SECTIONS.flatMap(section => section.fields.flatMap(field => {
  if (!['chips','pose_chips'].includes(field.type) || (!sections.has(section.key) && !(section.key === 'wardrobe' && ['outfit_set','outfit_mode'].includes(field.key)))) return [];
  const options = section.key === 'wardrobe' && field.key === 'outfit_set' ? HERITAGE_OUTFIT_GROUP.options : field.groups ? field.groups.flatMap(g=>g.options) : field.options || [];
  return options.length ? [{section:section.key,field:field.key,label:`${section.title} · ${field.label}`,options,optionLabels:field.optionLabels || {}}] : [];
}));
export function applyCustomRandomizer(subjects, preset, locks = {}) {
  const catalog=customRandomizerFields();
  const rules=preset.rules || [];
  if (!rules.length) return {subjects,applied:false,issues:['This preset has no details. Edit it before applying.']};
  for (const rule of rules) {
    const spec=catalog.find(f=>f.section===rule.section && f.field===rule.field);
    if (!spec || !rule.values?.length || rule.values.some(v=>!spec.options.includes(v))) return {subjects,applied:false,issues:['A saved option is no longer in the catalog. Edit this preset before applying it.']};
  }
  let issues=[];
  const shared=new Set(['scene','lighting','camera','style']);
  for(let attempt=0;attempt<32;attempt++) {
    const samples={};
    const result=subjects.map(subject=>({...subject,dna:JSON.parse(JSON.stringify(subject.dna))}));
    result.forEach((subject,index)=>rules.forEach(rule=>{
      if(locks[rule.section] || subject.field_locks?.[rule.section]?.[rule.field]) return;
      const key=`${rule.section}.${rule.field}`;
      const old=subject.dna[rule.section]?.[rule.field];
      const alternatives=rule.values.filter(v=>v!==old);
      const pool=alternatives.length ? alternatives : rule.values;
      const value=index && shared.has(rule.section) && samples[key] !== undefined ? samples[key] : pool[Math.floor(Math.random()*pool.length)];
      if(!index) samples[key]=value;
      subject.dna[rule.section]={...subject.dna[rule.section],[rule.field]:value};
    }));
    issues=photoCastIssues(result);
    if (rules.some(rule=>rule.section==='wardrobe' && rule.field==='outfit_set') && result.some(subject=>subject.dna.wardrobe?.outfit_mode !== 'full')) issues.push('Add Wardrobe · Outfit mode with Full set selected to use a complete outfit.');
    if(!issues.length) return {subjects:result,applied:true,issues:[]};
  }
  return {subjects,applied:false,issues:['No consistent combination was found within your selected options. Your setup was kept.',...issues]};
}
