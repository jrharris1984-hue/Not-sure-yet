export const REFERENCE_RECIPES = [
  { id: "balanced", label: "Balanced", description: "Strong identity and outfit retention with enough freedom to change pose.", strengths: { face: 95, body: 85, clothing: 95, background: 80, lighting: 85 } },
  { id: "strict", label: "Maximum match", description: "Keep the source as close as possible. Best for smaller pose changes.", strengths: { face: 100, body: 100, clothing: 100, background: 100, lighting: 100 } },
  { id: "pose_first", label: "Pose first", description: "Prioritize a difficult pose while still protecting recognizable identity.", strengths: { face: 90, body: 70, clothing: 85, background: 55, lighting: 70 } },
];

export const DEFAULT_REFERENCE_STRENGTHS = REFERENCE_RECIPES[0].strengths;

const strengthPhrase = (value) => {
  if (value >= 95) return "preserve exactly";
  if (value >= 80) return "strongly preserve";
  if (value >= 60) return "preserve where compatible with the new pose";
  return "allow natural adaptation of";
};

export function preservationStrengthInstruction(strengths = DEFAULT_REFERENCE_STRENGTHS) {
  return [
    `${strengthPhrase(strengths.face)} the source face and recognizable identity`,
    `${strengthPhrase(strengths.body)} the source body shape and proportions`,
    `${strengthPhrase(strengths.clothing)} the source clothing, colors, materials, and accessories`,
    `${strengthPhrase(strengths.background)} the source background and scene objects`,
    `${strengthPhrase(strengths.lighting)} the source lighting and photographic treatment`,
  ].join("; ");
}

export function referenceStudioSummary({ sourceReady = false, poseId = "", poseNotes = "", poseAnalysis = "", strengths = DEFAULT_REFERENCE_STRENGTHS } = {}) {
  const hasPose = !!(poseId || String(poseNotes).trim() || String(poseAnalysis).trim());
  const warnings = [];
  if (!sourceReady) warnings.push("Add the character/source image before rendering.");
  if (!hasPose) warnings.push("Choose a pose, describe one, or analyze a pose-reference image.");
  if (hasPose && strengths.background >= 95) warnings.push("Maximum background preservation can fight large pose changes; Balanced is safer.");
  if (hasPose && strengths.body >= 95) warnings.push("Maximum body preservation may reduce adherence to a dramatically different pose.");
  return {
    ready: sourceReady && hasPose,
    headline: sourceReady && hasPose ? "Ready for a protected pose edit" : "Reference Studio needs attention",
    details: [
      sourceReady ? "Source character loaded" : "Source character missing",
      poseAnalysis ? "Pose reference analyzed" : hasPose ? "Text pose selected" : "Pose missing",
      `Face ${strengths.face}% · body ${strengths.body}% · outfit ${strengths.clothing}%`,
      `Scene ${strengths.background}% · lighting ${strengths.lighting}%`,
    ],
    warnings,
  };
}
