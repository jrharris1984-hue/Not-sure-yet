import { buildPrompts, buildMultiVenicePrompts, buildChromaPrompts, buildMultiChromaPrompts } from "@/lib/dna";
import { buildPonyPrompts, buildMultiPonyPrompts } from "@/lib/ponyPrompts";
import { buildPromptPriorityPlan, emptyPromptPriorityPlan, prioritizePrompt, requirementPresent } from "@/lib/promptPriority";

const ZIMAGE_NEGATIVE = [
  "low quality, blurry, out of focus, jpeg artifacts, oversharpened",
  "bad anatomy, deformed body, extra limbs, missing limbs, disconnected limbs",
  "split torso, disconnected pelvis, twisted joints, impossible pose",
  "duplicated anatomy, duplicated genitals, multiple openings, misplaced anatomy",
  "malformed hands, extra fingers, fused fingers",
  "malformed feet, extra feet, missing feet, extra toes, missing toes, fused toes",
  "finger-like toes, hand-like feet, oversized toe pads, cropped feet",
  "extreme fisheye distortion, impossible perspective, body filling entire frame",
  "asymmetric face, crossed eyes, plastic skin, waxy skin",
  "duplicate person, unintended person, text, watermark, logo",
  "underage, child, teen, minor",
].join(", ");

const WAN_NEGATIVE = [
  "flicker, jitter, temporal inconsistency, frame warping",
  "identity drift, face drift, body morphing, anatomy distortion",
  "extra limbs, duplicate person, sudden scene change",
  "unrequested wardrobe change, camera teleport, frozen motion",
  "text, watermark, logo, low quality",
].join(", ");

const clean = (value) => String(value || "").replace(/\s+/g, " ").trim();

const compactWords = (value, limit) => {
  const words = clean(value).split(" ").filter(Boolean);
  return words.length <= limit ? words.join(" ") : words.slice(0, limit).join(" ");
};

const dedupeClauses = (value) => {
  const seen = new Set();
  return clean(value).split(/,\s*/).filter((part) => {
    const key = part.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  }).join(", ");
};

const basePrompts = ({ dna, subjects, isMulti, raunch }) => (
  isMulti ? buildMultiVenicePrompts(subjects || [], { raunch }) : buildPrompts(dna || {}, { raunch })
);

const lower = (value) => clean(value).toLowerCase();
const arrayValue = (value) => Array.isArray(value) ? value.filter(Boolean) : (value ? [value] : []);

const ZIMAGE_SIZE_REWRITES = [
  [/extremely voluptuous body, abundant curves, thick and luscious/gi, "voluptuous curvy body"],
  [/huge enormous ass, gigantic buttocks, PAWG rear/gi, "dramatically full rounded buttocks"],
  [/very large jiggly ass, massive round butt/gi, "very full rounded buttocks"],
  [/hyper-sized cartoonishly enormous ass, impossibly huge butt, extreme bubble/gi, "extremely full rounded buttocks"],
  [/flat chest, small AA cup, boyish chest/gi, "very small flat chest"],
  [/small athletic firm breasts, muscled chest/gi, "small athletic breasts"],
  [/hyper-inflated impossibly huge breasts, cartoonishly enormous tits, gravity-defying/gi, "very large breasts with believable weight and attachment"],
  [/enormous H-cup\+ tits, gigantic breasts, dramatic overflowing cleavage/gi, "very large breasts with believable weight"],
  [/huge massive G-cup breasts, enormous cleavage, spilling out, gravity-affected/gi, "large breasts with realistic gravity"],
  [/detailed anatomy with natural proportions, anatomically correct body, realistic weight distribution, natural breast shape with realistic gravity, detailed vulva, visible labia, realistic skin flush, natural moisture/gi,
    "coherent human anatomy, realistic proportions, natural weight distribution, realistic joints and limb connections"],
];

function normalizeZImageLanguage(value) {
  return ZIMAGE_SIZE_REWRITES.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), value);
}

