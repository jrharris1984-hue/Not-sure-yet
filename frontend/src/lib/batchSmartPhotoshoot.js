import { batchPoseVariation } from "@/lib/batchPoseVariation";
import { batchCameraVariation } from "@/lib/batchCameraVariation";

const EXPRESSIONS = ["neutral", "smirk", "smile", "serious", "sultry", "laughing"];

const normalize = value => String(value || "").replace(/\s+/g, " ").trim();

function rotateChoice(values, current, index, seed = 0) {
  const choices = values.filter(value => normalize(value) && normalize(value) !== normalize(current));
  if (!choices.length) return current;
  const start = Math.abs(Math.trunc(Number(seed) || 0)) % choices.length;
  return choices[(start + index) % choices.length];
}

function compatibleFramings(subjects = []) {
  const count = subjects.length;
  const action = normalize(subjects[0]?.dna?.pose?.action).toLowerCase();
  if (count > 1) return ["wide shot", "full body", "thigh-up"];
  if (/lying|kneeling|squatting|all fours|doggy|sitting/.test(action)) {
    return ["full body", "wide shot", "thigh-up"];
  }
  if (/walking|dancing/.test(action)) return ["full body", "wide shot", "thigh-up"];
  return ["full body", "thigh-up", "waist-up", "portrait"];
}

export function smartPhotoshootVariation({
  subjects = [],
  sections = [],
  promptCatalog,
  index = 0,
  seed = 0,
  options = {},
} = {}) {
  if (!subjects.length) return { subjects, changed: false, plan: {} };

  const vary = {
    pose: options.pose !== false,
    camera: options.camera !== false,
    framing: options.framing !== false,
    expression: options.expression === true,
  };

  let nextSubjects = subjects;
  const plan = {};

  if (vary.pose) {
    const pose = batchPoseVariation({
      subjects: nextSubjects,
      sections,
      promptCatalog,
      index,
      seed,
    });
    nextSubjects = pose.subjects;
    if (pose.pose) plan.pose = pose.pose.label || pose.pose.value;
  }

  if (vary.camera) {
    const camera = batchCameraVariation({
      subjects: nextSubjects,
      index,
      seed: seed + 7919,
    });
    nextSubjects = camera.subjects;
    if (camera.camera) plan.camera = camera.camera.label;
  }

  if (vary.framing) {
    const current = nextSubjects[0]?.dna?.pose?.distance;
    const framing = rotateChoice(compatibleFramings(nextSubjects), current, index, seed + 1543);
    if (framing && framing !== current) {
      nextSubjects = nextSubjects.map(subject => ({
        ...subject,
        dna: {
          ...(subject.dna || {}),
          pose: {
            ...(subject.dna?.pose || {}),
            distance: framing,
          },
        },
      }));
      plan.framing = framing;
    }
  }

  if (vary.expression) {
    const current = nextSubjects[0]?.dna?.face?.expression;
    const expression = rotateChoice(EXPRESSIONS, current, index, seed + 3571);
    if (expression && expression !== current) {
      nextSubjects = nextSubjects.map(subject => ({
        ...subject,
        dna: {
          ...(subject.dna || {}),
          face: {
            ...(subject.dna?.face || {}),
            expression,
          },
        },
      }));
      plan.expression = expression;
    }
  }

  return {
    subjects: nextSubjects,
    changed: Object.keys(plan).length > 0,
    plan,
  };
}

export { compatibleFramings, EXPRESSIONS };
