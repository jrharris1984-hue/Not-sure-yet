import CameraOrbit3 from "@/components/CameraOrbit3";
import React from "react";
import { updateShot, reorderShot, duplicateShot, activeShots } from "@/lib/shotPlan3";
import Studio3SavedLooks from "@/components/Studio3SavedLooks";
import { PHOTOGRAPHY_POSE_GROUPS } from "@/lib/photographyPoses";
import { EXPOSURE_CHOICES } from "@/lib/wardrobeNudity";
import { ADULT_EDITORIAL_POSES } from "@/lib/adultEditorialPlan";
import { SECTIONS } from "@/lib/dna";

export const STUDIO3_VIEWS = ["front", "back", "rear left three-quarter", "rear right three-quarter", "left profile", "right profile", "back from below", "back from above", "front left three-quarter", "front right three-quarter"];
export const STUDIO3_CAMERAS = ["eye-level", "low", "high", "rear low upward", "rear high downward", "side profile low upward", "side profile high downward"];
export const STUDIO3_POSES = [...new Set(["standing", "standing hip out", "standing hands on hips", "walking", "sitting on edge", "leaning wall", "over shoulder look", "lying side", "kneeling upright", ...PHOTOGRAPHY_POSE_GROUPS.flatMap(group => group.options), ...ADULT_EDITORIAL_POSES])];
export const STUDIO3_LENSES = ["24mm", "35mm", "50mm", "85mm", "135mm", "macro"];
export const STUDIO3_EXPRESSIONS = SECTIONS.find(section => section.key === "face")?.fields.find(field => field.key === "expression")?.options || [];
export const STUDIO3_FRAMINGS = ["close-up", "portrait", "waist-up", "thigh-up", "knees-up", "full body", "wide shot", "detail shot"];
export const STUDIO3_HOSIERY = ["bare", "sheer stockings", "toeless stockings", "footed stockings", "pantyhose", "fishnet stockings", "knee-high socks", "thigh-high socks"];
export const STUDIO3_SKIN_FINISH = ["natural matte", "soft lotion sheen", "light massage oil sheen", "glossy body oil finish"];
export const STUDIO3_FOOT_POSES = ["feet side by side", "ankles crossed", "one foot lifted", "toes pointed", "heels together", "arches visible in profile", "one heel resting on a low riser", "pedicure detail with relaxed toes"];

const Select = ({ label, value, options, onChange }) => <label className="block text-xs text-zinc-300">{label}<select value={value || ""} onChange={event => onChange(event.target.value || null)} className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 p-2 text-sm text-white"><option value="">Use character / template</option>{options.map(option => <option key={option} value={option}>{option}</option>)}</select></label>;