export function resolveZImageComposition(dna = {}, options = {}) {
  const resolved = JSON.parse(JSON.stringify(dna || {}));
  resolved.pose = { ...(resolved.pose || {}) };
  resolved.feet = { ...(resolved.feet || {}) };
  resolved.hair = { ...(resolved.hair || {}) };
  resolved.physique = { ...(resolved.physique || {}) };
  resolved.style = { ...(resolved.style || {}) };

  const mode = ["natural", "enhanced", "extreme"].includes(lower(resolved.style.anatomy_mode))
    ? lower(resolved.style.anatomy_mode)
    : "natural";
  const adjustments = [];
  const hands = arrayValue(resolved.pose.hands).filter((item) => lower(item) !== "none");
  if (hands.length > 1) {
    const kept = hands[hands.length - 1];
    resolved.pose.hands = [kept];
    adjustments.push(`Kept “${kept}” as the single hand action.`);
  }

  const hairStyle = lower(resolved.hair.style);
  if (["updo", "ponytail"].includes(hairStyle) && resolved.hair.length) {
    resolved.hair.length = "";
    adjustments.push("Removed the competing loose-hair length from the tied-up hairstyle.");
  }

  // Resolve mutually exclusive descriptors before they reach the prompt. These
  // conflicts are especially destructive in Z-Image because each phrase is
  // individually rendered even when the combined body is impossible.
  const bustSize = lower(resolved.physique.bust);
  if (lower(resolved.physique.bust_shape) === "athletic" && !["", "flat", "small", "medium"].includes(bustSize)) {
    resolved.physique.bust_shape = "natural";
    adjustments.push("Replaced the small athletic bust-shape wording that conflicted with the selected large bust size.");
  }
  if (lower(resolved.hair.length) === "pixie" && ["wavy", "curly"].includes(hairStyle)) {
    resolved.hair.style = "";
    adjustments.push("Kept the pixie cut and removed the competing long wave/curl hairstyle wording.");
  }
  const bodyType = lower(resolved.physique.body_type);
  const buttSize = lower(resolved.physique.butt);
  if (lower(resolved.physique.hips) === "narrow" && (
    ["curvy", "voluptuous", "plus size", "bbw", "pear", "hourglass"].includes(bodyType) ||
    ["large", "very large", "huge", "hyper"].includes(buttSize)
  )) {
    resolved.physique.hips = "average";
    adjustments.push("Replaced narrow hips that conflicted with the selected curvy lower-body proportions.");
  }

  const action = lower(resolved.pose.action);
  const complexLegsUp = ["lying legs up", "on back legs up"].includes(action);
  if (mode !== "extreme" && complexLegsUp) {
    if (["close-up", "portrait", "waist-up", "detail shot"].includes(lower(resolved.pose.distance))) {
      resolved.pose.distance = "full body";
      adjustments.push("Changed the tight crop to full-body framing so the raised-leg pose can fit in one coherent frame.");
    }
    if (["over-shoulder", "pov", "back"].includes(lower(resolved.pose.angle))) {
      resolved.pose.angle = "3/4";
      adjustments.push("Changed the conflicting rear/POV angle to a three-quarter view for the raised-leg pose.");
    }
    if (arrayValue(resolved.pose.hands).some((item) => ["touching body", "between legs", "gripping something"].includes(lower(item)))) {
      resolved.pose.hands = ["at sides"];
      adjustments.push("Simplified the hand placement to prevent an orphan or duplicated arm in the raised-leg pose.");
    }
  }

  const focus = lower(resolved.pose.focus) || "full frame";
  const distance = lower(resolved.pose.distance);
  const fullBody = ["full body", "wide shot"].includes(distance);

  if (options.forceMulti && mode !== "extreme" && fullBody && focus !== "feet"
      && ["from below", "pov"].includes(lower(resolved.pose.angle))) {
    resolved.pose.angle = "3/4";
    adjustments.push("Replaced the extreme low/POV angle with a three-quarter view so multiple full bodies remain separate and proportionate.");
  }

  const feetFraming = lower(resolved.feet.framing);
  const feetCloseup = ["feet close-up", "sole close-up", "pov under foot", "low angle sole"].includes(feetFraming);
  const feetRequested = !!(
    resolved.feet.sole_presentation || feetFraming || resolved.feet.arch ||
    resolved.feet.pedicure || resolved.feet.foot_size ||
    arrayValue(resolved.feet.toes).length || arrayValue(resolved.feet.foot_act).length
  );
  const selectedPedicure = lower(resolved.feet.pedicure);
  let supportingFeet = "";

  if (mode !== "extreme" && fullBody && lower(resolved.pose.angle) === "pov") {
    resolved.pose.angle = "3/4";
    adjustments.push("Replaced first-person POV with a moderate three-quarter angle for coherent full-body anatomy.");
  }

  if (mode === "natural") {
    resolved.physique.exaggeration = Math.min(35, Number(resolved.physique.exaggeration || 0));
    if (["hyper", "enormous", "huge"].includes(lower(resolved.physique.bust))) {
      resolved.physique.bust = "large";
      adjustments.push("Clamped the bust to a believable large proportion in Natural mode.");
    }
    if (["hyper", "huge"].includes(lower(resolved.physique.butt))) {
      resolved.physique.butt = "large";
      adjustments.push("Clamped the rear proportion to a believable large size in Natural mode.");
    }
    if (lower(resolved.physique.thighs) === "massive") resolved.physique.thighs = "thick";
    if (lower(resolved.physique.hips) === "extreme") resolved.physique.hips = "wide";

    if (focus !== "feet" && feetRequested) {
      supportingFeet = options.forceMulti
        ? ""
        : selectedPedicure && selectedPedicure !== "natural nails"
          ? `both naturally proportioned feet visible with ${selectedPedicure.replace(/^painted\s+(.+)$/i, "$1-painted")} toenails`
          : "both naturally proportioned feet visible";
      resolved.feet = {};
      adjustments.push(options.forceMulti
        ? "Removed secondary feet requirements from the multi-subject composition so limb count and body separation stay higher priority."
        : "Removed the competing PRIMARY FEET block because feet are not the composition priority.");
    } else if (focus === "feet" && lower(resolved.feet.foot_size) === "size queen") {
      resolved.feet.foot_size = "large";
      adjustments.push("Reduced extreme foot enlargement to a realistic large size in Natural mode.");
    }
  } else if (mode === "enhanced") {
    resolved.physique.exaggeration = Math.min(70, Number(resolved.physique.exaggeration || 0));
    if (lower(resolved.physique.bust) === "hyper") resolved.physique.bust = "huge";
    if (lower(resolved.physique.butt) === "hyper") resolved.physique.butt = "huge";
    if (focus !== "feet" && feetCloseup) {
      resolved.feet.framing = "full body";
      adjustments.push("Downgraded the competing foot close-up while preserving enhanced foot details.");
    }
  }

  if (fullBody && feetCloseup && focus !== "feet" && resolved.feet.framing) {
    resolved.feet.framing = "full body";
    adjustments.push("Changed the feet close-up to full-body foot visibility.");
  }

  const castSize = lower(resolved.scenario?.cast_size) || "solo";
  const solo = !options.forceMulti && !["duo", "threesome", "foursome", "group", "gangbang", "orgy"].includes(castSize);
  const humanLead = options.forceMulti
    ? (mode === "natural"
      ? "NORMAL HUMAN ANATOMY REQUIRED — each adult has one coherent torso and pelvis, exactly two arms and two legs, naturally sized hands and feet"
      : mode === "enhanced"
        ? "COHERENT HUMAN ANATOMY REQUIRED — each adult keeps one coherent torso and pelvis, exactly two arms and two legs"
        : "COHERENT ANATOMY REQUIRED — each adult remains one connected body with no duplicated body parts")
    : (mode === "natural"
      ? "NORMAL HUMAN ANATOMY REQUIRED — believable adult proportions, one coherent torso and pelvis, exactly two arms and two legs, naturally sized hands and feet"
      : mode === "enhanced"
        ? "COHERENT HUMAN ANATOMY REQUIRED — enhanced proportions with one coherent torso and pelvis, exactly two arms and two legs"
        : "COHERENT ANATOMY REQUIRED — one connected adult body with no duplicated body parts");

  let composition = "";
  if (focus === "feet") {
    composition = fullBody
      ? "PRIMARY COMPOSITION — full character visible head to feet, both complete feet visible at realistic perspective, feet prominent without filling the frame"
      : "PRIMARY COMPOSITION — feet are the single visual priority, both complete feet and ankles visible with coherent scale and perspective";
  } else if (["butt", "hips"].includes(focus) && feetRequested && fullBody) {
    composition = "PRIMARY COMPOSITION — rear three-quarter full-body view, face and complete body visible, lower body prominent without filling the frame";
  } else if (["butt", "hips"].includes(focus)) {
    composition = "PRIMARY COMPOSITION — rear three-quarter view, lower body is the single visual priority, moderate perspective and connected limbs";
  } else if (focus === "face") {
    composition = "PRIMARY COMPOSITION — face is the single visual priority, coherent body perspective and no body part enlarged toward the lens";
  } else {
    composition = "PRIMARY COMPOSITION — balanced full-character framing, coherent perspective, no competing body-part close-up";
  }

  const multiBodyGuard = options.forceMulti
    ? "MULTI-SUBJECT ANATOMY — each adult is a separate complete person with one head, one torso and pelvis, two arms and two legs; keep visible separation between torsos and pelvises; no merged bodies, shared limbs, stacked torsos or duplicated anatomy"
    : "";

  const lead = [
    humanLead,
    solo && "exactly one adult person in the image, no background people or partial extra bodies",
    multiBodyGuard,
    composition,
    supportingFeet,
  ].filter(Boolean).join(", ");

  return { dna: resolved, composition: lead, adjustments, anatomyMode: mode };
}


