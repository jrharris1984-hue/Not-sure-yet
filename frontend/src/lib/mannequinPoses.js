// Local joint geometry for non-anatomical pose mannequins.
const LEGACY_POSES = {
  // Standing family
  "standing": { head: [12, 4.5], spine: [12, 7, 12, 15], la: [12, 9, 9, 13], ra: [12, 9, 15, 13], ll: [12, 15, 11, 22], rl: [12, 15, 13, 22] },
  "standing hip out": { head: [12, 4.5], spine: [12, 7, 13, 15], la: [12, 9, 8, 13], ra: [13, 9, 15, 12], ll: [13, 15, 11, 22], rl: [13, 15, 15, 22] },
  "standing hands on hips": { head: [12, 4.5], spine: [12, 7, 12, 15], la: [12, 10, 10.5, 14], ra: [12, 10, 13.5, 14], elbows: [[7,11],[17,11]], ll: [12, 15, 11, 22], rl: [12, 15, 13, 22] },
  "standing arms up": { head: [12, 4.5], spine: [12, 7, 12, 15], la: [12, 9, 7, 4], ra: [12, 9, 17, 4], ll: [12, 15, 11, 22], rl: [12, 15, 13, 22] },
  "standing back arched": { head: [11, 4.5], spine: [11, 7, 13, 15], la: [11, 9, 7, 12], ra: [11, 9, 15, 14], ll: [13, 15, 14, 22], rl: [13, 15, 11, 22] },
  "standing legs apart": { head: [12, 4.5], spine: [12, 7, 12, 15], la: [12, 9, 8, 13], ra: [12, 9, 16, 13], ll: [12, 15, 6, 22], rl: [12, 15, 18, 22] },
  "standing splits": { head: [12, 4.5], spine: [12, 7, 12, 14], la: [12, 9, 8, 12], ra: [12, 9, 16, 12], ll: [12, 14, 2, 20], rl: [12, 14, 22, 20] },
  "walking": { head: [12, 4.5], spine: [12, 7, 12, 15], la: [12, 9, 9, 6], ra: [12, 9, 15, 12], ll: [12, 15, 8, 22], rl: [12, 15, 16, 21] },

  // Leaning
  "leaning wall": { head: [10, 4.5], spine: [10, 7, 14, 15], la: [10, 9, 6, 12], ra: [10, 9, 14, 13], ll: [14, 15, 12, 22], rl: [14, 15, 16, 22] },
  "leaning forward": { head: [8, 6], spine: [8, 8, 14, 12], la: [8, 9, 5, 14], ra: [8, 9, 12, 15], ll: [14, 12, 12, 22], rl: [14, 12, 16, 22] },
  "bending over": { head: [6, 8], spine: [6, 9, 14, 12], la: [6, 10, 3, 15], ra: [6, 10, 9, 16], ll: [14, 12, 13, 22], rl: [14, 12, 17, 22] },

  // Sitting
  "sitting legs crossed": { head: [12, 4.5], spine: [12, 7, 12, 13], la: [12, 9, 8, 12], ra: [12, 9, 16, 12], ll: [12, 13, 6, 17], rl: [12, 13, 18, 17] },
  "sitting legs open": { head: [12, 4.5], spine: [12, 7, 12, 13], la: [12, 9, 8, 12], ra: [12, 9, 16, 12], ll: [12, 13, 3, 20], rl: [12, 13, 21, 20] },
  "sitting reverse chair": { head: [12, 4.5], spine: [12, 7, 12, 13], la: [12, 9, 8, 6], ra: [12, 9, 16, 6], ll: [12, 13, 8, 21], rl: [12, 13, 16, 21] },
  "sitting on edge": { head: [12, 4.5], spine: [12, 7, 12, 13], la: [12, 9, 9, 13], ra: [12, 9, 15, 13], ll: [12, 13, 8, 21], rl: [12, 13, 16, 21] },

  // Kneeling
  "kneeling upright": { head: [12, 4.5], spine: [12, 7, 12, 14], la: [12, 9, 9, 13], ra: [12, 9, 15, 13], ll: [12, 14, 9, 19], rl: [12, 14, 15, 19] },
  "kneeling back arched": { head: [11, 4.5], spine: [11, 7, 13, 14], la: [11, 9, 8, 12], ra: [11, 9, 15, 12], ll: [13, 14, 10, 20], rl: [13, 14, 16, 20] },
  "kneeling hands floor": { head: [8, 8], spine: [8, 9, 14, 13], la: [8, 10, 5, 18], ra: [8, 10, 11, 18], ll: [14, 13, 12, 20], rl: [14, 13, 18, 20] },

  // Lying
  "lying back": { head: [3, 12], spine: [4, 12, 20, 12], la: [10, 12, 8, 15], ra: [10, 12, 12, 15], ll: [20, 12, 22, 9], rl: [20, 12, 22, 15] },
  "lying side": { head: [3, 14], spine: [4, 14, 20, 14], la: [10, 14, 12, 11], ra: [10, 14, 12, 17], ll: [20, 14, 22, 10], rl: [20, 14, 22, 18] },
  "lying stomach": { head: [3, 12], spine: [4, 12, 20, 12], la: [8, 12, 5, 8], ra: [8, 12, 5, 16], ll: [20, 12, 22, 9], rl: [20, 12, 22, 15] },
  "lying legs spread": { head: [3, 12], spine: [4, 12, 15, 12], la: [8, 12, 5, 8], ra: [8, 12, 5, 16], ll: [15, 12, 22, 4], rl: [15, 12, 22, 20] },
  "lying legs up": { head: [3, 14], spine: [4, 14, 14, 14], la: [8, 14, 5, 17], ra: [8, 14, 5, 11], ll: [14, 14, 20, 4], rl: [14, 14, 22, 6] },

  // Doggy / all fours
  "all fours": { head: [4, 10], spine: [5, 10, 19, 10], la: [7, 10, 5, 18], ra: [7, 10, 8, 18], ll: [19, 10, 17, 18], rl: [19, 10, 20, 18] },
  "doggy arched": { head: [4, 11], spine: [5, 11, 19, 7], la: [7, 11, 5, 18], ra: [7, 11, 8, 18], ll: [19, 7, 19, 18], rl: [19, 7, 22, 18] },
  "doggy low": { head: [4, 14], spine: [5, 14, 19, 8], la: [7, 14, 5, 21], ra: [7, 14, 8, 21], ll: [19, 8, 19, 20], rl: [19, 8, 22, 20] },

  // Squatting
  "squatting": { head: [12, 5], spine: [12, 8, 12, 13], la: [12, 10, 8, 13], ra: [12, 10, 16, 13], ll: [12, 13, 7, 20], rl: [12, 13, 17, 20] },
  "squatting spread": { head: [12, 5], spine: [12, 8, 12, 13], la: [12, 10, 7, 15], ra: [12, 10, 17, 15], ll: [12, 13, 3, 21], rl: [12, 13, 21, 21] },
  "squatting deep": { head: [12, 6], spine: [12, 8, 12, 12], la: [12, 10, 8, 13], ra: [12, 10, 16, 13], ll: [12, 12, 5, 15], rl: [12, 12, 19, 15] },

  // Cinematic / sensual
  "over shoulder look": { head: [16, 4.5], spine: [12, 7, 12, 15], la: [12, 9, 9, 13], ra: [12, 9, 15, 13], ll: [12, 15, 11, 22], rl: [12, 15, 13, 22] },
  "arched on knees": { head: [11, 5], spine: [11, 7, 15, 14], la: [11, 9, 7, 12], ra: [11, 9, 15, 12], ll: [15, 14, 13, 20], rl: [15, 14, 18, 20] },
  "hands on knees": { head: [8, 8], spine: [8, 9, 14, 15], la: [8, 10, 12, 16], ra: [8, 10, 15, 16], ll: [14, 15, 12, 22], rl: [14, 15, 17, 22] },
  "hair flip": { head: [11, 5], spine: [12, 7, 12, 15], la: [12, 9, 6, 3], ra: [12, 9, 16, 8], ll: [12, 15, 11, 22], rl: [12, 15, 13, 22] },
  "dancing": { head: [12, 4.5], spine: [12, 7, 13, 15], la: [12, 9, 6, 4], ra: [13, 9, 18, 12], ll: [13, 15, 9, 21], rl: [13, 15, 17, 22] },
  "on back legs up": { head: [3, 14], spine: [4, 14, 14, 14], la: [8, 14, 5, 17], ra: [8, 14, 5, 11], ll: [14, 14, 18, 3], rl: [14, 14, 20, 5] },
  "reverse view": { head: [12, 4.5], spine: [12, 7, 12, 15], la: [12, 9, 10, 13], ra: [12, 9, 14, 13], ll: [12, 15, 11, 22], rl: [12, 15, 13, 22] },
};


