import { buildPromptPriorityPlan } from './promptPriority';
import { expandPrompt } from './promptMap';
import { physiqueControlStatus } from './physiqueControlPriority';
import { wardrobeFieldDisabled } from './wardrobeMode';
import { wardrobeNudity } from './wardrobeNudity';
import { sliderPromptSignature } from './builderControlResolution';

const normalize = value => String(value ?? '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const values = value => Array.isArray(value) ? value : [value];
const present = value => value !== undefined && value !== null && value !== '';
const shared = new Set(['scenario', 'scene', 'lighting', 'camera', 'style']);
// These controls choose how to compile other details; they are not image traits.
const behavior = new Set(['identity.name', 'wardrobe.outfit_mode', 'wardrobe.set_lingerie_mode',
  'wardrobe.nudity_level', 'wardrobe.nudity_outfit', 'feet.composition_mode', 'style.anatomy_mode',
  'scenario.kink_level', 'scenario.cast_age_mode', 'scenario.cast_age_gap', 'scenario.cast_resemblance']);

function planItems(dna) {
  const plan = buildPromptPriorityPlan({dna});
  return [...plan.mustMatch, ...plan.important, ...plan.detail];
}

// Capture the selections and the actual resolved compiler inputs. The audit
// never edits prompts, adds selections, or changes render eligibility.
export function buildSelectionManifest({sources, prepared, resolved, sections, raunch = false, compactRequirements = []}) {
  const rows = [];
  sources.forEach((subject, index) => {
    const source = subject.dna || {};
    const before = prepared[index]?.dna || {};
    const after = resolved[index]?.dna || {};
    const notes = resolved[index]?.controlNotes || [];
    const multi = sources.length > 1;
    const subjectLabel = subject.label || String.fromCharCode(65 + index);
    for (const section of sections) for (const field of section.fields) {
      const path = `${section.key}.${field.key}`;
      if (behavior.has(path) || index > 0 && shared.has(section.key)) continue;
      const raw = source[section.key]?.[field.key];
      if (!present(raw) || Array.isArray(raw) && !raw.length) continue;
      values(raw).forEach((selected, part) => {
        if (!present(selected) || selected === 'none' && !['hair.bangs', 'skin.freckles'].includes(path)) return;
        const preparedValue = before[section.key]?.[field.key];
        const expected = Array.isArray(preparedValue) ? preparedValue[part] : preparedValue;
        const effective = after[section.key]?.[field.key];
        const kept = Array.isArray(effective) ? effective.includes(expected) : same(expected, effective);
        const note = notes.find(item => item.section === section.key && item.field === field.key);
        const physiqueStatus = section.key === 'physique' ? physiqueControlStatus(field.key, source.physique) : null;
        let inactive = physiqueStatus?.inactive ? physiqueStatus.text : '';
        if (path === 'style.render' && selected !== preparedValue) inactive = `This image compiler uses ${preparedValue} instead of the saved render style.`;
        if (path === 'identity.age' && Number(selected) !== Number(preparedValue)) inactive = `The cast age controls use age ${preparedValue} instead of this saved age.`;
        if (section.key === 'wardrobe' && wardrobeFieldDisabled(field.key, source.wardrobe)) {
          inactive = 'The selected outfit mode supplies other wardrobe details. This saved control is inactive.';
        }
        if (!inactive && (!present(expected) || !kept)) {
          inactive = note?.text || (present(effective) && (!Array.isArray(effective) || effective.length)
            ? `The compiler uses ${values(effective).join(', ')} instead of this saved selection.`
            : 'A competing selection or compiler rule makes this saved control inactive.');
        }
        // A zero size slider restores its preset rather than asking for zero size.
        if (!inactive && Number(selected) === 0 && /_(?:scale|volume)$/.test(field.key)) inactive = 'Zero uses the matching preset; this size slider is inactive.';
        const single = {...after, [section.key]:{...after[section.key], [field.key]:Array.isArray(effective) ? [expected] : effective}};
        const requirement = planItems(single).find(item => item.section === section.key && item.field === (path === 'wardrobe.exposure_mode' ? 'exposure_direction' : field.key));
        const compact = compactRequirements.filter(item => item.subject === index && item.section === section.key && item.field === field.key)[part];
        let phrase = compact?.text || requirement?.phrase || (typeof selected === 'number' ? '' : expandPrompt(section.key, field.key, expected, {dna:after, raunch}));
        if (path === 'wardrobe.exposure_mode') {
          phrase = wardrobeNudity(after.wardrobe).direction;
          if (!phrase && !inactive) inactive = 'Use selected outfit follows the outfit details without adding a separate coverage instruction.';
        }
        if (['hair.bangs', 'skin.freckles'].includes(path) && selected === 'none') phrase = `no ${field.key}`;
        const signature = typeof selected === 'number' ? sliderPromptSignature({[section.key]:{[field.key]:effective}}) : '';
        // Keep only this slider's exact signature, rather than accepting an
        // unrelated slider elsewhere in the same person's prompt.
        const numericSignature = signature.split(', ').find(text => text.includes(`${selected}/`) || path === 'identity.age' && text === `age ${selected} years`);
        const terms = compact ? [phrase] : [phrase, ...(requirement?.matchTerms || []), numericSignature].filter(Boolean);
        if (path === 'identity.gender') terms.push(({female:'adult woman', male:'adult man', 'non-binary':'non-binary person', androgynous:'androgynous person'})[expected]);
        if (path === 'scenario.cast_size') {
          const count = ({solo:'one', duo:'2', threesome:'3', foursome:'4'})[expected];
          if (count) terms.push(`exactly ${count} adult ${count === 'one' ? 'person' : 'people'}`);
          if (expected === 'solo') terms.push('solo');
        }
        const label = field.optionLabels?.[selected] || selected;
        rows.push({key:`${index}:${path}:${part}`, section:section.key, field:field.key,
          label:`${multi && !shared.has(section.key) ? `Subject ${subjectLabel} · ` : ''}${section.title} · ${field.label}`,
          value:String(label), subjectLabel:multi && !shared.has(section.key) ? subjectLabel : null,
          expected:String(phrase || ''), terms:[...new Set(terms.filter(Boolean).map(normalize).filter(Boolean))], inactive,
        });
      });
    }
  });
  return rows;
}

// Each person can appear in several blocks (slider signature, appearance,
// main description). Only inspect that person's blocks for personal traits.
function subjectText(text, label) {
  if (!label) return text;
  const markers = [...text.matchAll(/\bSubject\s+([A-Za-z0-9]+)\b/gi)];
  return markers.filter(marker => marker[1].toLowerCase() === String(label).toLowerCase())
    .map(marker => text.slice(marker.index, markers[markers.indexOf(marker) + 1]?.index ?? text.length)).join(' ');
}

export function auditSelectionPrompt(positive = '', manifest = []) {
  const text = String(positive || '');
  const rows = manifest.map(row => {
    if (row.inactive) return {...row, status:'inactive', reason:row.inactive};
    const haystack = normalize(subjectText(text, row.subjectLabel));
    const detected = row.terms.some(term => term && (` ${haystack} `).includes(` ${term} `));
    return {...row, status:detected ? 'included' : 'missing', reason:detected
      ? 'Matching wording detected in the final prompt.'
      : 'Expected wording was not detected. Review the prompt; equivalent wording may still represent this selection.'};
  });
  return {rows, counts:{included:rows.filter(row=>row.status==='included').length,
    inactive:rows.filter(row=>row.status==='inactive').length, missing:rows.filter(row=>row.status==='missing').length}};
}
