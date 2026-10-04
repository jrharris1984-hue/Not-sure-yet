// Local mannequin body previews and existing foot-shape guides.
import React from "react";
import MannequinPose from "@/components/MannequinPose";
export { MANNEQUIN_POSE_NAMES as POSE_NAMES } from "@/lib/mannequinPoses";

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
  return <MannequinPose name={name} size={size} active={active} />;
}