const kreaValue = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean).join(", ");
  const text = clean(value);
  return ["", "none", "default", "off"].includes(text.toLowerCase()) ? "" : text;
};

const kreaList = (...values) => values
  .flatMap((value) => Array.isArray(value) ? value : [value])
  .map(kreaValue)
  .filter(Boolean);

const kreaSentence = (lead, parts) => {
  const body = kreaList(parts).join(", ");
  return body ? `${lead}${body}.` : "";
};

function kreaGenderLabel(value) {
  const gender = lower(value);
  if (gender === "male") return "man";
  if (gender === "non-binary") return "non-binary adult";
  if (gender === "androgynous") return "androgynous adult";
  return "woman";
}

function kreaSubjectSentence(dna = {}, label = "") {
  const id = dna.identity || {};
  const ph = dna.physique || {};
  const face = dna.face || {};
  const hair = dna.hair || {};
  const skin = dna.skin || {};
  const age = Number(id.age || 0);
  const person = kreaGenderLabel(id.gender);
  const head = age ? `${age}-year-old adult ${person}` : `adult ${person}`;
  const body = kreaList(
    id.ethnicity,
    ph.height && ph.height !== "average" ? `${ph.height} height` : "",
    ph.body_type && `${ph.body_type} body type`,
    Number(ph.muscularity || 0) > 60 ? (Number(ph.muscularity) > 85 ? "highly muscular build" : "athletic toned build") : "",
    Number(ph.curves || 0) > 60 ? (Number(ph.curves) > 85 ? "pronounced natural curves" : "curved silhouette") : "",
    ph.bust && `${ph.bust} bust`,
    ph.bust_shape && `${ph.bust_shape} breast shape`,
    ph.waist && `${ph.waist} waist`,
    ph.hips && `${ph.hips} hips`,
    ph.butt && `${ph.butt} buttocks`,
    ph.thighs && `${ph.thighs} thighs`,
    ph.legs && ph.legs !== "average" ? `${ph.legs} legs` : "",
    ph.proportions
  );
  const faceHair = kreaList(
    face.eye_shape && `${face.eye_shape} eyes`,
    face.eye_color && `${face.eye_color} eye color`,
    face.jawline && `${face.jawline} jawline`,
    face.nose && `${face.nose} nose`,
    face.lips && `${face.lips} lips`,
    face.expression && `${face.expression} expression`,
    hair.color && `${hair.color} hair`,
    hair.length && `${hair.length} hair length`,
    hair.style && `${hair.style} hairstyle`,
    hair.texture && `${hair.texture} hair texture`,
    hair.bangs && hair.bangs !== "none" ? `${hair.bangs} bangs` : "",
    skin.tone && `${skin.tone} skin`,
    skin.texture && `${skin.texture} skin texture`,
    skin.freckles && skin.freckles !== "none" ? `${skin.freckles} freckles` : "",
    skin.tattoos
  );
  const prefix = label ? `Subject ${label}: ` : "";
  return `${prefix}${[head, ...body, ...faceHair].filter(Boolean).join(", ")}.`;
}

