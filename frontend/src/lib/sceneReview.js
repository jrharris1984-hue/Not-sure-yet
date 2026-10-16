import { catalogControl } from './promptCatalog';
import { buildCompactNarrative } from './compactNarrative';

// A readable snapshot of resolved compiler inputs, not a claim about the image
// or about wording added later by a manual/AI prompt override.
export function buildSceneReview(subjects, catalog, compiler, raunch, {video = false, motion = '', sharedPose = ''} = {}) {
  const {sceneParts} = buildCompactNarrative(subjects, catalog, compiler, raunch);
  const {cast, shared, count, framing} = sceneParts;
  const sections = cast.map(person => ({
    label: count > 1 ? `Subject ${person.label}` : 'Subject',
    details: [person.identity, person.wardrobe && `Outfit: ${person.wardrobe}`,
      person.pose && `Pose and framing: ${person.pose}`, person.appearance && `Appearance: ${person.appearance}`,
      person.details && `Visible details: ${person.details}`].filter(Boolean),
  }));
  const context = shared.map(item => `${item.section.charAt(0).toUpperCase() + item.section.slice(1)}: ${item.text}`);
  if (sharedPose) context.push(`Shared pose: ${sharedPose}`);
  if (framing) context.push(framing);
  if (motion.trim()) context.push(`Motion: ${motion.trim()}`);
  if (context.length) sections.push({label:'Shared scene', details:context});
  const missing = ['scene', 'lighting', 'camera'].filter(key => !shared.some(item => item.section === key && item.text));
  return {version:1, task:video ? 'text-to-video' : 'text-to-image', subject_count:count, sections, aspect_ratio:String(catalogControl(subjects[0]?.dna, 'camera', 'aspect_ratio') || ''), framing:subjects.map(subject => String(catalogControl(subject.dna, 'pose', 'distance') || 'unspecified')),
    missing, adjustments:[...new Set(subjects.flatMap(subject => (subject.controlNotes || []).map(note => note.text).filter(Boolean)))]};
}