export default function ShotStoryboard3({ plan, onChange, outfitOptions = [] }) {
  const adultPlan = plan.planType === "adult-editorial";
  const buckets = plan.shots.reduce((result, shot, index) => {
    const key = adultPlan ? shot.chapter || "Unassigned" : "All shots";
    result[key] ||= [];
    result[key].push({ shot, index });
    return result;
  }, {});
  const groups = Object.entries(buckets);
  const renderShot = ({ shot, index }) => <article key={shot.id} className={`rounded-xl border p-3 ${shot.enabled ? "border-zinc-700" : "border-zinc-800 opacity-60"}`}>
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0"><label className="flex items-start gap-2 text-sm font-semibold"><input className="mt-1" type="checkbox" checked={shot.enabled} onChange={event => onChange(updateShot(plan, shot.id, { enabled: event.target.checked }))} />{shot.label}</label>
        {shot.coverage && <span className="ml-6 mt-1 inline-flex rounded-full border border-fuchsia-400/20 bg-fuchsia-400/5 px-2 py-1 text-[10px] text-fuchsia-100">{shot.coverage}</span>}
      </div>
      <div className="flex shrink-0 gap-1"><button type="button" className="chip" disabled={index === 0} onClick={() => onChange(reorderShot(plan, index, index - 1))} aria-label={`Move ${shot.label} earlier`}>↑</button><button type="button" className="chip" disabled={index === plan.shots.length - 1} onClick={() => onChange(reorderShot(plan, index, index + 1))} aria-label={`Move ${shot.label} later`}>↓</button><button type="button" className="chip" disabled={plan.shots.length >= 120} onClick={() => onChange(duplicateShot(plan, shot.id))}>Copy</button></div>
    </div>
    <details className="mt-2 rounded-lg border border-zinc-800 p-2"><summary className="cursor-pointer text-xs font-medium text-cyan-200">Edit shot · {shot.subjectView || "view"} · {shot.lens || "lens"}</summary>
      <details className="mt-2 rounded-lg border border-zinc-700 p-2"><summary className="cursor-pointer text-sm font-medium text-amber-200">Visual Camera Director</summary><div className="mt-2"><CameraOrbit3 subjectView={shot.subjectView} cameraAngle={shot.cameraAngle} onChange={changes => onChange(updateShot(plan, shot.id, changes))} /></div></details>
      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Select label="Subject view" value={shot.subjectView} options={STUDIO3_VIEWS} onChange={subjectView => onChange(updateShot(plan, shot.id, { subjectView }))} />
        <Select label="Camera height / tilt" value={shot.cameraAngle} options={STUDIO3_CAMERAS} onChange={cameraAngle => onChange(updateShot(plan, shot.id, { cameraAngle }))} />
        <Select label="Pose" value={shot.pose} options={STUDIO3_POSES} onChange={pose => onChange(updateShot(plan, shot.id, { pose }))} />
        <Select label="Expression" value={shot.expression} options={STUDIO3_EXPRESSIONS} onChange={expression => onChange(updateShot(plan, shot.id, { expression }))} />
        <Select label="Framing" value={shot.framing} options={STUDIO3_FRAMINGS} onChange={framing => onChange(updateShot(plan, shot.id, { framing }))} />
        <Select label="Lens" value={shot.lens} options={STUDIO3_LENSES} onChange={lens => onChange(updateShot(plan, shot.id, { lens }))} />
        <Select label="Coverage" value={shot.coverage} options={EXPOSURE_CHOICES} onChange={coverage => onChange(updateShot(plan, shot.id, { coverage }))} />
        <label className="block text-xs text-zinc-300">Outfit / look<input list={`shot-outfit-options-${shot.id}`} value={shot.outfit || ""} onChange={event => onChange(updateShot(plan, shot.id, { outfit: event.target.value || null }))} className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 p-2 text-sm text-white" placeholder="Describe the clothing layers for this chapter" /><datalist id={`shot-outfit-options-${shot.id}`}>{outfitOptions.map(option => <option key={option} value={option} />)}</datalist></label>
        {shot.feet && <>
          <Select label="Hosiery" value={shot.feet.hosiery} options={STUDIO3_HOSIERY} onChange={hosiery => onChange(updateShot(plan, shot.id, { feet: { hosiery } }))} />
          <Select label="Foot skin finish" value={shot.feet.skin_finish} options={STUDIO3_SKIN_FINISH} onChange={skin_finish => onChange(updateShot(plan, shot.id, { feet: { skin_finish } }))} />
          <Select label="Foot pose" value={shot.feet.foot_pose} options={STUDIO3_FOOT_POSES} onChange={foot_pose => onChange(updateShot(plan, shot.id, { feet: { foot_pose } }))} />
        </>}
      </div>
      <label className="mt-2 block text-xs text-zinc-300">Wardrobe action<textarea rows={2} className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 p-2 text-sm" value={shot.wardrobeAction || ""} onChange={event => onChange(updateShot(plan, shot.id, { wardrobeAction: event.target.value }))} placeholder="Describe the next clothing change or editorial hold" /></label>
      <details className="mt-2 text-sm"><summary className="cursor-pointer text-zinc-300">Scene & lighting</summary><div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2"><label className="text-xs">Environment / backdrop<input className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 p-2" value={shot.scene.environment || ""} onChange={event => onChange(updateShot(plan, shot.id, { scene: { environment: event.target.value } }))} /></label><label className="text-xs">Lighting style<input className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 p-2" value={shot.lighting.style || ""} onChange={event => onChange(updateShot(plan, shot.id, { lighting: { style: event.target.value } }))} /></label></div></details>
    </details>
  </article>;

  return <section className="pane space-y-3 p-4" data-testid="studio3-storyboard">
    <div><h2 className="text-lg font-bold">3.0 Shot Storyboard</h2><p className="text-sm text-zinc-400">Edit individual shots. Disabled shots will not be queued. Preview cards describe the plan, not rendered images.</p>{adultPlan && <p className="mt-2 rounded-lg border border-fuchsia-400/20 bg-fuchsia-400/5 p-2 text-xs text-fuchsia-100">Adult editorial sequence: coverage and wardrobe direction progress through eight stages into a non-explicit fine-art finish. Poses, views, lens, backdrop, lighting and clothing action can be edited per frame. Chapters keep plans up to 120 shots manageable.</p>}</div>
    <Studio3SavedLooks plan={plan} onApply={onChange} />
    <div className="text-xs text-amber-200">{activeShots(plan).length} enabled of {plan.shots.length} shots</div>
    <div className="space-y-3" data-testid="studio3-shot-chapters">{groups.map(([chapter, shots], groupIndex) => {
      const coverage = [...new Set(shots.map(item => item.shot.coverage).filter(Boolean))];
      const first = shots[0]?.index + 1;
      const last = shots.at(-1)?.index + 1;
      return <details key={chapter} open={!adultPlan || groupIndex === 0} className="rounded-xl border border-zinc-700 bg-black/10 p-3">
        <summary className="cursor-pointer font-semibold text-sm text-amber-100">{chapter} · {shots.length} shots · {first}–{last}{coverage.length ? ` · ${coverage[0]} → ${coverage.at(-1)}` : ""}</summary>
        <div className="mt-3 grid grid-cols-1 gap-2 xl:grid-cols-2">{shots.map(renderShot)}</div>
      </details>;
    })}</div>
  </section>;
}
