// Pony V6 XL prompt builder — uses Pony's score_9 quality prefix and booru-style tag weighting.
// Pony expects: score_9, score_8_up, score_7_up, rating_explicit, source_photo (or source_anime), then tag list.
import { expandPrompt } from "@/lib/promptMap";

// Booru-style tag weighting: wrap phrase in (x:1.3) format
const w = (phrase, weight) => phrase && weight && weight !== 1 ? `(${phrase}:${weight})` : phrase;

// Canonical booru tag mapping for specific DNA values. Anything not mapped falls back to
// the natural-language expansion (which Pony still understands, just less precisely).
const PONY_TAGS = {
  intimate: {
    lactation: {
      "lactating": "lactation, breast_milk",
      "milk drip": "lactation, milk_drip",
      "milk spray": "lactation, milk_spray, spraying_milk",
      "breastfeeding": "breastfeeding, nursing",
      "cow-milked": "cow_print, being_milked, breast_milking",
    },
    squirt: {
      "gushing squirt": "female_ejaculation, squirting",
      "arcing stream": "female_ejaculation, squirting_arc",
      "mid-squirt": "female_ejaculation, squirting",
      "squirting on face": "female_ejaculation, squirt_on_face",
    },
    tears: {
      "mascara tears": "crying, mascara_tears, running_mascara",
      "ugly cry": "crying, ugly_cry",
      "single tear": "single_tear",
      "tear-streaked face": "crying_with_eyes_open, tear_streaked",
    },
    cum_state: {
      "fresh creampie": "creampie, cum_in_pussy",
      "dripping creampie": "cum_drip, creampie, cum_in_pussy",
      "gaping creampie": "gaping, creampie, cum_pool, cum_drip",
      "anal creampie": "anal_creampie, cum_in_ass",
      "cum on face": "cum_on_face, facial",
      "cum on tits": "cum_on_breasts",
      "cum on ass": "cum_on_ass",
      "cum in mouth open display": "cum_in_mouth, tongue_out, cum_pool",
      "cum-covered whole body": "covered_in_cum, cum_everywhere",
    },
  },
  feet: {
    foot_act: {
      "footjob": "footjob, feet_focus",
      "double footjob": "double_footjob",
      "foot worship": "foot_worship, foot_focus",
      "sole licking": "sole_lick, foot_worship, tongue_out",
      "toe sucking": "toe_sucking, foot_worship",
      "foot on face": "foot_on_face, femdom, foot_worship",
      "foot smothering": "foot_smother, femdom",
      "trampling": "trampling, foot_focus",
      "cum on feet": "cum_on_feet, foot_focus",
      "cum on soles": "cum_on_soles, foot_focus",
    },
    sole_presentation: {
      "soles up": "soles, feet_up, foot_focus",
      "sole showcase": "sole_focus, foot_focus",
      "oiled soles": "oiled_soles, wet_feet, foot_focus",
      "dirty soles": "dirty_feet, foot_focus",
      "wrinkled soles": "wrinkled_soles, foot_focus",
    },
  },
  kink: {
    restraint: {
      "rope shibari": "shibari, bondage, rope",
      "hemp bondage": "bondage, rope",
      "leather cuffs": "cuffs, bondage",
      "metal handcuffs": "handcuffs, bondage",
      "spreader bar": "spreader_bar, bondage",
      "hogtie": "hogtie, bondage",
      "suspension": "suspension_bondage, rope, bondage",
      "wrists overhead": "arms_up, bondage, bound_wrists",
      "collar and leash": "collar, leash, pet_play",
      "chastity cage": "chastity, chastity_cage",
      "chastity belt": "chastity_belt",
    },
    gag: {
      "ball gag": "ball_gag, gagged, drool",
      "ring gag": "ring_gag, gagged, tongue_out",
      "tape gag": "tape_gag, gagged",
      "panty gag": "panty_gag, gagged",
      "muzzle": "muzzle, gagged",
    },
    marks: {
      "spanking": "spanking, ass_focus",
      "red handprint": "handprint, red_ass, spanking",
      "welts": "welts, marks",
      "bruises": "bruise",
      "rope marks": "rope_marks",
      "bite marks": "bite_mark",
      "hickeys": "hickey",
    },
    humiliation: {
      "ahegao expression": "ahegao, tongue_out, rolling_eyes",
      "mind-break": "mind_break, ahegao",
      "drooling": "drooling, saliva",
      "puppy hood": "puppy_ears, pet_play",
      "kitten ears and tail plug": "cat_ears, cat_tail, buttplug",
      "collared pet": "collar, pet_play",
      "leash walk": "leash, pet_play, being_led",
      "mascara tears": "crying, mascara_tears",
    },
    orgasm_control: {
      "edged": "edging, denied_orgasm",
      "forced orgasm": "forced_orgasm",
      "overstimulation": "overstimulation, post_orgasm",
      "hitachi torture": "hitachi_magic_wand, forced_orgasm",
    },
    group_kink: {
      "gangbang": "gangbang",
      "double penetration": "double_penetration, dp",
      "triple penetration": "triple_penetration, tp",
      "air-tight": "airtight, triple_penetration",
      "bukkake": "bukkake, cum_on_face",
      "spitroast": "spitroast, double_blowjob",
    },
  },
  watersports: {
    source: {
      "self": "peeing, urine, self_peeing",
      "partner": "peeing_on_another, urine, watersports",
      "mutual": "mutual_peeing, urine, watersports",
      "group": "group_peeing, urine, watersports",
    },
    direction: {
      "in mouth": "peeing_in_mouth, urine, watersports",
      "on face": "peeing_on_face, urine, watersports",
      "on tits": "peeing_on_breasts, urine",
      "held in": "omorashi, holding_pee, desperation",
      "forced held-in": "omorashi, desperation, forced_holding",
    },
    stream: {
      "trickle": "peeing, urine, small_stream",
      "steady stream": "peeing, urine_stream",
      "gush": "gushing_urine, watersports",
      "arc": "arcing_urine, peeing, watersports",
      "pooling": "pool_of_urine, watersports",
    },
    container: {
      "toilet": "toilet, peeing",
      "shower": "shower, peeing, watersports",
      "in panties": "wet_panties, peeing_in_clothes, omorashi",
      "in jeans": "wet_jeans, peeing_in_clothes, omorashi",
      "public": "public_urination, watersports",
    },
    wetness: {
      "soaked panties": "wet_panties, wet_clothes",
      "puddle at feet": "pool_of_urine, wet_floor",
      "running down legs": "urine_dripping, wet_legs",
    },
    desperation: {
      "needy": "omorashi, holding_pee",
      "holding it": "omorashi, holding_pee, desperation",
      "about to burst": "omorashi, desperate, holding_pee",
      "losing control": "omorashi, losing_control, peeing",
      "humiliated": "humiliation, omorashi, tears",
    },
  },
};

