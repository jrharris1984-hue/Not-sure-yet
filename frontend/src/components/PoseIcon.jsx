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

const FOOT_GUIDES = new Set([
  "soles up", "soles together", "sole showcase", "sole toward camera", "one sole raised",
  "wrinkled soles", "smooth soles", "oiled soles", "dirty soles", "muddy soles", "freshly washed",
]);

function FootShape({ x = 0, y = 0, scale = 1, rotate = 0, stroke, detail = "" }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate} 12 21) scale(${scale})`}>
      <path d="M12 42C5.5 42 3 35.5 4.5 29c1-4.5 3.4-7.5 4-12C9.2 11 8.5 5 12 3c3.8 2 3 8 3.8 14 0.6 4.8 3 7.8 4 12 1.6 6.5-1 13-7.8 13Z" fill="currentColor" fillOpacity=".08" stroke={stroke} strokeWidth="1.4" />
      {[7.8, 10, 12.2, 14.4, 16.3].map((cx, index) => (
        <circle key={cx} cx={cx} cy={3.3 - Math.abs(2 - index) * .35} r={index === 2 ? 1.9 : 1.45} fill="currentColor" fillOpacity=".12" stroke={stroke} strokeWidth="1" />
      ))}
      <path d="M8 31c2.5 1.6 5.5 1.6 8 0" stroke={stroke} strokeWidth="1" fill="none" opacity=".65" />
      {detail === "wrinkled soles" && <><path d="M7 23c3 2 7 2 10 0M7.5 27c2.5 1.6 6.5 1.6 9 0M8 35c2.5 1 5.5 1 8 0" stroke={stroke} strokeWidth=".8" opacity=".75" /></>}
      {detail === "oiled soles" && <><path d="M8 13c-1 6-1 10 0 14M11 9c-1 5-1 8 0 11" stroke={stroke} strokeWidth="1.2" opacity=".85" /><circle cx="8" cy="34" r="1" fill={stroke} /></>}
      {(detail === "dirty soles" || detail === "muddy soles") && <>{[9,14,7,16,11].map((cx, i) => <circle key={`${cx}-${i}`} cx={cx} cy={17 + i * 4} r={detail === "muddy soles" ? 1.7 : .8} fill={stroke} opacity=".55" />)}</>}
      {detail === "freshly washed" && <><path d="M18 15c2 2 2 4 0 5-2-1-2-3 0-5ZM6 22c1.5 1.5 1.5 3 0 4-1.5-1-1.5-2.5 0-4Z" fill="none" stroke={stroke} strokeWidth=".9" /></>}
      {detail === "smooth soles" && <path d="M8 20c2-2 6-2 8 0" stroke={stroke} strokeWidth=".8" opacity=".35" />}
    </g>
  );
}

function FootGuideIcon({ name, size, active }) {
  const stroke = active ? "#FDE68A" : "#A1A1AA";
  const common = { stroke, detail: name };
  return (
    <svg width={size} height={size} viewBox="0 0 64 48" fill="none" className={active ? "text-amber-200" : "text-zinc-400"} aria-hidden="true">
      {name === "soles up" && <><FootShape x={8} y={1} scale={1} {...common} /><FootShape x={32} y={1} scale={1} {...common} /></>}
      {name === "soles together" && <><FootShape x={13} y={3} scale={.92} rotate={8} {...common} /><FootShape x={30} y={3} scale={.92} rotate={-8} {...common} /></>}
      {name === "sole showcase" && <FootShape x={20} y={1} scale={1.08} rotate={-8} {...common} />}
      {name === "sole toward camera" && <FootShape x={18} y={-1} scale={1.18} {...common} />}
      {name === "one sole raised" && <><FootShape x={12} y={9} scale={.78} rotate={-12} {...common} /><FootShape x={31} y={0} scale={1.05} rotate={6} {...common} /></>}
      {!name.startsWith("sole") && !name.startsWith("one sole") && <FootShape x={20} y={1} scale={1.08} {...common} />}
    </svg>
  );
}

export default function PoseIcon({ name, size = 40, active = false }) {
  if (FOOT_GUIDES.has(name)) return <FootGuideIcon name={name} size={size} active={active} />;
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
