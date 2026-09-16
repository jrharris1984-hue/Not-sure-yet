// Stick figure SVG icons for pose chips. Each pose is 24x24 viewBox.
// Points: head circle at (hx,hy), spine line, arms L/R, legs L/R.
// Values fine-tuned to be recognisable at 40px chip size.
import React from "react";

const F = {
  // Standing family
  "standing": { head: [12, 4.5], spine: [12, 7, 12, 15], la: [12, 9, 9, 13], ra: [12, 9, 15, 13], ll: [12, 15, 11, 22], rl: [12, 15, 13, 22] },
  "standing hip out": { head: [12, 4.5], spine: [12, 7, 13, 15], la: [12, 9, 8, 13], ra: [13, 9, 15, 12], ll: [13, 15, 11, 22], rl: [13, 15, 15, 22] },
  "standing hands on hips": { head: [12, 4.5], spine: [12, 7, 12, 15], la: [12, 10, 8, 15], ra: [12, 10, 16, 15], ll: [12, 15, 11, 22], rl: [12, 15, 13, 22] },
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

export const POSE_NAMES = Object.keys(F);

export default function PoseIcon({ name, size = 40, active = false }) {
  const p = F[name];
  const stroke = active ? "#FDE68A" : "#A1A1AA";
  if (!p) {
    return <svg width={size} height={size} viewBox="0 0 24 24" />;
  }
  const [hx, hy] = p.head;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.4" strokeLinecap="round">
      <circle cx={hx} cy={hy} r="2" />
      <line x1={p.spine[0]} y1={p.spine[1]} x2={p.spine[2]} y2={p.spine[3]} />
      <line x1={p.la[0]} y1={p.la[1]} x2={p.la[2]} y2={p.la[3]} />
      <line x1={p.ra[0]} y1={p.ra[1]} x2={p.ra[2]} y2={p.ra[3]} />
      <line x1={p.ll[0]} y1={p.ll[1]} x2={p.ll[2]} y2={p.ll[3]} />
      <line x1={p.rl[0]} y1={p.rl[1]} x2={p.rl[2]} y2={p.rl[3]} />
    </svg>
  );
}
