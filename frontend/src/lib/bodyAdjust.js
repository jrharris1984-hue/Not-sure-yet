// Body Adjust has a separate denoise curve from ordinary Image Variations.
const STRENGTH_POINTS = [[0, 0.55], [25, 0.40], [50, 0.28], [60, 0.38], [75, 0.50], [100, 0.62]];

export function bodyAdjustDenoise(value) {
  const amount = Number.isFinite(Number(value)) ? Math.max(0, Math.min(100, Number(value))) : 50;
  for (let i = 1; i < STRENGTH_POINTS.length; i += 1) {
    const [end, high] = STRENGTH_POINTS[i];
    const [start, low] = STRENGTH_POINTS[i - 1];
    if (amount <= end) return Number((low + ((amount - start) / (end - start)) * (high - low)).toFixed(4));
  }
  return 0.62;
}

const REGIONS = {
  glutes: ["glutes", "rearward projection and volume"],
  bust: ["bust", "projection and volume"],
  hips: ["hips", "width"],
  thighs: ["thighs", "thickness"],
  waist: ["waist", "width"],
};

export function buildBodyAdjustInstruction(regionId, value) {
  const amount = Number.isFinite(Number(value)) ? Math.max(0, Math.min(100, Number(value))) : 50;
  const [region, dimension] = REGIONS[regionId] || REGIONS.glutes;
  if (amount === 50) return "Preserve the source image's body proportions and the same adult subject, identity, pose, clothing, framing, background, and lighting.";
  const magnitude = Math.abs(amount - 50);
  const degree = magnitude >= 45 ? "substantially" : magnitude >= 25 ? "noticeably" : "slightly";
  const action = amount > 50 ? "Enlarge" : "Reduce";
  const direction = amount > 50 ? "greater" : "less";
  const others = Object.values(REGIONS).map(([name]) => name).filter((name) => name !== region).join(", ");
  return `Edit only the adult subject's ${region} region. ${action} the ${region} with ${degree} ${direction} ${dimension}. The difference from the source image must be clearly visible. Maintain one anatomically connected body. Preserve the subject's identity, face, hair, skin, pose, hands, clothing, camera angle, framing, background, and lighting. Do not alter the ${others} or any other body region.`;
}
