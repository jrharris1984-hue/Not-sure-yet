import { DEFAULT_DNA, makeSubject, randomizeDna } from './dna';
const copy = value => JSON.parse(JSON.stringify(value));
const pick = values => values[Math.floor(Math.random() * values.length)];

export const RANDOM_SCENE_MODES = [
  { id: 'solo', label: 'Solo woman' },
  { id: 'duo', label: 'Two women' },
  { id: 'feet', label: 'Feet focus' },
  { id: 'duo_feet', label: 'Two women · Feet focus' },
];

export function randomSceneSubjects(current = [], mode = 'solo', profile = 'adventurous', locks = {}) {
  if (!RANDOM_SCENE_MODES.some(item => item.id === mode)) throw new Error('Unknown random scene mode');
  const count = mode.startsWith('duo') ? 2 : 1;
  const feetFocus = mode.includes('feet');
  const randomLocks = { ...locks, intimate: true, kink: true, scenario: true, watersports: true };
  const result = Array.from({length: count}, (_, index) => {
    const original = current[index];
    const source = original?.dna || current[0]?.dna || DEFAULT_DNA;
    const fieldLocks = copy(original?.field_locks || {});
    const dna = randomizeDna(copy(source), randomLocks, fieldLocks, { profile });
    // Selecting a cast mode explicitly sets its count and gender.
    dna.identity = { ...dna.identity, gender: 'female' };
    dna.scenario = { ...dna.scenario, cast_size: count === 2 ? 'duo' : 'solo', cast_type: count === 2 ? 'best friends' : 'none', cast_age_mode: 'individual ages', cast_resemblance: 'individual faces' };
    if (!locks.scenario && !fieldLocks.scenario?.acts) dna.scenario.acts = ['posing'];
    if (feetFocus) {
      // A simple seated template gives feet a clear attachment to each subject.
      const frame = count === 2 ? 'full body' : pick(['full body','knees-down','feet close-up','pedicure close-up']);
      dna.pose = { ...dna.pose, action:'sitting on edge', hands:'at sides', angle:'front', focus:'feet', distance:frame === 'full body' ? 'full body' : 'detail shot' };
      dna.feet = { ...dna.feet, composition_mode:'feet focus', framing:frame, foot_pose:'feet side by side', toes:[], sole_presentation:'', pedicure:pick(['natural nails','painted red','painted french']), pedicure_art:'', toenail_shape:'short rounded' };
      if (!locks.wardrobe) {
        if (!fieldLocks.wardrobe?.heel_type) dna.wardrobe.heel_type = '';
        if (!fieldLocks.wardrobe?.footwear) dna.wardrobe.footwear = 'barefoot';
        if (!fieldLocks.wardrobe?.hosiery_type) dna.wardrobe.hosiery_type = '';
      }
    } else dna.feet = { ...dna.feet, composition_mode:'supporting detail' };
    return original ? { ...original, label:String.fromCharCode(65 + index), dna } : makeSubject({label:String.fromCharCode(65 + index), dna, fieldLocks});
  });
  // One shared environment and lighting setup for the entire cast.
  for (const subject of result.slice(1)) for (const section of ['scenario','scene','lighting','camera','style']) subject.dna[section] = copy(result[0].dna[section]);
  return result;
}
