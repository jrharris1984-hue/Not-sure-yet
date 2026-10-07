import { batchCameraVariation } from "@/lib/batchCameraVariation";
import { sharedPoseGroups } from "@/lib/promptCatalog";
import { PHOTOGRAPHY_POSE_GROUPS, photographyPosePrompt } from "@/lib/photographyPoses";

const EXPRESSIONS = ["neutral", "smirk", "smile", "serious", "sultry", "laughing"];
const SMART_SHARED_GROUP = /portrait|interaction|movement|seated|angle|composition|candid/i;

const normalize = value => String(value || "").replace(/\s+/g, " ").trim();

function rotateChoice(values, current, index, seed = 0) {
  const choices = values.filter(value => normalize(value) && normalize(value) !== normalize(current));
  if (!choices.length) return current;
  const start = Math.abs(Math.trunc(Number(seed) || 0)) % choices.length;
  return choices[(start + index) % choices.length];
}

function smartPoseChoices(count, promptCatalog) {
  if (count > 1) {
    return sharedPoseGroups(count, promptCatalog)
      .filter(group => SMART_SHARED_GROUP.test(group.label || ""))
      .flatMap(group => group.poses || [])
      .map(pose => ({
        value: normalize(pose.prompt || pose.value),
        label: pose.label || pose.value,
      }))
      .filter(pose => pose.value);
  }

  return PHOTOGRAPHY_POSE_GROUPS
    .flatMap(group => group.options || [])
    .map(value => ({
      value: photographyPosePrompt(value),
      label: value,
    }));
}

function varyPose(subjects, promptCatalog, index, seed) {
  const count = subjects.length;
  const current = normalize(subjects[0]?.dna?.pose?.action);
  const choices = smartPoseChoices(count, promptCatalog)
    .filter(choice => normalize(choice.value) !== current);
  if (!choices.length) return { subjects, pose: null };

  const start = Math.abs(Math.trunc(Number(seed) || 0)) % choices.length;
  const pose = choices[(start + index) % choices.length];
  return {
    pose,
    subjects: subjects.map(subject => ({
      ...subject,
      dna: {
        ...(subject.dna || {}),
        pose: {
          ...(subject.dna?.pose || {}),
          action: pose.value,
          ...(count > 1 ? { distance: "wide shot" } : {}),
        },
      },
    })),
  };
}

function compatibleFramings(subjects = []) {
  const count = subjects.length;
  const action = normalize(subjects[0]?.dna?.pose?.action).toLowerCase();
  if (count > 1) return ["wide shot", "full body", "thigh-up"];
  if (/lying|kneeling|squatting|all fours|doggy|sitting|seated/.test(action)) {
    return ["full body", "wide shot", "thigh-up"];
  }
  if (/walking|dancing|mid-stride|turning/.test(action)) return ["full body", "wide shot", "thigh-up"];
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
    const pose = varyPose(nextSubjects, promptCatalog, index, seed);
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

export { compatibleFramings, EXPRESSIONS, smartPoseChoices };
