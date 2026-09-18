// Curated pose sets for the Photo Shoot mode.
// Each pack pulls values directly from the pose.action option pool in dna.js.
export const POSE_PACKS = [
  {
    key: "editorial",
    name: "Editorial",
    hint: "High-fashion, magazine cover",
    poses: [
      "standing hip out",
      "standing hands on hips",
      "leaning wall",
      "over shoulder look",
      "sitting legs crossed",
      "walking",
      "hair flip",
      "hands on knees",
    ],
  },
  {
    key: "boudoir",
    name: "Boudoir",
    hint: "Sensual, intimate, indoors",
    poses: [
      "lying back",
      "lying side",
      "lying stomach",
      "kneeling back arched",
      "arched on knees",
      "sitting on edge",
      "sitting legs open",
      "on back legs up",
    ],
  },
  {
    key: "portrait",
    name: "Portrait Set",
    hint: "Close crops, expressive",
    poses: [
      "standing",
      "over shoulder look",
      "hair flip",
      "hands on knees",
      "leaning forward",
      "sitting legs crossed",
    ],
  },
  {
    key: "action",
    name: "Action / Motion",
    hint: "Dynamic energy",
    poses: [
      "walking",
      "dancing",
      "standing arms up",
      "standing back arched",
      "hair flip",
      "standing legs apart",
      "standing splits",
      "squatting deep",
    ],
  },
  {
    key: "explicit",
    name: "Explicit Suite",
    hint: "Adult, exposed poses",
    poses: [
      "lying legs spread",
      "lying legs up",
      "on back legs up",
      "doggy arched",
      "doggy low",
      "squatting spread",
      "kneeling hands floor",
      "all fours",
    ],
  },
  {
    key: "foot_set",
    name: "Foot Set",
    hint: "Sole-up, footjob POV, foot worship",
    poses: [
      "lying legs up",
      "lying stomach",
      "sitting on edge",
      "kneeling upright",
      "over shoulder look",
      "lying side",
      "on back legs up",
      "all fours",
    ],
  },
  {
    key: "watersports_set",
    name: "Watersports Set",
    hint: "Desperation, mid-stream, aftermath",
    poses: [
      "squatting spread",
      "standing legs apart",
      "sitting legs open",
      "kneeling upright",
      "lying back",
      "standing hip out",
      "over shoulder look",
      "leaning wall",
    ],
  },
  {
    key: "kink_set",
    name: "Kink Set",
    hint: "Tied, gagged, spanked, worshipping",
    poses: [
      "kneeling upright",
      "wrists overhead",
      "arched on knees",
      "all fours",
      "doggy arched",
      "kneeling hands floor",
      "kneeling back arched",
      "lying stomach",
    ],
  },
];

export const getPack = (key) => POSE_PACKS.find((p) => p.key === key);

export function samplePoses({ mode, packKey, manualPoses, count, allPoses }) {
  if (mode === "pack") {
    const pack = getPack(packKey) || POSE_PACKS[0];
    return cycleOrRepeat(pack.poses, count);
  }
  if (mode === "manual") {
    if (!manualPoses?.length) return Array(count).fill("");
    return cycleOrRepeat(manualPoses, count);
  }
  // random
  if (!allPoses?.length) return Array(count).fill("");
  const shuffled = [...allPoses].sort(() => Math.random() - 0.5);
  return cycleOrRepeat(shuffled, count);
}

function cycleOrRepeat(pool, count) {
  const out = [];
  for (let i = 0; i < count; i++) out.push(pool[i % pool.length]);
  return out;
}

export function cycleOutfits(outfitOverrides, count) {
  // outfitOverrides is an array of partial wardrobe patches. If empty, return N empty objects.
  const out = [];
  if (!outfitOverrides?.length) {
    for (let i = 0; i < count; i++) out.push({});
    return out;
  }
  for (let i = 0; i < count; i++) out.push(outfitOverrides[i % outfitOverrides.length]);
  return out;
}
