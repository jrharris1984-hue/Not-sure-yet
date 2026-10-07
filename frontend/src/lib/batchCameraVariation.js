const CAMERA_VARIATIONS = [
  { poseAngle: "front", cameraAngle: "eye-level", label: "front · eye-level" },
  { poseAngle: "3/4", cameraAngle: "eye-level", label: "3/4 · eye-level" },
  { poseAngle: "profile", cameraAngle: "eye-level", label: "profile · eye-level" },
  { poseAngle: "front", cameraAngle: "low", label: "front · low angle" },
  { poseAngle: "3/4", cameraAngle: "low", label: "3/4 · low angle" },
  { poseAngle: "front", cameraAngle: "high", label: "front · high angle" },
  { poseAngle: "3/4", cameraAngle: "high", label: "3/4 · high angle" },
  { poseAngle: "over-shoulder", cameraAngle: "eye-level", label: "over-shoulder · eye-level" },
];

const normalize = value => String(value || "").replace(/\s+/g, " ").trim();

function seededStart(seed, size) {
  if (!size) return 0;
  return Math.abs(Math.trunc(Number(seed) || 0)) % size;
}

export function batchCameraVariation({ subjects = [], index = 0, seed = 0 } = {}) {
  if (!subjects.length) return { subjects, camera: null };

  const currentPoseAngle = normalize(subjects[0]?.dna?.pose?.angle);
  const currentCameraAngle = normalize(subjects[0]?.dna?.camera?.angle);
  const choices = CAMERA_VARIATIONS.filter(item =>
    !(item.poseAngle === currentPoseAngle && item.cameraAngle === currentCameraAngle)
  );
  if (!choices.length) return { subjects, camera: null };

  const choice = choices[(seededStart(seed, choices.length) + index) % choices.length];
  const nextSubjects = subjects.map(subject => ({
    ...subject,
    dna: {
      ...(subject.dna || {}),
      pose: {
        ...(subject.dna?.pose || {}),
        angle: choice.poseAngle,
      },
      camera: {
        ...(subject.dna?.camera || {}),
        angle: choice.cameraAngle,
      },
    },
  }));

  return { subjects: nextSubjects, camera: choice };
}

export { CAMERA_VARIATIONS };