function kreaWardrobeSentence(dna = {}, label = "") {
  const w = dna.wardrobe || {};
  const prefix = label ? `Subject ${label} wardrobe: ` : "Wardrobe: ";
  const nudity = Number(w.nudity_level || 0);
  const nudityDirection = nudity >= 80 ? "fully nude, no clothing"
    : nudity >= 55 ? "partially nude with exposed skin"
      : nudity >= 30 ? "revealing clothing with some skin visible"
        : nudity > 0 ? "clothed with a modestly suggestive look" : "";
  // A high nudity setting is an explicit wardrobe choice. Do not repeat a
  // contradictory outfit or garment from the saved character DNA.
  const suppressClothing = nudity >= 55;
  return kreaSentence(prefix, [
    nudityDirection,
    suppressClothing ? "" : w.outfit_preset,
    !suppressClothing && w.top && w.top !== "none" ? w.top : "",
    !suppressClothing && w.bottom && w.bottom !== "none" ? w.bottom : "",
    !suppressClothing && w.underwear && w.underwear !== "none" ? w.underwear : "",
    suppressClothing ? "" : w.footwear,
    suppressClothing ? "" : w.accessories,
    suppressClothing ? "" : w.material,
    suppressClothing ? "" : w.palette,
    suppressClothing ? "" : w.fit,
    suppressClothing ? "" : w.state,
  ]);
}