const tag = (section, field, value) => {
  if (!value) return "";
  return PONY_TAGS?.[section]?.[field]?.[value] || value;
};
const tagArr = (section, field, arr) => {
  if (!Array.isArray(arr)) return "";
  return arr.filter(Boolean).map((v) => tag(section, field, v)).join(", ");
};

export function buildPonyPrompts(dna = {}, opts = {}) {
  const shared = _ponySharedBlock(dna, opts, 1);
  const subject = _ponySubjectBlock(dna, opts);
  const positive = _join([
    shared.qualityPrefix,
    shared.ratingTag,
    shared.countTag,
    shared.pairingTag,
    subject.subject,
    subject.face,
    subject.hair,
    subject.outfit,
    subject.pose,
    subject.feet,
    subject.intimate,
    subject.fluids,
    subject.kink,
    subject.watersports,
    shared.scenario,
    shared.scene,
    shared.lighting,
    shared.camera,
    shared.style,
    shared.anatomy,
  ]);
  const negative = _ponyNegative(shared.multiSubject);
  return { positive, negative };
}

// Multi-subject Pony builder. Shared shot context comes from primary; per-subject
// clauses are concatenated with subject markers.
export function buildMultiPonyPrompts(subjects = [], opts = {}) {
  if (!Array.isArray(subjects) || subjects.length === 0) return buildPonyPrompts({}, opts);
  if (subjects.length === 1) return buildPonyPrompts(subjects[0].dna || {}, opts);
  const primary = subjects[0].dna || {};
  const shared = _ponySharedBlock(primary, opts, subjects.length);
  const clauses = subjects.map((s) => {
    const clause = _ponySubjectBlock(s.dna || {}, opts);
    const label = s.label || "A";
    return `[Subject ${label}: ${_join([clause.subject, clause.face, clause.hair, clause.outfit, clause.pose, clause.feet, clause.intimate, clause.fluids, clause.kink, clause.watersports])}]`;
  });
  const positive = _join([
    shared.qualityPrefix,
    shared.ratingTag,
    shared.countTag,
    shared.pairingTag,
    "separated_subjects, all_subjects_visible, distinct_bodies",
    clauses.join(", "),
    shared.scenario,
    shared.scene,
    shared.lighting,
    shared.camera,
    shared.style,
    shared.anatomy,
  ]);
  const negative = _ponyNegative(true);
  return { positive, negative };
}

