export const SAME_CHARACTER_POSES = [
  { id: "contrapposto", label: "Standing", prompt: "standing in a relaxed contrapposto pose with weight naturally balanced on one leg" },
  { id: "walking", label: "Walking", prompt: "walking naturally in mid-step with believable arm swing and weight transfer" },
  { id: "seated", label: "Seated", prompt: "seated upright in a relaxed natural posture" },
  { id: "crossed_legs", label: "Legs crossed", prompt: "seated with legs crossed naturally and hands resting comfortably" },
  { id: "kneeling", label: "Kneeling", prompt: "kneeling upright with balanced posture and natural limb placement" },
  { id: "reclining", label: "Reclining", prompt: "reclining naturally on one side with connected, anatomically plausible limbs" },
  { id: "lying_back", label: "Lying back", prompt: "lying on the back in a relaxed pose with natural weight and joint placement" },
  { id: "over_shoulder", label: "Over shoulder", prompt: "turning the torso and looking back over one shoulder" },
  { id: "arms_raised", label: "Arms raised", prompt: "standing with both arms raised overhead and shoulders positioned naturally" },
  { id: "turning", label: "Turning", prompt: "turning naturally in mid-motion with coherent balance and connected limbs" },
];

export const DEFAULT_POSE_LOCKS = {
  face: true,
  hair: true,
  skin: true,
  body: true,
  clothing: true,
  expression: true,
  background: true,
  lighting: true,
};

const LOCK_TEXT = {
  face: "the same face, identity, age, and facial features",
  hair: "the same hairstyle, hair color, and hair texture",
  skin: "the same skin tone, texture, markings, tattoos, and makeup",
  body: "the same body shape, proportions, height, and physical traits",
  clothing: "the exact same clothing, accessories, colors, and materials",
  expression: "the same facial expression and gaze",
  background: "the same setting, background objects, and scene details",
  lighting: "the same lighting, color treatment, and photographic style",
};

export function buildSameCharacterPoseInstruction({ poseId = "", notes = "", poseAnalysis = "", locks = DEFAULT_POSE_LOCKS, preservationInstruction = "" } = {}) {
  const preset = SAME_CHARACTER_POSES.find((pose) => pose.id === poseId);
  const requestedPose = [preset?.prompt, String(notes || "").trim(), String(poseAnalysis || "").trim()].filter(Boolean).join("; ");
  if (!requestedPose) return "";

  const preserved = Object.entries(LOCK_TEXT)
    .filter(([key]) => locks?.[key] !== false)
    .map(([, text]) => text);

  return [
    `Repose the same adult person into this new body pose: ${requestedPose}.`,
    "Change only the body pose, limb placement, joint angles, and natural weight distribution required for the new pose.",
    preservationInstruction
      ? `Preservation priorities: ${preservationInstruction}.`
      : preserved.length ? `Preserve ${preserved.join("; ")}.` : "Preserve all recognizable identity details that are not explicitly changed.",
    "Do not retain or overlay the old limb positions. Render one coherent, connected adult body with one head, one torso, exactly two arms, two hands, two legs, and two feet.",
    "Keep hands and feet anatomically plausible with correct joints and digit counts. Avoid duplicate limbs, fused anatomy, detached body parts, warped perspective, or extra people.",
    locks?.background !== false
      ? "Reframe only as much as necessary to fit the new pose while keeping the original scene recognizable."
      : "The scene may be reframed naturally to accommodate the new pose.",
  ].filter(Boolean).join(" ");
}