function kreaPoseSentence(dna = {}, label = "") {
  const p = dna.pose || {};
  const feet = dna.feet || {};
  const prefix = label ? `Subject ${label} pose and framing: ` : "Pose and framing: ";
  const feetPriority = lower(p.focus) === "feet" || kreaValue(feet.framing);
  return kreaSentence(prefix, [
    p.action,
    p.body_language && `${p.body_language} body language`,
    p.angle && `${p.angle} view`,
    p.focus && `${p.focus} composition priority`,
    p.hands?.length ? `hands ${p.hands.join(" and ")}` : "",
    feetPriority ? feet.framing : "",
    feetPriority ? feet.sole_presentation : "",
    feetPriority && feet.pedicure ? `${feet.pedicure} pedicure` : "",
  ]);
}

function kreaFramingSentence(dna = {}) {
  const framing = lower(dna.pose?.distance) || "full body";
  const directions = {
    "full body": "Full-length photograph: show the entire subject from the top of the head to the soles of the feet, with space around the body in the frame.",
    "wide shot": "Wide environmental photograph: show the entire subject from head to feet with the setting clearly visible around them.",
    portrait: "Head-and-shoulders portrait: frame the face and shoulders; the rest of the body may be outside the image.",
    "waist-up": "Waist-up photograph: show the head, torso and arms down to the waist.",
    "close-up": "Close-up photograph: focus on the face and nearby details; the body may be outside the image.",
    "detail shot": "Tight detail photograph: frame the selected detail rather than the whole body.",
  };
  return directions[framing] || directions["full body"];
}

function kreaAdultDetailSentence(dna = {}, label = "") {
  const intimate = dna.intimate || {};
  const scenario = dna.scenario || {};
  const kink = dna.kink || {};
  const ws = dna.watersports || {};
  const prefix = label ? `Subject ${label} adult scene details: ` : "Adult scene details: ";
  return kreaSentence(prefix, [
    scenario.roleplay,
    scenario.acts,
    scenario.extra_acts,
    intimate.pubic_hair,
    intimate.pussy,
    intimate.clit,
    intimate.asshole,
    intimate.nipples,
    intimate.areolas,
    intimate.piercings && intimate.piercings !== "none" ? intimate.piercings : "",
    intimate.cum_state,
    intimate.saliva,
    intimate.squirt && intimate.squirt !== "none" ? intimate.squirt : "",
    intimate.lactation && intimate.lactation !== "none" ? intimate.lactation : "",
    intimate.sweat && intimate.sweat !== "none" ? intimate.sweat : "",
    intimate.lube && intimate.lube !== "none" ? intimate.lube : "",
    intimate.tears && intimate.tears !== "none" ? intimate.tears : "",
    kink.restraint,
    kink.gag,
    kink.marks,
    kink.sensation,
    kink.humiliation,
    kink.orgasm_control,
    kink.power_dynamic && kink.power_dynamic !== "none" ? kink.power_dynamic : "",
    kink.group_kink,
    ws.source && ws.source !== "none" ? `${ws.source} watersports source` : "",
    ws.direction,
    ws.stream,
    ws.container,
    ws.wetness,
    ws.desperation && ws.desperation !== "none" ? ws.desperation : "",
    ws.aftermath,
  ]);
}