const copy = (base, overrides) => ({ ...LEGACY_POSES[base], ...overrides });
const PORTRAIT_POSES = {
  "standing quarter turn": copy("standing", { turn: true }),
  "standing weight on back leg": copy("standing hip out", { ll: [12,15,10,22], rl: [12,15,16,21] }),
  "standing thumbs in pockets": copy("standing", { la: [12,9,10,15], ra: [12,9,14,15], elbows: [[7,12],[17,12]] }),
  "standing arms loosely crossed": copy("standing", { la: [12,9,15,11], ra: [12,9,9,12], elbows: [[8,13],[16,13]] }),
  "standing one hand on waist": copy("standing hip out", { ra: [12,9,14,14], elbows: [[9,12],[18,12]] }),
  "standing ankles crossed": copy("standing", { ll: [12,15,14,22], rl: [12,15,10,22] }),
  "seated sideways on chair": copy("sitting on edge", { turn: true, profile: true }),
  "seated hands folded in lap": copy("sitting on edge", { la: [12,9,12,15], ra: [12,9,12,15] }),
  "seated leaning on chair arm": copy("sitting on edge", { head: [10,4.5], spine: [10,7,12,13], ra: [10,9,19,12] }),
  "seated on steps": copy("sitting on edge", { support: [[3,22],[3,17],[8,17],[8,13],[19,13]] }),
  "leaning shoulder against wall": copy("leaning wall", { support: [[18,3],[18,23]] }),
  "leaning forearms on railing": copy("leaning forward", { la: [8,9,6,13], ra: [8,9,11,13], support: [[2,14],[20,14],[20,23]] }),
  "leaning back against wall": copy("leaning wall", { head: [15,4.5], spine: [15,7,12,15], support: [[18,3],[18,23]] }),
  "walking mid stride": copy("walking", { turn: true }),
  "turning toward camera": copy("standing hip out", { head: [13,4.5], turn: true }),
  "adjusting jacket lapel": copy("standing", { la: [12,9,11,10], ra: [12,9,14,11], elbows: [[7,13],[17,13]] }),
};
const POSES = { ...LEGACY_POSES, ...PORTRAIT_POSES };
export const MANNEQUIN_POSE_NAMES = Object.keys(POSES);

