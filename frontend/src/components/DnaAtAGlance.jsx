import { User, Palette, Camera, Flame } from "lucide-react";

// Compact chip strip summarising the character in one glance. Groups by phase color.
export default function DnaAtAGlance({ dna, name }) {
  const id = dna?.identity || {};
  const ph = dna?.physique || {};
  const face = dna?.face || {};
  const hair = dna?.hair || {};
  const wd = dna?.wardrobe || {};
  const pose = dna?.pose || {};
  const scene = dna?.scene || {};
  const sc = dna?.scenario || {};
  const kk = dna?.kink || {};
  const ws = dna?.watersports || {};
  const ft = dna?.feet || {};
  const im = dna?.intimate || {};

  const body = [
    id.age && `${id.age}yo`,
    id.ethnicity,
    id.archetype && id.archetype !== "girl next door" && id.archetype,
    ph.body_type,
    ph.bust && `${ph.bust} bust`,
    ph.butt && ph.butt !== "average" && `${ph.butt} ass`,
    hair.color && hair.length && `${hair.color} ${hair.length} hair`,
    face.eye_color && face.eye_color !== "brown" && `${face.eye_color} eyes`,
  ].filter(Boolean);

  const intimate = [
    im.pubic_hair && `pubes: ${im.pubic_hair}`,
    im.pussy && im.pussy !== "closed" && `pussy: ${im.pussy}`,
    im.piercings && im.piercings !== "none" && `pierced: ${im.piercings}`,
    Array.isArray(im.cum_state) && im.cum_state.length && `${im.cum_state.length}× cum`,
    im.squirt && im.squirt !== "none" && im.squirt,
    im.lactation && im.lactation !== "none" && im.lactation,
    im.tears && im.tears !== "none" && im.tears,
    (ft.sole_presentation || ft.foot_act?.length) && "feet focus",
    ft.hosiery && ft.hosiery !== "bare" && ft.hosiery,
  ].filter(Boolean);

  const style = [
    wd.outfit_preset,
    wd.state && wd.state !== "fully clothed" && wd.state,
    pose.action,
    pose.angle && pose.angle !== "eye level" && pose.angle,
    scene.environment,
    dna?.lighting?.mood,
    dna?.camera?.lens && `${dna.camera.lens}`,
  ].filter(Boolean);

  const play = [
    sc.roleplay && sc.roleplay !== "none" && sc.roleplay,
    Array.isArray(sc.acts) && sc.acts.length && sc.acts.slice(0, 3).join(" · "),
    Number(sc.explicit_level) > 0 && `explicit ${sc.explicit_level}%`,
    Number(sc.kink_level) > 0 && `kink ${sc.kink_level}%`,
    Array.isArray(kk.restraint) && kk.restraint.length && kk.restraint[0],
    Array.isArray(kk.gag) && kk.gag.length && kk.gag[0],
    ws.source && ws.source !== "none" && "watersports",
  ].filter(Boolean);

  const total = body.length + intimate.length + style.length + play.length;
  if (total === 0) {
    return (
      <div className="pane p-3 flex items-center gap-3" data-testid="dna-at-a-glance">
        <div className="h-9 w-9 rounded-full grid place-items-center bg-amber-500/10 text-amber-400">
          <User className="h-4 w-4" />
        </div>
        <div className="text-sm text-zinc-400">
          <span className="font-display font-bold text-zinc-200">{name || "Untitled"}</span>
          <span className="ml-2 text-zinc-500">— a blank canvas. Randomize or pick a preset to get going.</span>
        </div>
      </div>
    );
  }

  const strip = ({ items, phase, Icon }) => {
    if (!items.length) return null;
    return (
      <div className="flex items-start gap-1.5" data-testid={`dna-glance-${phase}`}>
        <Icon className={`h-3.5 w-3.5 mt-1.5 shrink-0 phase-${phase} text-${phase === "body" ? "amber" : phase === "intimate" ? "rose" : phase === "style" ? "sky" : "fuchsia"}-400`} />
        <div className="flex flex-wrap gap-1">
          {items.map((it, i) => (
            <span key={`${phase}-${i}`} className={`chip chip-${phase} !py-0.5 !px-2 !text-[11px] !min-h-0 !cursor-default`}>{String(it)}</span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="pane p-3 space-y-2" data-testid="dna-at-a-glance">
      <div className="flex items-baseline gap-2">
        <span className="font-display font-bold text-zinc-100 truncate">{name || "Untitled"}</span>
        <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">at a glance · {total} traits</span>
      </div>
      {strip({ items: body, phase: "body", Icon: User })}
      {strip({ items: intimate, phase: "intimate", Icon: Flame })}
      {strip({ items: style, phase: "style", Icon: Camera })}
      {strip({ items: play, phase: "play", Icon: Palette })}
    </div>
  );
}
