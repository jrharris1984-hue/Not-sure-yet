import { sharedPoseGroups } from "@/lib/promptCatalog";

const normalize = value => String(value || "").replace(/\s+/g, " ").trim();

function seededStart(seed, size) {
  if (!size) return 0;
  return Math.abs(Math.trunc(Number(seed) || 0)) % size;
}

function singlePoseChoices(sections = []) {
  const poseSection = sections.find(section => section.key === "pose");
  const action = poseSection?.fields?.find(field => field.key === "action");
  if (!action) return [];
  const values = action.groups?.length
    ? action.groups.flatMap(group => group.options || [])
    : action.options || [];
  return [...new Set(values.map(normalize).filter(Boolean))].map(value => ({
    value,
    prompt: value,
    label: action.optionLabels?.[value] || value,
  }));
}

function sharedPoseChoices(count, promptCatalog) {
  return sharedPoseGroups(count, promptCatalog)
    .flatMap(group => group.poses || [])
    .map(pose => ({
      value: normalize(pose.prompt || pose.value),
      prompt: normalize(pose.prompt || pose.value),
      label: pose.label || pose.value,
    }))
    .filter(pose => pose.value);
}

export function batchPoseVariation({
  subjects = [],
  sections = [],
  promptCatalog,
  index = 0,
  seed = 0,
} = {}) {
  if (!subjects.length) return { subjects, pose: null };

  const count = subjects.length;
  const current = normalize(subjects[0]?.dna?.pose?.action);
  const source = count > 1
    ? sharedPoseChoices(count, promptCatalog)
    : singlePoseChoices(sections);
  const choices = source.filter(choice => normalize(choice.value) !== current);

  if (!choices.length) return { subjects, pose: null };

  const choice = choices[(seededStart(seed, choices.length) + index) % choices.length];
  const nextSubjects = subjects.map(subject => ({
    ...subject,
    dna: {
      ...(subject.dna || {}),
      pose: {
        ...(subject.dna?.pose || {}),
        action: choice.value,
        ...(count > 1 ? { distance: "wide shot" } : {}),
      },
    },
  }));

  return {
    subjects: nextSubjects,
    pose: choice,
  };
}