const _join = (parts, sep = ", ") => parts.filter((p) => p && String(p).trim()).map(String).join(sep);

function _ponySharedBlock(dna = {}, opts = {}, subjectCount = 1) {
  const raunch = !!opts.raunch;
  const exp = (section, field) => {
    const v = dna?.[section]?.[field] || "";
    return v ? expandPrompt(section, field, v, { raunch }) : "";
  };
  const join = _join;
  const qualityPrefix = "score_9, score_8_up, score_7_up, score_6_up, rating_explicit, source_photo, photorealistic, RAW professional photograph, 8k, highly detailed";
  const sc = dna.scenario || {};
  const explicitLevel = Number(sc.explicit_level ?? sc.intensity ?? 0);
  const kinkLevel = Number(sc.kink_level ?? 0);
  const ratingTag = explicitLevel >= 65 ? "rating_explicit, explicit content, uncensored"
                  : explicitLevel >= 40 ? "rating_explicit, nsfw"
                  : explicitLevel >= 20 ? "rating_questionable" : "rating_safe";
  const kinkTag = kinkLevel >= 65 ? w("bdsm, kink, dominance_and_submission", 1.3)
                 : kinkLevel >= 40 ? w("bdsm, light_kink", 1.15)
                 : kinkLevel >= 20 ? "light_kink" : "";

  const castSize = sc.cast_size || "solo";
  const castType = sc.cast_type || "none";
  const isPairing = castType && castType !== "none";
  const effectiveCount = Math.max(subjectCount, 1);
  const countTag = (() => {
    if (effectiveCount >= 6 || castSize === "orgy" || castSize === "gangbang") return "multiple_girls, 6+girls";
    if (effectiveCount >= 5 || castSize === "group") return "multiple_girls, 5girls";
    if (effectiveCount >= 4 || castSize === "foursome") return "4girls";
    if (effectiveCount >= 3 || castSize === "threesome") return "3girls";
    if (effectiveCount >= 2 || castSize === "duo" || (isPairing && castSize === "solo")) return "2girls";
    return "1girl, solo";
  })();
  const pairingTag = (() => {
    if (!isPairing) return "";
    const t = castType;
    if (t === "twins" || t === "identical twins") return w("twins, siblings, matching_faces, identical_twins", 1.3);
    if (t === "sisters") return w("siblings, sisters, family, two_women", 1.25);
    if (t === "best friends" || t === "roommates") return w("two_women, best_friends", 1.15);
    if (t.includes("mother") || t.includes("stepmom") || t.includes("aunt") || t.includes("grandma") || t.includes("granny") || t.includes("mature and young"))
      return w("mother_and_daughter, family, multiple_generations, older_and_younger_woman, age_difference, two_women", 1.35);
    if (t.includes("teacher") || t.includes("boss") || t.includes("nurse") || t.includes("coach"))
      return w("two_women, age_difference", 1.2);
    if (t === "dominant and submissive" || t === "wife and mistress")
      return w("two_women, femdom", 1.2);
    return w("two_women", 1.2);
  })();

  const scenarioStr = join([
    sc.cast_size && sc.cast_size !== "solo" && exp("scenario", "cast_size"),
    sc.cast_type && sc.cast_type !== "none" && exp("scenario", "cast_type"),
    sc.roleplay && sc.roleplay !== "none" && exp("scenario", "roleplay"),
    Array.isArray(sc.acts)
      ? sc.acts.filter((a) => a && a !== "none").map((a) => w(expandPrompt("scenario", "acts", a, { raunch }), 1.3)).join(", ")
      : (sc.acts && sc.acts !== "none" && w(exp("scenario", "acts"), 1.3)),
    sc.extra_acts,
    kinkTag,
  ]);
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
  const st = dna.style || {};
  const styleStr = join([
    st.render && exp("style", "render"),
    st.artistic_tone && exp("style", "artistic_tone"),
    st.extra,
  ]);
  const anatomy = "anatomically correct, realistic proportions, natural weight distribution, detailed anatomy";
  const multiSubject = countTag !== "1girl, solo";
  return {
    qualityPrefix, ratingTag, countTag, pairingTag,
    scenario: scenarioStr, scene: sceneStr, lighting: lightingStr, camera: camStr, style: styleStr,
    anatomy, multiSubject,
  };
}