function kreaSharedShotSentences(dna = {}) {
  const scene = dna.scene || {};
  const lighting = dna.lighting || {};
  const camera = dna.camera || {};
  const style = dna.style || {};
  const render = lower(style.render);
  const imageLead = render.includes("analog") || render.includes("35mm")
    ? "Photorealistic analog editorial photograph."
    : render === "cinematic"
      ? "Photorealistic cinematic still with editorial realism."
      : render === "documentary"
        ? "Photorealistic documentary-style photograph."
        : "Photorealistic editorial photograph.";

  const sceneSentence = kreaSentence("The setting is ", [
    scene.environment,
    scene.background,
    scene.indoor_outdoor,
    scene.era,
    scene.props,
  ]);
  const lightSentence = kreaSentence("Lighting uses ", [
    lighting.source,
    lighting.direction && `${lighting.direction} direction`,
    lighting.color_temp && `${lighting.color_temp} color temperature`,
    lighting.style,
    lighting.mood,
  ]);
  const cameraSentence = kreaSentence("The camera uses ", [
    camera.lens && `${camera.lens} lens`,
    camera.aperture,
    camera.angle && `${camera.angle} angle`,
    camera.aspect_ratio && `${camera.aspect_ratio} aspect ratio`,
  ]);
  const styleSentence = kreaSentence("The overall finish is ", [
    style.artistic_tone,
    style.film_grain && style.film_grain !== "none" ? `${style.film_grain} film grain` : "",
    style.extra,
  ]);
  return [imageLead, sceneSentence, lightSentence, cameraSentence, styleSentence].filter(Boolean);
}

export function buildKrea2Prompts({
  dna = {},
  subjects = [],
  isMulti = false,
  priorityPlan = emptyPromptPriorityPlan(),
} = {}) {
  const activeSubjects = isMulti && Array.isArray(subjects) && subjects.length
    ? subjects
    : [{ label: "", dna }];
  const primary = activeSubjects[0]?.dna || dna || {};
  const subjectCount = activeSubjects.length;
  const anatomyMode = lower(primary.style?.anatomy_mode) || "natural";
  const compositionLead = subjectCount > 1
    ? `Compose exactly ${subjectCount} adult subjects as separate complete people. Keep each face, torso, pelvis, arms and legs visually distinct with no shared limbs or merged bodies.`
    : "Compose exactly one complete adult subject with coherent body geometry and natural camera perspective.";

  const subjectBlocks = activeSubjects.flatMap((subject, index) => {
    const subjectDna = subject?.dna || {};
    const label = subjectCount > 1 ? (subject?.label || String.fromCharCode(65 + index)) : "";
    return [
      kreaSubjectSentence(subjectDna, label),
      kreaPoseSentence(subjectDna, label),
      kreaWardrobeSentence(subjectDna, label),
      kreaAdultDetailSentence(subjectDna, label),
    ].filter(Boolean);
  });

  const realismTail = anatomyMode === "extreme"
    ? "Keep the requested stylization while preserving one connected body per person, readable joints, coherent hands and feet, realistic skin detail and consistent perspective."
    : anatomyMode === "enhanced"
      ? "Preserve enhanced proportions with coherent anatomy, connected limbs, realistic hands and feet, natural skin detail and consistent perspective."
      : "Use believable adult proportions, coherent anatomy, realistic hands and feet, natural skin texture, crisp facial detail and consistent perspective.";

  const sharedShot = kreaSharedShotSentences(primary);
  const [imageLead, ...shotDetails] = sharedShot;
  let positive = [
    ...subjectBlocks,
    kreaFramingSentence(primary),
    compositionLead,
    ...shotDetails,
    imageLead,
    realismTail,
  ].filter(Boolean).join(" ");

  // Krea 2's Qwen3-VL encoder responds well to concise natural language. Keep
  // must-match settings literal without turning the whole prompt into tag soup.
  const missingMust = (priorityPlan.mustMatch || [])
    .filter((item) => !requirementPresent(positive, item))
    .map((item) => item.phrase);
  if (missingMust.length) {
    positive += ` Required details: ${missingMust.join(", ")}.`;
  }
  positive = clean(positive);

  const allDroppable = [...(priorityPlan.important || []), ...(priorityPlan.detail || [])];
  const droppedClauses = allDroppable
    .filter((item) => !requirementPresent(positive, item))
    .map((item) => ({
      key: item.key,
      label: item.label,
      value: item.value,
      priority: item.priority,
    }));

  return {
    positive,
    negative: "",
    droppedClauses,
    promptBudget: 300,
    promptWords: positive.split(/\s+/).filter(Boolean).length,
    omittedClauseCount: droppedClauses.length,
    profile: "krea2-photo-directed-v1",
  };
}

