// Pony V6 XL prompt builder — uses Pony's score_9 quality prefix and booru-style tag weighting.
// Pony expects: score_9, score_8_up, score_7_up, rating_explicit, source_photo (or source_anime), then tag list.
import { expandPrompt } from "@/lib/promptMap";

// Booru-style tag weighting: wrap phrase in (x:1.3) format
const w = (phrase, weight) => phrase && weight && weight !== 1 ? `(${phrase}:${weight})` : phrase;

export function buildPonyPrompts(dna = {}) {
  const val = (section, field) => dna?.[section]?.[field] || "";
  const exp = (section, field) => {
    const v = val(section, field);
    return v ? expandPrompt(section, field, v) : "";
  };
  const join = (parts, sep = ", ") => parts.filter((p) => p && String(p).trim()).map(String).join(sep);

  // -------- Pony quality prefix (MANDATORY) --------
  const qualityPrefix = "score_9, score_8_up, score_7_up, score_6_up, rating_explicit, source_photo, photorealistic, RAW professional photograph, 8k, highly detailed";

  // Rating tag adjusts with intensity
  const sc = dna.scenario || {};
  const intensity = Number(sc.intensity || 0);
  const ratingTag = intensity >= 65 ? "rating_explicit, explicit content, uncensored"
                  : intensity >= 40 ? "rating_explicit, nsfw"
                  : intensity >= 20 ? "rating_questionable" : "rating_safe";

  // -------- Subject --------
  const id = dna.identity || {};
  const ph = dna.physique || {};
  const face = dna.face || {};
  const hair = dna.hair || {};
  const skin = dna.skin || {};
  const im = dna.intimate || {};

  const ex = Number(ph.exaggeration || 0);
  const eWeight = ex >= 85 ? 1.5 : ex >= 65 ? 1.3 : ex >= 40 ? 1.15 : 1;

  const ageStr = id.age ? `${id.age} years old, mature adult woman, unmistakably adult` : "adult woman";
  const ethn = exp("identity", "ethnicity") || "woman";

  const subject = join([
    id.name && w(`portrait of ${id.name}`, 1.2),
    "1girl, solo",
    ageStr,
    ethn,
    exp("skin", "tone"),
    exp("skin", "texture"),
    "realistic natural skin texture, visible pores, subtle skin imperfections",
    exp("physique", "body_type"),
    ph.muscularity > 85 ? "muscular female, defined muscles" : ph.muscularity > 60 ? "athletic body, fit" : "",
    ph.curves > 60 ? w("curvy figure", 1.1 + (ph.curves - 60) / 100) : "",
    w(exp("physique", "bust") || (ph.bust && `${ph.bust} breasts`), eWeight),
    exp("physique", "bust_shape"),
    w(exp("physique", "butt") || (ph.butt && `${ph.butt} ass`), eWeight),
    w(exp("physique", "thighs") || (ph.thighs && `${ph.thighs} thighs`), eWeight),
    w(exp("physique", "hips") || (ph.hips && `${ph.hips} hips`), eWeight),
    exp("physique", "waist"),
    ph.legs && ph.legs !== "average" && exp("physique", "legs"),
    ex >= 75 && w("exaggerated body proportions, extreme hourglass silhouette", 1.4),
  ]);

  // -------- Face --------
  const faceStr = join([
    exp("face", "eye_shape"),
    exp("face", "eye_color"),
    exp("face", "jawline"),
    face.nose && `${face.nose} nose`,
    exp("face", "lips"),
    exp("face", "expression"),
    "detailed eyes, realistic pupils, natural catchlights, individually defined eyelashes",
  ]);

  // -------- Hair --------
  const hairStr = join([
    hair.length && exp("hair", "length"),
    hair.style && exp("hair", "style"),
    hair.color && exp("hair", "color"),
    hair.bangs && hair.bangs !== "none" && `${hair.bangs} bangs`,
  ]);

  // -------- Wardrobe --------
  const wd = dna.wardrobe || {};
  const outfitPieces = [];
  if (wd.outfit_preset) outfitPieces.push(exp("wardrobe", "outfit_preset"));
  if (wd.top && wd.top !== "none") outfitPieces.push(exp("wardrobe", "top"));
  if (wd.bottom && wd.bottom !== "none") outfitPieces.push(exp("wardrobe", "bottom"));
  if (wd.underwear && wd.underwear !== "none") outfitPieces.push(exp("wardrobe", "underwear"));
  if (wd.footwear && wd.footwear !== "barefoot") outfitPieces.push(exp("wardrobe", "footwear"));
  if (wd.accessories && wd.accessories !== "none") outfitPieces.push(exp("wardrobe", "accessories"));
  const outfitStr = join([
    outfitPieces.length ? `wearing ${outfitPieces.join(", ")}` : "",
    exp("wardrobe", "material"),
    wd.fit && `${wd.fit} fit`,
    wd.state && wd.state !== "fully clothed" && w(exp("wardrobe", "state"), 1.2),
  ]);

  // -------- Pose --------
  const pose = dna.pose || {};
  const poseStr = join([
    w(exp("pose", "action"), 1.15),
    exp("pose", "angle"),
    exp("pose", "distance"),
    pose.focus && pose.focus !== "full frame" && exp("pose", "focus"),
    pose.hands && exp("pose", "hands"),
    exp("pose", "body_language"),
  ]);

  // -------- Explicit (intimate + scenario) --------
  const intimateStr = join([
    w(exp("intimate", "pubic_hair"), im.pubic_hair && im.pubic_hair.includes("hair") ? 1.2 : 1),
    w(exp("intimate", "pussy"), 1.2),
    im.clit && im.clit !== "hidden" && exp("intimate", "clit"),
    im.asshole && im.asshole !== "hidden" && exp("intimate", "asshole"),
    w(exp("intimate", "nipples"), 1.1),
    exp("intimate", "areolas"),
    im.body_hair && im.body_hair !== "hairless" && exp("intimate", "body_hair"),
    im.piercings && im.piercings !== "none" && exp("intimate", "piercings"),
  ]);

  const scenarioStr = join([
    sc.cast_size && sc.cast_size !== "solo" && exp("scenario", "cast_size"),
    sc.cast_type && sc.cast_type !== "none" && exp("scenario", "cast_type"),
    sc.roleplay && sc.roleplay !== "none" && exp("scenario", "roleplay"),
    Array.isArray(sc.acts)
      ? sc.acts.filter((a) => a && a !== "none").map((a) => w(expandPrompt("scenario", "acts", a), 1.3)).join(", ")
      : (sc.acts && sc.acts !== "none" && w(exp("scenario", "acts"), 1.3)),
    sc.extra_acts,
  ]);

  // -------- Scene / Lighting / Camera --------
  const scene = dna.scene || {};
  const sceneStr = join([
    scene.environment && `in a ${exp("scene", "environment")}`,
    scene.background,
    scene.props,
  ]);
  const lg = dna.lighting || {};
  const lightingStr = join([
    lg.source && exp("lighting", "source"),
    exp("lighting", "style"),
    exp("lighting", "mood"),
  ]);
  const cam = dna.camera || {};
  const camStr = join([
    cam.lens && `shot on ${exp("camera", "lens")}`,
    exp("camera", "aperture"),
  ]);

  // -------- Anatomy accuracy (Pony-specific) --------
  const anatomyStr = "anatomically correct, realistic proportions, natural weight distribution, detailed anatomy";

  // Style
  const st = dna.style || {};
  const styleStr = join([
    st.render && exp("style", "render"),
    st.artistic_tone && exp("style", "artistic_tone"),
    st.extra,
  ]);

  // Assemble in Pony order
  const positive = join([
    qualityPrefix,
    ratingTag,
    subject,
    faceStr,
    hairStr,
    outfitStr,
    poseStr,
    intimateStr,
    scenarioStr,
    sceneStr,
    lightingStr,
    camStr,
    styleStr,
    anatomyStr,
  ]);

  // Pony negative uses low-score tags + safety
  const negative = [
    "score_6, score_5, score_4, score_3, score_2, score_1",
    "worst quality, low quality, jpeg artifacts, compression artifacts, blurry, noisy, oversharpened",
    "anime, manga, cartoon, comic, illustration, drawing, sketch, painting, 3d render, CGI, doll, mannequin",
    "plastic skin, waxy skin, airbrushed, overly smooth skin, beauty filter",
    "child, teenager, young-looking, minor, underage, loli, shota",
    "bad anatomy, malformed anatomy, deformed, disfigured, extra limbs, missing limbs, extra fingers, missing fingers, fused fingers, mutated hands",
    "unnatural breasts, malformed breasts, asymmetrical breasts, bolted-on breasts",
    "text, watermark, signature, logo, censored, mosaic, black bar",
  ].join(", ");

  return { positive, negative };
}
