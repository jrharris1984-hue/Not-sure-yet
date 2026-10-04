import { useId } from "react";
import { mannequinPose } from "@/lib/mannequinPoses";

export default function MannequinPose({ name, size = 56, active = false }) {
  const pose = mannequinPose(name);
  const id = `mannequin-${useId().replace(/:/g, "")}`;
  const edge = active ? "#67e8f9" : "#a8b5c8";
  const fill = active ? "#a5f3fc" : "#d3dbe7";
  const project = ([x, y, z = 0]) => [8 + x * 2.3 + z * .7, 6 + y * 2.3 - z * .4];
  const points = (list) => list.map((point) => project(point).join(",")).join(" ");
  const joint = (point, key, radius = 1.5) => {
    const [cx, cy] = project(point);
    return <circle key={key} cx={cx} cy={cy} r={radius} fill="#101720" stroke={edge} strokeWidth=".8" />;
  };
  const limb = (list, key, far = false) => <g key={key} opacity={far ? .5 : 1}>
    <polyline points={points(list)} stroke={edge} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    <polyline points={points(list)} stroke={`url(#${id})`} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    {list.map((point, index) => joint(point, `${key}-${index}`))}
  </g>;
  const [hx, hy] = project(pose.head);
  const [sl, sr, hr, hl] = pose.torso.map(project);
  return <svg width={size} height={size} viewBox="0 0 72 72" fill="none" aria-hidden="true"
    data-pose-preview={name} data-pose-fallback={pose.fallback || undefined} className="pose-mannequin">
    <title>{pose.fallback ? "Neutral mannequin preview" : `${name} · mannequin pose guide`}</title>
    <defs><linearGradient id={id} x1="0" x2="1"><stop stopColor={edge} /><stop offset=".45" stopColor={fill} /><stop offset="1" stopColor="#435568" /></linearGradient></defs>
    <ellipse cx="36" cy="65" rx="20" ry="2.2" fill={edge} opacity=".1" />
    {pose.support && <polyline points={points(pose.support)} stroke={edge} strokeWidth="1" opacity=".25" />}
    {limb(pose.leftLeg, "far-leg", true)}{limb(pose.leftArm, "far-arm", true)}
    <polygon points={points(pose.torso)} fill={`url(#${id})`} fillOpacity=".35" stroke={edge} strokeWidth="1" strokeLinejoin="round" />
    <path d={`M${(sl[0]+sr[0])/2},${(sl[1]+sr[1])/2} L${(hl[0]+hr[0])/2},${(hl[1]+hr[1])/2}`} stroke={edge} strokeWidth=".65" opacity=".6" />
    {[.35, .65].map((t) => <path key={t} d={`M${sl[0]+(hl[0]-sl[0])*t},${sl[1]+(hl[1]-sl[1])*t} L${sr[0]+(hr[0]-sr[0])*t},${sr[1]+(hr[1]-sr[1])*t}`} stroke={edge} strokeWidth=".65" opacity=".5" />)}
    {joint(pose.neck, "neck", 1.7)}
    {limb(pose.rightLeg, "near-leg")}{limb(pose.rightArm, "near-arm")}
    <ellipse cx={hx} cy={hy} rx={pose.profile ? 3.4 : 4.2} ry="5" fill={`url(#${id})`} stroke={edge} strokeWidth=".8" />
    <path d={`M${hx},${hy-4} v8 M${hx-3},${hy} h6`} stroke="#435568" strokeWidth=".6" opacity=".7" />
  </svg>;
}