export function resolvePromptCompiler({ promptStyle = "", workflowKind = "", workflowName = "" } = {}) {
  const style = clean(promptStyle).toLowerCase();
  const kind = clean(workflowKind).toLowerCase();
  const name = clean(workflowName).toLowerCase();
  if (kind === "edit" || kind === "enhance" || style === "qwen_edit" || name.includes("qwen")) return "qwen_edit";
  if (kind === "video" || style === "wan_i2v") return "wan_i2v";
  if (kind === "text_video" || style === "wan_t2v") return "wan_t2v";
  if (style === "pony" || kind === "pony" || name.includes("pony")) return "pony";
  if (style === "chroma" || name.includes("chroma")) return "chroma";
  if (style === "krea2" || name.includes("krea 2") || name.includes("krea2")) return "krea2";
  if (style === "zimage" || name.includes("z-image") || name.includes("z image")) return "zimage";
  return "standard";
}

export function buildZImagePrompts({
  dna = {},
  subjects = [],
  isMulti = false,
  raunch = false,
  fieldLocks = {},
  sectionLocks = {},
  priorityPlan,
} = {}) {
  const primaryGuard = resolveZImageComposition(dna, { forceMulti: isMulti });
  const guardedSubjects = isMulti
    ? (subjects || []).map((subject) => ({ ...subject, dna: resolveZImageComposition(subject?.dna || {}, { forceMulti: true }).dna }))
    : subjects;
  const base = basePrompts({
    dna: primaryGuard.dna,
    subjects: guardedSubjects,
    isMulti,
    raunch,
  });
  const plan = priorityPlan || buildPromptPriorityPlan({
    dna: primaryGuard.dna,
    subjects: guardedSubjects,
    isMulti,
    raunch,
    fieldLocks,
    sectionLocks,
  });
  const prioritized = prioritizePrompt(
    normalizeZImageLanguage(base.positive),
    plan,
    "zimage",
    {
      extraLead: [primaryGuard.composition],
      budgetWords: primaryGuard.anatomyMode === "natural" ? 220 : primaryGuard.anatomyMode === "enhanced" ? 260 : 300,
      preserveOrder: isMulti,
    }
  );
  return {
    ...prioritized,
    negative: ZIMAGE_NEGATIVE,
    guardAdjustments: primaryGuard.adjustments,
    priorityPlan: plan,
    negativeStrategy: "zeroed",
  };
}

export function buildQwenEditPrompts({ instruction = "", preserveUnmentioned = true } = {}) {
  const request = clean(instruction);
  if (!request) return { positive: "", negative: "" };
  return {
    positive: [
      `Change only the following: ${request}.`,
      preserveUnmentioned ? "Preserve the subject's identity, age, body proportions, pose, clothing, composition, lighting, background, and every detail not explicitly requested." : "",
      "Keep one connected human body. Do not add, remove, duplicate, enlarge, or relocate limbs, hands, feet, fingers, toes, torso, pelvis, or facial features unless the request explicitly requires it.",
      "Make the edit seamless, photorealistic, and consistent with the source image.",
    ].filter(Boolean).join(" "),
    negative: "unrequested changes, identity drift, face replacement, body redesign, wardrobe change, background change, duplicated anatomy, edit seams, artifacts",
  };
}

export function buildWanImageToVideoPrompts({ instruction = "" } = {}) {
  const motion = clean(instruction);
  if (!motion) return { positive: "", negative: WAN_NEGATIVE };
  return {
    positive: compactWords([
      "Animate the supplied starting image as one continuous shot.", motion,
      "Preserve the existing adult subject, identity, anatomy, clothing, environment, lighting, and composition.",
      "Use coherent natural motion with stable hands, feet, face, hair, and fabric from first frame to last. Keep the same number of people and the same connected limbs in every frame; no body growth, duplication, melting, or sudden scale changes.",
    ].join(" "), 180),
    negative: WAN_NEGATIVE,
  };
}

export function buildWanTextToVideoPrompts({ dna = {}, subjects = [], isMulti = false, raunch = false, instruction = "" } = {}) {
  const primaryGuard = resolveZImageComposition(dna, { forceMulti: isMulti });
  const guardedSubjects = isMulti
    ? (subjects || []).map((subject) => ({ ...subject, dna: resolveZImageComposition(subject?.dna || {}, { forceMulti: true }).dna }))
    : subjects;
  const base = basePrompts({ dna: primaryGuard.dna, subjects: guardedSubjects, isMulti, raunch });
  const motion = clean(instruction);
  return {
    positive: [
      primaryGuard.composition,
      "Single continuous cinematic shot.",
      base.positive,
      motion && `Action over time: ${motion}.`,
      "Maintain consistent identity, anatomy, clothing, environment, and lighting across every frame. Use physically coherent body, hair, fabric, and camera motion.",
    ].filter(Boolean).join(", "),
    negative: WAN_NEGATIVE,
    guardAdjustments: primaryGuard.adjustments,
  };
}