function _ponySubjectBlock(dna = {}, opts = {}) {
  const raunch = !!opts.raunch;
  const val = (section, field) => dna?.[section]?.[field] || "";
  const exp = (section, field) => {
    const v = val(section, field);
    return v ? expandPrompt(section, field, v, { raunch }) : "";
  };
  const join = _join;

  const id = dna.identity || {};
  const ph = dna.physique || {};
  const face = dna.face || {};
  const hair = dna.hair || {};
  const im = dna.intimate || {};

  const ex = Number(ph.exaggeration || 0);
  const eWeight = ex >= 85 ? 1.5 : ex >= 65 ? 1.3 : ex >= 40 ? 1.15 : 1;
  const ageStr = id.age ? `${id.age} years old, mature adult woman, unmistakably adult` : "adult woman";
  const ethn = exp("identity", "ethnicity") || "woman";

  const subject = join([
    id.name && w(`portrait of ${id.name}`, 1.2),
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

  const faceStr = join([
    exp("face", "eye_shape"),
    exp("face", "eye_color"),
    exp("face", "jawline"),
    face.nose && `${face.nose} nose`,
    exp("face", "lips"),
    exp("face", "expression"),
    "detailed eyes, realistic pupils, natural catchlights, individually defined eyelashes",
  ]);
  const hairStr = join([
    hair.length && exp("hair", "length"),
    hair.style && exp("hair", "style"),
    hair.color && exp("hair", "color"),
    hair.bangs && hair.bangs !== "none" && `${hair.bangs} bangs`,
  ]);

  const wd = dna.wardrobe || {};
  const outfitPieces = [];
  if (wd.outfit_preset) outfitPieces.push(exp("wardrobe", "outfit_preset"));
  if (wd.top && wd.top !== "none") outfitPieces.push(exp("wardrobe", "top"));
  if (wd.bottom && wd.bottom !== "none") outfitPieces.push(exp("wardrobe", "bottom"));
  if (wd.underwear && wd.underwear !== "none") outfitPieces.push(exp("wardrobe", "underwear"));
  if (wd.footwear && wd.footwear !== "barefoot") outfitPieces.push(exp("wardrobe", "footwear"));
  if (wd.accessories) {
    const accs = Array.isArray(wd.accessories) ? wd.accessories : [wd.accessories];
    accs.filter((a) => a && a !== "none").forEach((a) => outfitPieces.push(expandPrompt("wardrobe", "accessories", a, { raunch })));
  }
  const outfitStr = join([
    outfitPieces.length ? `wearing ${outfitPieces.join(", ")}` : "",
    exp("wardrobe", "material"),
    wd.fit && `${wd.fit} fit`,
    wd.state && wd.state !== "fully clothed" && w(exp("wardrobe", "state"), 1.2),
  ]);

  const pose = dna.pose || {};
  const poseStr = join([
    w(exp("pose", "action"), 1.15),
    exp("pose", "angle"),
    exp("pose", "distance"),
    pose.focus && pose.focus !== "full frame" && exp("pose", "focus"),
    Array.isArray(pose.hands)
      ? pose.hands.filter(Boolean).map((h) => expandPrompt("pose", "hands", h, { raunch })).join(", ")
      : (pose.hands && exp("pose", "hands")),
    exp("pose", "body_language"),
  ]);

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
  const fluidsStr = join([
    tagArr("intimate", "cum_state", im.cum_state),
    im.squirt && im.squirt !== "none" && tag("intimate", "squirt", im.squirt),
    im.lactation && im.lactation !== "none" && w(tag("intimate", "lactation", im.lactation), 1.2),
    im.tears && im.tears !== "none" && tag("intimate", "tears", im.tears),
    im.saliva && Array.isArray(im.saliva) && im.saliva.length && "saliva, drool",
    im.sweat && im.sweat !== "none" && "sweat, sweaty_body",
    im.lube && im.lube !== "none" && "oiled_body, wet_skin",
  ]);

  const ft = dna.feet || {};
  const feetActive = !!(ft.sole_presentation || (Array.isArray(ft.toes) && ft.toes.length) || ft.arch || ft.pedicure ||
    (Array.isArray(ft.foot_state) && ft.foot_state.length) || ft.hosiery ||
    (Array.isArray(ft.foot_act) && ft.foot_act.length) || ft.framing);
  const feetStr = join([
    tag("feet", "sole_presentation", ft.sole_presentation),
    tagArr("feet", "foot_act", ft.foot_act),
    ft.hosiery && ft.hosiery !== "bare" && exp("feet", "hosiery"),
    (ft.foot_act && ft.foot_act.length) || (ft.sole_presentation) ? w("foot_focus, feet_focus", 1.25) : "",
    feetActive && w("five_toes, toenails, sole, heel, arch, ankle, human_feet, correct_foot_anatomy", 1.3),
  ]);

  const kk = dna.kink || {};
  const kinkStr = join([
    tagArr("kink", "restraint", kk.restraint),
    tagArr("kink", "gag", kk.gag),
    tagArr("kink", "marks", kk.marks),
    tagArr("kink", "humiliation", kk.humiliation),
    tagArr("kink", "orgasm_control", kk.orgasm_control),
    tagArr("kink", "group_kink", kk.group_kink),
    kk.power_dynamic && kk.power_dynamic !== "none" && exp("kink", "power_dynamic"),
  ]);

  const ws = dna.watersports || {};
  const wsHasAny = ws.source && ws.source !== "none";
  const wsStr = wsHasAny ? join([
    w("peeing, urine, watersports", 1.3),
    tag("watersports", "source", ws.source),
    tagArr("watersports", "direction", ws.direction),
    tag("watersports", "stream", ws.stream),
    tag("watersports", "container", ws.container),
    tagArr("watersports", "wetness", ws.wetness),
    tag("watersports", "desperation", ws.desperation),
  ]) : "";

  return {
    subject, face: faceStr, hair: hairStr, outfit: outfitStr, pose: poseStr,
    intimate: intimateStr, fluids: fluidsStr, feet: feetStr, kink: kinkStr, watersports: wsStr,
  };
}

function _ponyNegative(multiSubject) {
  return [
    "score_6, score_5, score_4, score_3, score_2, score_1",
    "worst quality, low quality, jpeg artifacts, compression artifacts, blurry, noisy, oversharpened",
    "anime, manga, cartoon, comic, illustration, drawing, sketch, painting, 3d render, CGI, doll, mannequin",
    "plastic skin, waxy skin, airbrushed, overly smooth skin, beauty filter",
    "child, teenager, young-looking, minor, underage, loli, shota, kid",
    "bad anatomy, malformed anatomy, deformed, disfigured, extra limbs, missing limbs, extra fingers, missing fingers, fused fingers, mutated hands",
    "four_toes, three_toes, six_toes, seven_toes, extra_toes, missing_toes, fused_toes, mutated_feet, deformed_feet, malformed_feet, extra_feet",
    "hands_instead_of_feet, hand_as_foot, fingers_instead_of_toes, finger_toes, knuckles_on_feet, palm_instead_of_sole, fingernails_on_toes, wrist_instead_of_ankle, foot_with_fingers, extra_hand_in_frame, floating_hand",
    "unnatural breasts, malformed breasts, asymmetrical breasts, bolted-on breasts",
    multiSubject && "solo, 1girl, single_subject, cropped_partner, missing_second_person",
    "text, watermark, signature, logo, censored, mosaic, black bar",
  ].filter(Boolean).join(", ");
}

