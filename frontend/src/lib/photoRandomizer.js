import { randomizeSection } from './dna';
import { enforcePhotoConsistency, photoIssues } from './photoConsistency';
export const PHOTO_RANDOM_SCOPES = [
  {id:'scene', label:'Scene only', sections:['scene','lighting','camera','style']},
  {id:'pose', label:'Pose only', sections:['pose']},
  {id:'lighting', label:'Lighting only', sections:['lighting']},
  {id:'camera', label:'Camera only', sections:['camera']},
  {id:'footwear', label:'Footwear photo', sections:['pose','feet','camera']},
  {id:'appearance', label:'Appearance only', sections:['physique','face','hair','skin']},
];
const shared = ['scene','lighting','camera','style'];
export function randomizePhotoSubjects(subjects, scope, locks = {}) {
  const spec = PHOTO_RANDOM_SCOPES.find(item => item.id === scope);
  if (!spec) throw new Error('Unknown photo randomizer');
  const result = subjects.map((subject, index) => {
    let dna = JSON.parse(JSON.stringify(subject.dna));
    for (const section of spec.sections) if (!locks[section] && (!shared.includes(section) || index === 0)) {
      dna[section] = randomizeSection(section, dna[section], subject.field_locks?.[section], {profile:'natural',avoidCurrent:true});
    }
    if (scope === 'footwear') {
      const set = (section, field, value) => { if (!locks[section] && !subject.field_locks?.[section]?.[field]) dna[section] = {...dna[section],[field]:value}; };
      const shoes = dna.wardrobe?.footwear || 'barefoot';
      const visibleToes = /barefoot|sandals/i.test(shoes);
      set('pose','action','sitting on edge'); set('pose','hands','at sides');
      set('pose','focus','feet'); set('pose','distance',subjects.length > 1 ? 'full body' : 'detail shot');
      set('feet','composition_mode','feet focus'); set('feet','framing',subjects.length > 1 ? 'full body' : 'knees-down');
      set('feet','foot_pose','feet side by side'); set('feet','sole_presentation','');
      set('feet','pedicure',visibleToes ? ['natural nails','painted french','painted red'][Math.floor(Math.random()*3)] : '');
      set('camera','angle','eye-level'); set('camera','lens','50mm');
    }
    dna = enforcePhotoConsistency(dna, locks, subject.field_locks, spec.sections);
    return {...subject,dna};
  });
  for (const subject of result.slice(1)) for (const section of spec.sections.filter(key => shared.includes(key))) {
    if (locks[section]) continue;
    for (const [field,value] of Object.entries(result[0].dna[section] || {})) {
      if (!['background','props','extra'].includes(field) && !subject.field_locks?.[section]?.[field]) subject.dna[section][field] = JSON.parse(JSON.stringify(value));
    }
  }
  const sharedIssues = result.slice(1).flatMap(subject => spec.sections.filter(section => shared.includes(section)).flatMap(section =>
    Object.keys(result[0].dna[section] || {}).filter(field => !['background','props','extra'].includes(field)).some(field => JSON.stringify(subject.dna[section]?.[field]) !== JSON.stringify(result[0].dna[section][field]))
      ? [`${subject.label}: Locked ${section} choices differ from the shared photo setup.`] : []));
  return {subjects:result, issues: [...new Set([...sharedIssues, ...result.flatMap(subject => photoIssues(subject.dna).map(issue => `${subject.label}: ${issue}`))])]};
}