export function compileModelPrompts({
  promptStyle = "",
  workflowKind = "",
  workflowName = "",
  dna = {},
  subjects = [],
  isMulti = false,
  raunch = false,
  editInstruction = "",
  videoInstruction = "",
  preserveUnmentioned = true,
  fieldLocks = {},
  sectionLocks = {},
} = {}) {
  const compiler = resolvePromptCompiler({ promptStyle, workflowKind, workflowName });
  const primaryGuard = resolveZImageComposition(dna, { forceMulti: isMulti });
  const guardedSubjects = isMulti
    ? (subjects || []).map((subject) => ({ ...subject, dna: resolveZImageComposition(subject?.dna || {}, { forceMulti: true }).dna }))
    : subjects;
  const priorityPlan = buildPromptPriorityPlan({
    dna: primaryGuard.dna,
    subjects: guardedSubjects,
    isMulti,
    raunch,
    fieldLocks,
    sectionLocks,
  });

  const attachDirectMeta = (prompts, negativeStrategy = "text") => ({
    ...prompts,
    priorityPlan: emptyPromptPriorityPlan(),
    droppedClauses: [],
    promptBudget: null,
    promptWords: clean(prompts.positive).split(/\s+/).filter(Boolean).length,
    omittedClauseCount: 0,
    guardAdjustments: [],
    negativeStrategy,
  });

  const withPriorityGuard = (prompts, family) => {
    const prioritized = prioritizePrompt(
      prompts.positive,
      priorityPlan,
      family,
      { extraLead: [primaryGuard.composition], preserveOrder: isMulti }
    );
    return {
      ...prompts,
      ...prioritized,
      priorityPlan,
      guardAdjustments: primaryGuard.adjustments,
      negativeStrategy: "text",
    };
  };

  if (compiler === "pony") return withPriorityGuard(
    isMulti ? buildMultiPonyPrompts(guardedSubjects, { raunch }) : buildPonyPrompts(primaryGuard.dna, { raunch }),
    "pony"
  );
  if (compiler === "chroma" && isMulti) {
    const prompts = buildMultiChromaPrompts(guardedSubjects, { raunch });
    return {
      ...prompts,
      priorityPlan,
      droppedClauses: [],
      promptBudget: 345,
      promptWords: clean(prompts.positive).split(/\s+/).filter(Boolean).length,
      omittedClauseCount: 0,
      guardAdjustments: primaryGuard.adjustments,
      negativeStrategy: "text",
    };
  }
  if (compiler === "chroma") return withPriorityGuard(
    buildChromaPrompts(primaryGuard.dna, { raunch }),
    "chroma"
  );
  if (compiler === "krea2") {
    const prompts = buildKrea2Prompts({
      dna: primaryGuard.dna,
      subjects: guardedSubjects,
      isMulti,
      priorityPlan,
    });
    return {
      ...prompts,
      priorityPlan,
      guardAdjustments: primaryGuard.adjustments,
      negativeStrategy: "zeroed",
    };
  }
  if (compiler === "zimage") return buildZImagePrompts({
    dna,
    subjects,
    isMulti,
    raunch,
    fieldLocks,
    sectionLocks,
    priorityPlan,
  });
  if (compiler === "qwen_edit") return attachDirectMeta(
    buildQwenEditPrompts({ instruction: editInstruction, preserveUnmentioned })
  );
  if (compiler === "wan_i2v") return attachDirectMeta(
    buildWanImageToVideoPrompts({ instruction: videoInstruction })
  );
  if (compiler === "wan_t2v") {
    const prompts = buildWanTextToVideoPrompts({ dna, subjects, isMulti, raunch, instruction: videoInstruction });
    const prioritized = prioritizePrompt(prompts.positive, priorityPlan, "wan_t2v", { preserveOrder: isMulti });
    return {
      ...prompts,
      ...prioritized,
      priorityPlan,
      negativeStrategy: "text",
    };
  }
  return withPriorityGuard(
    basePrompts({ dna: primaryGuard.dna, subjects: guardedSubjects, isMulti, raunch }),
    "standard"
  );
}