export function mannequinPose(name = "") {
  const p = POSES[name] || POSES.standing;
  const [sx, sy, px, py] = p.spine;
  const dx = px-sx, dy = py-sy, length = Math.hypot(dx, dy) || 1;
  const width = p.profile ? 1.3 : p.turn ? 1.8 : 2.5;
  const normal = [dy/length, -dx/length];
  const offset = (x, y, amount, z) => [x+normal[0]*amount, y+normal[1]*amount, z];
  const shoulderL = offset(sx,sy+1,-width,-1), shoulderR = offset(sx,sy+1,width,1);
  const hipL = offset(px,py,-width*.6,-.8), hipR = offset(px,py,width*.6,.8);
  const midpoint = (start, end, bend) => [(start[0]+end[0])/2+bend, (start[1]+end[1])/2, start[2]];
  const leftWrist = [...p.la.slice(2), -1], rightWrist = [...p.ra.slice(2), 1];
  const leftAnkle = [...p.ll.slice(2), -.8], rightAnkle = [...p.rl.slice(2), .8];
  let leftKnee = midpoint(hipL,leftAnkle,-.7), rightKnee = midpoint(hipR,rightAnkle,.7);
  let support = p.support;
  if (/^(sitting|seated)/.test(name)) {
    leftKnee = [7,16,-.8]; rightKnee = [17,16,.8];
    leftAnkle.splice(0,2,7,22); rightAnkle.splice(0,2,17,22);
    support ||= [[5,23],[5,14],[19,14],[19,23]];
    if (name === "sitting legs open") { leftKnee = [4,16,-.8]; rightKnee = [20,16,.8]; leftAnkle.splice(0,2,3,22); rightAnkle.splice(0,2,21,22); }
    if (name === "sitting legs crossed") { rightKnee = [8,16,.8]; rightAnkle.splice(0,2,15,21); }
    if (name === "seated sideways on chair") { leftKnee = [17,15,-.8]; rightKnee = [19,16,.8]; leftAnkle.splice(0,2,17,22); rightAnkle.splice(0,2,19,22); }
  } else if (/kneeling|on knees/.test(name)) {
    leftKnee = [9,20,-.8]; rightKnee = [15,20,.8];
    leftAnkle.splice(0,2,6,20); rightAnkle.splice(0,2,19,20);
  } else if (name.startsWith("squatting")) {
    const wide = name === "squatting spread" ? 2 : 5;
    leftKnee = [wide,16,-.8]; rightKnee = [24-wide,16,.8];
    leftAnkle.splice(0,2,8,22); rightAnkle.splice(0,2,16,22);
  }
  return {
    fallback: !POSES[name], profile: !!p.profile, head: [...p.head,0], neck: [sx,sy,0],
    torso: [shoulderL,shoulderR,hipR,hipL], support,
    leftArm: [shoulderL,p.elbows?.[0] ? [...p.elbows[0],-1] : midpoint(shoulderL,leftWrist,-1.1),leftWrist],
    rightArm: [shoulderR,p.elbows?.[1] ? [...p.elbows[1],1] : midpoint(shoulderR,rightWrist,1.1),rightWrist],
    leftLeg: [hipL,leftKnee,leftAnkle], rightLeg: [hipR,rightKnee,rightAnkle],
  };
}
