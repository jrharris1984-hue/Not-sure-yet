import { buildCompactNarrative } from './compactNarrative';

const sentence = value => {
  const text = String(value || '').trim();
  return text ? text + (/[.!?]$/.test(text) ? '' : '.') : '';
};

// Construct scenes from resolved, visible selections, never by guessing what
// an expanded keyword means. The same requirements feed the selection audit.
export function buildSceneNarrative(subjects, catalog, compiler, raunch, {motion = '', video = false} = {}) {
  const compact = buildCompactNarrative(subjects, catalog, compiler, raunch);
  const {lead, framing, cast, shared, count} = compact.sceneParts;
  const selected = key => shared.find(item => item.section === key)?.text || '';
  const tagged = ['sdxl','sdxl_dmd2','pony'].includes(compiler);
  const opening = video ? `One continuous cinematic shot showing exactly ${count} adult ${count === 1 ? 'person' : 'people'}.` : lead.trim();
  const world = [
    selected('scene') && sentence(`The scene is situated in ${selected('scene')}`),
    selected('lighting') && sentence(`Lighting throughout the scene uses ${selected('lighting')}`),
    selected('camera') && sentence(`The camera is configured with ${selected('camera')}`),
  ].filter(Boolean);
  const people = cast.map(person => {
    const reference = count > 1 ? `Subject ${person.label}` : 'The subject';
    return [
      sentence(`${count > 1 ? reference + ' is ' : ''}${person.identity}`),
      person.wardrobe && sentence(`${reference} wears ${person.wardrobe}`),
      person.pose && sentence(`${reference} ${video ? "begins in this pose and framing" : "is posed and framed as follows"}: ${person.pose}`),
      person.appearance && sentence(`${reference}'s appearance includes ${person.appearance}`),
      person.details && sentence(`Further visible details for ${reference.toLowerCase()}: ${person.details}`),
    ].filter(Boolean).join(' ');
  });
  const content = [
    opening, framing,
    ...world,
    selected('scenario') && sentence(`The subjects and action share this context: ${selected('scenario')}`),
    ...people,
    video && motion.trim() && sentence(`Action over time: ${motion.trim()}`),
    selected('style') && sentence(`The visual treatment follows ${selected('style')}`),
    video
      ? 'Keep unrequested details consistent over time; express the selected action and camera motion as one continuous shot.'
      : 'Depict the selected subjects, clothing and surroundings together in one coherent scene, with consistent perspective and lighting.',
  ].filter(Boolean);
  const present = {setting:!!selected('scene'), lighting:!!selected('lighting'), camera:!!selected('camera'),
    action:compact.requirements.some(item => item.section === 'pose' && ['action','position','hands','body_language'].includes(item.field)) || !!selected('scenario') || !!motion.trim()};
  return {
    positive:content.join(' '), requirements:compact.requirements, profile:'scene-narrative-v1',
    scenePlan:{version:1, task:video ? 'text-to-video' : 'text-to-image', language:tagged ? 'narrative-with-model-tags' : 'natural-language',
      subjectCount:count, selectedSubjects:cast.length, present, missing:Object.keys(present).filter(key => !present[key]),
      // Defaults add only physical coherence; no invented location, outfit,
      // character, movement or camera lens is silently inserted.
      defaults:['consistent perspective and lighting'], references:cast.map(person => person.label)},
  };
}
