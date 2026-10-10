import { buildSelectionManifest } from './selectionPromptAudit';
import { heritagePrompt } from "./heritageProfiles";
import { ageAppearancePrompt } from './ageAppearance';
import { buildCompactNarrative } from './compactNarrative';
import { resolveWardrobeMode } from "./wardrobeMode";
import { catalogSections, catalogDna, catalogSelection, customCatalogPrompt, getPromptCatalog, applyCatalogRules } from "./promptCatalog";
import { applyPhotographicGuidance } from "./photographicGuidance";
import { resolveBuilderControls, sliderPromptSignature } from "./builderControlResolution";
import { footVisibility } from './footVisibility';
import { resolvePhysiqueControls, bustShapePrompt, photographicPrompt } from "./physiqueControls";
import { preserveGeneralSelections, subjectPromptText } from "./selectionFidelity";
import { applyCastAppearance, castAppearancePrompt } from "./castAppearance";
import { photographyPosePrompt } from "@/lib/photographyPoses";
import { gluteSizePrompt, gluteShapePrompt } from "@/lib/gluteControls";
import { SECTIONS, buildPrompts, buildMultiVenicePrompts, buildChromaPrompts, buildMultiChromaPrompts, selfStreamContinuityCue } from "@/lib/dna";
import { buildPonyPrompts, buildMultiPonyPrompts } from "@/lib/ponyPrompts";
import { buildPromptPriorityPlan, emptyPromptPriorityPlan, prioritizePrompt, requirementPresent } from "@/lib/promptPriority";
import { implantVisualPrompt } from "@/lib/implantVisualScale";
import { wardrobeNudity, withCoveragePrompt } from "@/lib/wardrobeNudity";

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

const basePrompts = ({ dna, subjects, isMulti, raunch }) => (
  isMulti ? buildMultiVenicePrompts(subjects || [], { raunch }) : buildPrompts(dna || {}, { raunch })
);

const lower = (value) => clean(value).toLowerCase();
const arrayValue = (value) => Array.isArray(value) ? value.filter(Boolean) : (value ? [value] : []);


const chromaProgressiveScale = (value, noun, levels) => {
  const n = Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
  if (!n) return "";
  const step = Math.min(levels.length - 1, Math.max(0, Math.ceil(n / 10) - 1));
  return `${levels[step]} ${noun} (size intensity ${n}/100)`;
};

function hasDetailedBodyScale(dna = {}) {
  const ph = dna.physique || {};
  return ["bust_scale", "butt_scale", "hip_scale", "thigh_scale", "waist_scale"]
    .some((key) => Number(ph[key]) > 0) || Number(ph.implant_volume) > 0;
}

function chromaDnaWithAuthoritativeScales(dna = {}) {
  if (!hasDetailedBodyScale(dna)) return dna;
  const ph = dna.physique || {};
  const physique = {
    ...ph,
    // Imported analyzer prose is useful as a baseline, but once the user
    // moves a detailed physique slider the slider becomes authoritative.
    proportions: "",
  };

  // Chroma gets detailed slider sizes from PRIMARY BODY PROPORTIONS only.
  // Remove the generic DNA compiler's duplicate size wording while preserving
  // independent shape controls such as glute_shape and bust_shape.
  if (Number(ph.bust_scale) > 0 && !(Number(ph.implant_volume) > 0)) {
    physique.bust_scale = 0;
    physique.bust = "";
  }
  if (Number(ph.butt_scale) > 0) {
    physique.butt_scale = 0;
    physique.butt = "";
  }
  if (Number(ph.hip_scale) > 0) {
    physique.hip_scale = 0;
    physique.hips = "";
  }
  if (Number(ph.thigh_scale) > 0) {
    physique.thigh_scale = 0;
    physique.thighs = "";
  }
  if (Number(ph.waist_scale) > 0) {
    physique.waist_scale = 0;
    physique.waist = "";
  }

  return { ...dna, physique };
}

function chromaBodyPriority(dna = {}) {
  const ph = dna.physique || {};
  const clauses = [];
  if (ph.bust_shape && !(Number(ph.implant_volume) > 0)) clauses.push(bustShapePrompt(ph.bust_shape));
  for (const [preset, slider, noun] of [['bust', 'bust_scale', 'bust'], ['butt', 'butt_scale', 'glute volume'], ['hips', 'hip_scale', 'hips'], ['waist', 'waist_scale', 'waist'], ['thighs', 'thigh_scale', 'thighs']]) {
    if (ph[preset] && !(Number(ph[slider]) > 0) && !(preset === 'bust' && Number(ph.implant_volume) > 0)) clauses.push(`${ph[preset]} ${noun}`);
  }
  if (Number(ph.implant_volume) > 0) clauses.push(implantVisualPrompt(ph.implant_volume));

  // Describe actual size at each level. Projection emphasis alone can leave
  // the silhouette unchanged, especially at the top of the slider.
  if (Number(ph.bust_scale) > 0 && !(Number(ph.implant_volume) > 0)) {
    clauses.push(chromaProgressiveScale(ph.bust_scale, "bust", [
      "compact rounded, minimal volume", "compact rounded, light volume", "rounded, modest volume", "rounded, moderate volume", "rounded, noticeable volume",
      "rounded, moderately strong volume", "rounded, strong volume", "rounded, very strong volume", "rounded, pronounced volume", "rounded, maximum volume emphasis",
    ]));
  }
  if (Number(ph.butt_scale) > 0) {
    clauses.push(gluteSizePrompt(ph.butt_scale, { intensity: true }));
    if (Number(ph.butt_scale) >= 90 && !ph.glute_shape) clauses.push("extreme rear and lateral projection, clearly visible lower-body volume connected to one coherent pelvis");
  }
  if (ph.glute_shape) {
    clauses.push(`GLUTE SHAPE: ${gluteShapePrompt(ph.glute_shape)}; make this contour visibly distinct at the selected volume, with one connected pelvis`);
  }
  if (Number(ph.hip_scale) > 0) {
    clauses.push(chromaProgressiveScale(ph.hip_scale, "hips", [
      "very narrow", "narrow", "moderate width", "slightly wide", "wide",
      "very wide", "oversized wide", "dramatically wide", "extremely wide fantasy-scale", "maximum fantasy-scale width",
    ]));
  }
  if (Number(ph.thigh_scale) > 0) {
    clauses.push(chromaProgressiveScale(ph.thigh_scale, "thighs", [
      "very slim", "slim", "moderate thickness", "full", "thick",
      "very thick", "oversized thick", "extremely thick fantasy-scale", "dramatically oversized fantasy-scale", "maximum fantasy-scale thickness",
    ]));
  }
  if (Number(ph.waist_scale) > 0) {
    clauses.push(chromaProgressiveScale(ph.waist_scale, "waist", [
      "defined, minimal width", "defined, light width", "defined, modest width", "defined, moderate width", "defined, noticeable width",
      "defined, moderately strong width", "defined, strong width", "defined, very strong width", "defined, pronounced width", "defined, maximum width emphasis",
    ]));
  }

  if (!clauses.length) return "";
  return `PRIMARY BODY PROPORTIONS — ${clauses.join(", ")}; selected size and shape override conflicting body descriptions; keep one coherent pelvis and preserve the other selected traits`;
}

function normalizeSelectedProportionLanguage(value, dna = {}) {
  if (!hasDetailedBodyScale(dna)) return value;

  return String(value || "")
    .replace(/believable adult proportions/gi, "coherent selected body proportions")
    .replace(/detailed anatomy with natural proportions/gi, "detailed coherent anatomy with the selected body proportions")
    .replace(/anatomically correct body, natural weight distribution/gi, "anatomically coherent body, stable weight distribution")
    .replace(/realistic human anatomy and believable physical detail/gi, "coherent human anatomy and believable physical detail")
    .replace(/realistic proportions/gi, "coherent selected proportions")
    .replace(/natural body proportions/gi, "selected body proportions")
    .replace(/natural breast shape with realistic gravity/gi, "selected breast contour with coherent attachment");
}

function removeChromaReferenceDuplicates(value, dna = {}) {
  let text = String(value || "");
  const hair = dna.hair || {};
  const style = dna.style || {};

  // When the recipe already has explicit hair controls, analyzer/reference Hair:
  // metadata is secondary and can contradict the selected length/style/texture.
  if ([hair.color, hair.length, hair.style, hair.texture, hair.bangs].some(Boolean)) {
    text = text.replace(/(?:^|\n)\s*Hair:\s*[^\n]*/gi, "");
  }

  // Likewise, an explicit recipe style owns the photographic treatment. Drop
  // a trailing analyzer/reference Photo style: label instead of asking Chroma
  // to satisfy two competing portrait styles.
  if ([style.render, style.artistic_tone, style.extra].some(Boolean)) {
    text = text.replace(/(?:^|\n)\s*Photo style:\s*[^\n]*/gi, "");
  }

  return text.replace(/\n{3,}/g, "\n\n").trim();
}

function chromaLeanSingleSubjectPrompt(dna = {}, primaryGuard = {}, sourceDna = dna) {
  const block = buildChromaPrompts(dna, { raunch: false });
  const ph = dna.physique || {};
  const id = dna.identity || {};
  const face = dna.face || {};
  const hair = dna.hair || {};
  const skin = dna.skin || {};
  const wardrobe = dna.wardrobe || {};
  const pose = dna.pose || {};
  const scene = dna.scene || {};
  const lighting = dna.lighting || {};
  const camera = dna.camera || {};
  const style = dna.style || {};

  const age = Number(id.age || 0);
  const gender = catalogSelection(dna, "identity", "gender") === "male" ? "man" : "woman";
  const subject = [
    age ? `${age}-year-old adult ${gender}` : `adult ${gender}`,
    ageAppearancePrompt(age),
    heritagePrompt(id.ethnicity, dna),
    ph.body_type && `${ph.body_type} build`,
    ph.height && ph.height !== "average" ? `${ph.height} height` : "",
    face.eye_shape && `${face.eye_shape} eyes`,
    face.eye_color && `${face.eye_color} eye color`,
    face.jawline && `${face.jawline} jawline`,
    face.nose && `${face.nose} nose`,
    face.lips && `${face.lips} lips`,
    face.expression && `${face.expression} expression`,
    skin.tone && `${skin.tone} skin`,
    skin.texture && `${skin.texture} skin texture`,
    skin.freckles && skin.freckles !== "none" && `${skin.freckles} freckles`,
    skin.tattoos && skin.tattoos !== "none" && `${skin.tattoos} tattoos`,
    hair.bangs && hair.bangs !== "none" && `${hair.bangs} bangs`,
    hair.color && `${hair.color} hair`,
    hair.length && `${hair.length} hair`,
    hair.style && `${hair.style} hairstyle`,
    hair.texture && `${hair.texture} hair texture`,
  ].filter(Boolean).join(", ");

  const nudity = wardrobeNudity(wardrobe);
  const outfit = [
    nudity.direction,
    !nudity.suppressClothing && (wardrobe.outfit_set_color || wardrobe.garment_color),
    !nudity.suppressClothing && (wardrobe.outfit_set || wardrobe.dress_style || wardrobe.skirt_style || wardrobe.outfit_preset),
    !nudity.suppressClothing && !wardrobe.outfit_set && !wardrobe.dress_style ? wardrobe.top : "",
    !nudity.suppressClothing && !wardrobe.outfit_set && !wardrobe.dress_style && !wardrobe.skirt_style ? wardrobe.bottom : "",
    !nudity.suppressClothing && wardrobe.underwear && wardrobe.underwear !== "none" ? wardrobe.underwear : "",
    wardrobe.hosiery_color,
    wardrobe.hosiery_type,
    wardrobe.hosiery_pattern,
    wardrobe.heel_color,
    wardrobe.heel_type,
    !wardrobe.heel_type && kreaFeetVisible(dna) ? wardrobe.footwear : "",
  ].filter(value => value && value !== "none").join(" ");

  const framing = [
    pose.distance,
    pose.angle,
    photographyPosePrompt(pose.action),
    pose.body_language,
  ].filter(Boolean).join(", ");

  const setting = [
    scene.environment,
    scene.background,
    scene.props,
  ].filter(Boolean).join(", ");

  const look = [
    lighting.style,
    lighting.mood,
    lighting.source,
    camera.angle && `${camera.angle} camera angle`,
    camera.lens,
    style.render,
    style.artistic_tone,
  ].filter(Boolean).join(", ");

  // Keep Chroma T2I intentionally short. The exhaustive DNA compiler remains
  // available to other model families, but GoldenChroma follows the actual
  // subject/composition selections more reliably when they are not buried
  // beneath repeated anatomy/quality/override prose.
  const positive = [
    style.render ? `${style.render} image` : "Photorealistic editorial photograph",
    "one adult person only",
    primaryGuard.composition,
    framing && `composition: ${framing}`,
    chromaBodyPriority(sourceDna),
    subject && `subject: ${subject}`,
    outfit && `wardrobe: ${outfit}`,
    setting && `setting: ${setting}`,
    look && `visual treatment: ${look}`,
    "coherent anatomy, realistic skin texture, natural perspective",
  ].filter(Boolean).join("; ");

  return {
    ...block,
    positive: normalizeSelectedProportionLanguage(positive, sourceDna),
  };
}

function buildPrioritizedChromaPrompt(prompts, priorityPlan, primaryGuard, dna) {
  const bodyPriority = chromaBodyPriority(dna);
  const normalized = {
    ...prompts,
    positive: removeChromaReferenceDuplicates(normalizeSelectedProportionLanguage(prompts.positive, dna), dna),
  };
  const prioritized = prioritizePrompt(
    normalized.positive,
    priorityPlan,
    "chroma",
    { extraLead: [primaryGuard.composition, bodyPriority].filter(Boolean) }
  );
  return {
    ...normalized,
    ...prioritized,
    positive: removeChromaReferenceDuplicates(normalizeSelectedProportionLanguage(prioritized.positive, dna), dna),
    priorityPlan,
    guardAdjustments: primaryGuard.adjustments,
    negativeStrategy: "text",
  };
}

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

export function resolveChromaComposition(dna = {}, options = {}) {
  const resolved = JSON.parse(JSON.stringify(dna || {}));
  resolved.hair = { ...(resolved.hair || {}) };
  const adjustments = [];
  const shortCut = ["pixie", "pixie cut", "buzz cut"];
  const longStyles = ["braids", "box braids", "French braid", "Dutch braids", "fishtail braid", "ponytail", "updo", "locs", "twists"].map(lower);
  if (shortCut.includes(lower(resolved.hair.length)) && longStyles.includes(lower(resolved.hair.style))) {
    resolved.hair.length = "";
    adjustments.push("Kept the selected hairstyle and removed the competing short haircut length.");
  } else if (shortCut.includes(lower(resolved.hair.style)) && resolved.hair.length) {
    resolved.hair.length = "";
    adjustments.push("Kept the selected short haircut and removed the competing hair length.");
  }
  const guard = resolveZImageComposition(resolved, options);
  return { ...guard, adjustments: [...adjustments, ...guard.adjustments] };
}

export function resolveZImageComposition(dna = {}, options = {}) {
  const builderGuard = resolveBuilderControls(dna || {});
  const physiqueGuard = resolvePhysiqueControls(builderGuard.dna);
  const resolved = physiqueGuard.dna;
  resolved.pose = { ...(resolved.pose || {}) };
  resolved.feet = { ...(resolved.feet || {}) };
  resolved.hair = { ...(resolved.hair || {}) };
  resolved.physique = { ...(resolved.physique || {}) };
  resolved.style = { ...(resolved.style || {}) };

  const mode = ["natural", "enhanced", "extreme"].includes(lower(resolved.style.anatomy_mode))
    ? lower(resolved.style.anatomy_mode)
    : "natural";
  const adjustments = [...builderGuard.notes.map(note => note.text), ...physiqueGuard.adjustments];
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
  if (lower(resolved.hair.length) === "pixie" && ["wavy", "curly"].includes(hairStyle)) {
    resolved.hair.style = "";
    adjustments.push("Kept the pixie cut and removed the competing long wave/curl hairstyle wording.");
  }
  const bodyType = lower(catalogSelection(resolved, 'physique', 'body_type'));
  const buttSize = lower(catalogSelection(resolved, 'physique', 'butt'));
  const expandedBodyPreset = resolved._catalogSelections && (
    resolved.physique.body_type !== catalogSelection(resolved, 'physique', 'body_type') ||
    resolved.physique.butt !== catalogSelection(resolved, 'physique', 'butt')
  );
  if (!expandedBodyPreset && lower(resolved.physique.hips) === "narrow" && (
    ["curvy", "voluptuous", "plus size", "bbw", "pear", "hourglass"].includes(bodyType) ||
    ["large", "very large", "huge", "hyper"].includes(buttSize)
  )) {
    resolved.physique.hips = "average";
    adjustments.push("Replaced narrow hips that conflicted with the selected curvy lower-body proportions.");
  }

  const action = lower(catalogSelection(resolved, 'pose', 'action'));
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

    if (lower(resolved.feet.foot_size) === "size queen") {
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
  const selectedProportions = hasDetailedBodyScale(resolved);
  const naturalProportions = selectedProportions ? "selected body proportions" : "believable adult proportions";
  const humanLead = options.forceMulti
    ? (mode === "natural"
      ? "NORMAL HUMAN ANATOMY REQUIRED — each adult has one coherent torso and pelvis, exactly two arms and two legs, naturally sized hands and feet"
      : mode === "enhanced"
        ? "COHERENT HUMAN ANATOMY REQUIRED — each adult keeps one coherent torso and pelvis, exactly two arms and two legs"
        : "COHERENT ANATOMY REQUIRED — each adult remains one connected body with no duplicated body parts")
    : (mode === "natural"
      ? `NORMAL HUMAN ANATOMY REQUIRED — ${naturalProportions}, one coherent torso and pelvis, exactly two arms and two legs, naturally sized hands and feet`
      : mode === "enhanced"
        ? "COHERENT HUMAN ANATOMY REQUIRED — enhanced proportions with one coherent torso and pelvis, exactly two arms and two legs"
        : "COHERENT ANATOMY REQUIRED — one connected adult body with no duplicated body parts");

  let composition = "";
  if (focus === "feet") {
    composition = fullBody
      ? "PRIMARY COMPOSITION — full character visible head to feet, both complete feet visible at realistic perspective, feet prominent without filling the frame"
      : `PRIMARY COMPOSITION — ${resolved.feet.framing || "feet and ankles"} is the visual priority, coherent foot anatomy and perspective`;
  } else if (["butt", "hips"].includes(focus) && fullBody) {
    composition = "PRIMARY COMPOSITION — rear three-quarter full-body view, face and complete body visible, lower body prominent without filling the frame";
  } else if (["butt", "hips"].includes(focus)) {
    composition = "PRIMARY COMPOSITION — rear three-quarter view, lower body is the single visual priority, moderate perspective and connected limbs";
  } else if (focus === "face") {
    composition = fullBody
      ? "PRIMARY COMPOSITION — full character visible head to feet with space around the complete body; face clearly visible within this full-body frame, coherent perspective"
      : "PRIMARY COMPOSITION — face is the single visual priority, coherent body perspective and no body part enlarged toward the lens";
  } else if (fullBody) {
    composition = "PRIMARY COMPOSITION — full character visible head to feet, space around the complete body, coherent perspective";
  } else {
    const crop = {
      "detail shot": "tight detail framing of the selected subject detail",
      "close-up": "close-up framing",
      "portrait": "portrait framing",
      "waist-up": "waist-up framing",
      "thigh-up": "thigh-up framing",
      "knees-up": "knees-up framing",
    }[distance] || "balanced framing";
    composition = `PRIMARY COMPOSITION — ${crop}, coherent perspective`;
  }

  const selectedView = {
    back: "REQUIRED VIEW — camera behind the subject, rear view of the body, subject facing away from the camera",
    front: "REQUIRED VIEW — front view of the body, subject facing the camera",
    profile: "REQUIRED VIEW — side profile of the body",
  }[lower(resolved.pose?.angle)];
  if (selectedView && !options.forceMulti) composition = `${composition}; ${selectedView}`;

  const multiBodyGuard = options.forceMulti
    ? "MULTI-SUBJECT ANATOMY — each adult is a separate complete person with one head, one torso and pelvis, two arms and two legs; keep visible separation between torsos and pelvises; no merged bodies, shared limbs, stacked torsos or duplicated anatomy"
    : "";

  const lead = [
    humanLead,
    solo && "exactly one adult person in the image, no background people or partial extra bodies",
    multiBodyGuard,
    composition,
  ].filter(Boolean).join(", ");

  return { dna: resolved, composition: lead, adjustments, controlNotes:builderGuard.notes, anatomyMode: mode };
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

const kreaScale = (value, noun, labels) => {
  const n = Number(value) || 0;
  if (!n) return "";
  return `${labels[Math.min(4, Math.floor(n / 20))]} ${noun}${n >= 80 ? " with stylized fantasy proportions" : ""}`;
};

function kreaSubjectSentence(dna = {}, label = "") {
  const id = dna.identity || {};
  const ph = dna.physique || {};
  const face = dna.face || {};
  const hair = dna.hair || {};
  const skin = dna.skin || {};
  const age = Number(id.age || 0);
  const person = kreaGenderLabel(catalogSelection(dna, "identity", "gender"));
  const head = [age ? `${age}-year-old adult ${person}` : `adult ${person}`, ageAppearancePrompt(age)].filter(Boolean).join(', ');
  const body = kreaList(
    heritagePrompt(id.ethnicity, dna),
    ph.height && ph.height !== "average" ? `${ph.height} height` : "",
    ph.body_type && `${ph.body_type} body type`,
    Number(ph.muscularity || 0) > 60 ? (Number(ph.muscularity) > 85 ? "highly muscular build" : "athletic toned build") : "",
    Number(ph.curves || 0) > 60 ? (Number(ph.curves) > 85 ? "pronounced natural curves" : "curved silhouette") : "",
    ph.implant_volume > 0 ? "" : kreaScale(ph.bust_scale, "bust", ["small", "moderate", "full", "very large", "extremely oversized"]) || (ph.bust && `${ph.bust} bust`),
    ph.implant_volume > 0 ? "round augmented breast shape" : bustShapePrompt(ph.bust_shape),
    kreaScale(ph.waist_scale, "waist", ["very narrow", "narrow", "average", "wide", "very wide"]) || (ph.waist && `${ph.waist} waist`),
    kreaScale(ph.hip_scale, "hips", ["narrow", "moderate-width", "wide", "very wide", "extremely wide"]) || (ph.hips && `${ph.hips} hips`),
    (ph.butt_scale > 100 ? gluteSizePrompt(ph.butt_scale) : kreaScale(ph.butt_scale, "glutes", ["small", "moderate", "full rounded", "very large projected", "extremely oversized projected"])) || (ph.butt && `${ph.butt} buttocks`),
    ph.glute_shape,
    kreaScale(ph.thigh_scale, "thighs", ["slim", "moderate", "full", "very thick", "extremely thick"]) || (ph.thighs && `${ph.thighs} thighs`),
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
  // Lead with the selected silhouette. Long lists of face and styling details
  // otherwise bury the change the user is trying to see.
  return `${prefix}${[head, implantVisualPrompt(ph.implant_volume), ...body, ...faceHair].filter(Boolean).join(", ")}.`;
}

function kreaFeetVisible(dna = {}) {
  const distance = lower(dna.pose?.distance || "full body");
  if (["thigh-up", "knees-up", "waist-up", "portrait", "close-up"].includes(distance)) return false;
  return ["full body", "wide shot"].includes(distance) || lower(dna.pose?.focus) === "feet" || Boolean(dna.feet?.framing);
}

function kreaWardrobeSentence(dna = {}, label = "") {
  const w = dna.wardrobe || {};
  const prefix = label ? `Subject ${label} wardrobe: ` : "Wardrobe: ";
  const { direction: nudityDirection, suppressClothing } = wardrobeNudity(w);
  const feetVisible = kreaFeetVisible(dna);
  // A high nudity setting is an explicit wardrobe choice. Do not repeat a
  // contradictory outfit or garment from the saved character DNA.
  return kreaSentence(prefix, [
    nudityDirection,
    !suppressClothing && w.outfit_set ? `${w.outfit_set_color ? `${w.outfit_set_color} ` : ""}${w.outfit_set}` : "",
    suppressClothing || w.outfit_set || w.dress_style || w.skirt_style ? "" : w.outfit_preset,
    suppressClothing || w.outfit_set ? "" : w.dress_style,
    suppressClothing || w.outfit_set ? "" : w.skirt_style,
    !suppressClothing && !w.outfit_set && !w.dress_style && w.top && w.top !== "none" ? w.top : "",
    !suppressClothing && !w.outfit_set && !w.dress_style && !w.skirt_style && w.bottom && w.bottom !== "none" ? w.bottom : "",
    !suppressClothing && !w.outfit_set && w.underwear && w.underwear !== "none" ? w.underwear : "",
    w.hosiery_type ? `${w.hosiery_color ? `${w.hosiery_color} ` : ""}${w.hosiery_denier ? `${w.hosiery_denier} ` : ""}${w.hosiery_pattern && w.hosiery_pattern !== "plain" ? `${w.hosiery_pattern} ` : ""}${w.hosiery_type}` : "",
    feetVisible ? (w.heel_type ? `${w.heel_color ? `${w.heel_color} ` : ""}${w.heel_finish ? `${w.heel_finish} ` : ""}${w.heel_type}${w.heel_height ? `, ${w.heel_height} heel` : ""}` : w.footwear) : "",
    w.glasses_style ? `${w.glasses_color ? `${w.glasses_color} ` : ""}${w.glasses_style}` : "",
    w.nail_color ? `${w.nail_color} fingernails` : "",
    w.nail_shape ? `${w.nail_shape} nail shape` : "",
    w.accessories,
    suppressClothing ? "" : w.material,
    suppressClothing ? "" : w.garment_color && `${w.garment_color} outfit`,
    suppressClothing ? "" : w.garment_pattern && w.garment_pattern !== "solid" && `${w.garment_pattern} fabric`,
    suppressClothing ? "" : w.palette,
    suppressClothing ? "" : w.fit,
    suppressClothing ? "" : w.state,
  ]);
}

function kreaPoseSentence(dna = {}, label = "") {
  const p = dna.pose || {};
  const feet = dna.feet || {};
  const prefix = label ? `Subject ${label} pose and framing: ` : "Pose and framing: ";
  const framing = lower(p.distance) || "full body";
  const feetPriority = kreaFeetVisible(dna) && (lower(p.focus) === "feet" || kreaValue(feet.framing));
  const bodyCrop = ["full body", "wide shot", "knees-up", "thigh-up", "waist-up"].includes(framing);
  const cropDescription = {
    "waist-up": "waist-up", "thigh-up": "head-to-mid-thigh", "knees-up": "head-to-knees",
  }[framing] || "full-length";
  return kreaSentence(prefix, [
    photographyPosePrompt(p.action),
    p.body_language && `${p.body_language} body language`,
    p.angle && `${p.angle} view`,
    p.focus && !(lower(p.focus) === "feet" && !kreaFeetVisible(dna)) && (bodyCrop && lower(p.focus) === "face"
      ? `face clearly visible within the ${cropDescription} composition`
      : `${p.focus} composition priority`),
    arrayValue(p.hands).length ? `hands ${arrayValue(p.hands).slice(-1)[0]}` : "",
    Number(dna.physique?.implant_volume || 0) >= 3000 && lower(p.action).includes("leaning")
      ? "keep the projected chest silhouette visible rather than hidden behind the near arm" : "",
    feetPriority ? feet.framing : "",
    feetPriority ? feet.sole_presentation : "",
    feetPriority && feet.pedicure ? `${feet.pedicure} pedicure` : "",
    feetPriority ? feet.foot_pose : "",
    feetPriority ? feet.toe_length : "",
    feetPriority ? feet.sole_texture : "",
    feetPriority ? feet.pedicure_art : "",
    feetPriority ? feet.toenail_shape : "",
    feetPriority ? feet.foot_accessories : "",
    feetPriority ? feet.ground_surface : "",
  ]);
}

function kreaFramingSentence(dna = {}) {
  const framing = lower(dna.pose?.distance) || "full body";
  const reclining = /\b(lying|reclining|on back|on stomach)\b/.test(lower(dna.pose?.action));
  const directions = {
    "full body": "Full-length photograph: show the entire subject from the top of the head to the soles of the feet, with space around the body in the frame.",
    "wide shot": "Wide environmental photograph: show the entire subject from head to feet with the setting clearly visible around them.",
    portrait: "Head-and-shoulders portrait: frame the face and shoulders; the rest of the body may be outside the image.",
    "waist-up": "Waist-up photograph: show the head, torso and arms down to the waist.",
    "thigh-up": "Thigh-up photograph: show the subject from the top of the head to mid-thigh, with the torso, hips and upper legs visible.",
    "knees-up": "Knees-up photograph: show the subject from the top of the head to the knees, with space around the body.",
    "close-up": "Close-up photograph: focus on the face and nearby details; the body may be outside the image.",
    "detail shot": "Tight detail photograph: frame the selected detail rather than the whole body.",
  };
  const direction = reclining && ["full body", "wide shot"].includes(framing)
    ? "Wide full-length photograph from a suitable elevated camera position: the reclining subject fits entirely inside the frame, from the top of the head to both feet, with visible floor or bed space on every side. Do not crop to the face or shoulders."
    : directions[framing] || directions["full body"];
  const bustVisible = Number(dna.physique?.implant_volume || 0) >= 3000
    && ["full body", "wide shot", "waist-up", "thigh-up", "knees-up"].includes(framing);
  return bustVisible
    ? `${direction} Keep the torso and projected bust unmistakably visible, occupying substantial space in the frame.`
    : direction;
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
    !(intimate.nipple_size || intimate.nipple_shape) && intimate.nipples,
    !(intimate.areola_size || intimate.areola_shape || intimate.areola_color || intimate.areola_detail) && intimate.areolas,
    intimate.nipple_size,
    intimate.nipple_shape,
    intimate.areola_size,
    intimate.areola_shape,
    intimate.areola_color,
    intimate.areola_detail,
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
    ws.phase,
    ws.stance,
    ws.surface,
    ws.garment_detail,
    ws.liquid_visibility,
    ws.camera_view,
    ws.scene_props,
    ws.scene_notes,
    ws.urine_color,
    ws.self_action,
    ws.self_aim,
    ws.flow_appearance,
    ws.highlight,
    selfStreamContinuityCue(ws),
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
  const extremeBust = Number(primary.physique?.implant_volume || 0) >= 1500
    || Number(primary.physique?.bust_scale || 0) >= 80;
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
    ].filter(Boolean);
  });
  const sceneDetails = activeSubjects.map((subject, index) => kreaAdultDetailSentence(
    subject?.dna || {}, subjectCount > 1 ? (subject?.label || String.fromCharCode(65 + index)) : ""
  )).filter(Boolean);

  const realismTail = hasDetailedBodyScale(primary) && !extremeBust
    ? "Preserve the selected body proportions with one connected body per person, readable joints, natural skin texture and consistent photographic perspective."
    : extremeBust
    ? "Keep the deliberately exaggerated bust silhouette clearly visible while preserving one connected body, readable joints, natural skin detail and consistent perspective."
    : anatomyMode === "extreme"
    ? "Keep the requested stylization while preserving one connected body per person, readable joints, coherent hands and feet, realistic skin detail and consistent perspective."
    : anatomyMode === "enhanced"
      ? "Preserve enhanced proportions with coherent anatomy, connected limbs, realistic hands and feet, natural skin detail and consistent perspective."
      : "Use believable adult proportions, coherent anatomy, realistic hands and feet, natural skin texture, crisp facial detail and consistent perspective.";

  const sharedShot = kreaSharedShotSentences(primary);
  const [imageLead, ...shotDetails] = sharedShot;
  let positive = [
    kreaFramingSentence(primary),
    extremeBust && ["full body", "wide shot"].includes(lower(primary.pose?.distance || "full body")) && "The complete body and exaggerated upper-body silhouette must remain visible in this composition; use a wide camera view rather than a portrait crop.",
    ...subjectBlocks,
    compositionLead,
    ...shotDetails,
    imageLead,
    ...sceneDetails,
    realismTail,
  ].filter(Boolean).join(" ");

  // Krea 2's Qwen3-VL encoder responds well to concise natural language. Keep
  // must-match settings literal without turning the whole prompt into tag soup.
  const missingMust = (priorityPlan.mustMatch || [])
    .filter((item) => !(subjectCount === 1 && wardrobeNudity(primary.wardrobe).suppressClothing
      && item.key === "wardrobe.outfit_preset"))
    .filter((item) => !(subjectCount === 1 && lower(primary.pose?.focus) === "feet"
      && !["full body", "wide shot"].includes(lower(primary.pose?.distance || "full body"))
      && item.key === "pose.focus"))
    .filter((item) => !(item.key === "pose.focus"
      && lower(primary.pose?.focus) === "face"
      && (!primary.pose?.distance || ["full body", "wide shot", "waist-up", "thigh-up", "knees-up"].includes(lower(primary.pose.distance)))))
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
  const rawStyle = clean(promptStyle).toLowerCase();
  const style = ({ krea2_aio: "krea2", qwen_remix: "qwen_edit", ltx_t2v: "wan_t2v" })[rawStyle] || rawStyle;
  const kind = clean(workflowKind).toLowerCase();
  const name = clean(workflowName).toLowerCase();
  if (["qwen_image", "qwen_rapid"].includes(style) && !["edit", "enhance"].includes(kind)) return style;
  if (kind === "edit" || kind === "enhance" || style === "qwen_edit" || name.includes("qwen")) return "qwen_edit";
  if (kind === "video" || style === "wan_i2v") return "wan_i2v";
  if (kind === "text_video" || style === "wan_t2v") return "wan_t2v";
  if (style === "pony" || kind === "pony" || name.includes("pony")) return "pony";
  if (style === "sdxl_dmd2") return "sdxl_dmd2";
  if (style === "sdxl" || name.includes("juggernaut xl")) return "sdxl";
  if (style === "chroma" || name.includes("chroma")) return "chroma";
  if (style === "krea2" || name.includes("krea 2") || name.includes("krea2")) return "krea2";
  if (style === "flux2_klein" || name.includes("flux.2 klein")) return "flux2_klein";
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
      preserveUnmentioned ? "Preserve the subject's identity, age, pose, clothing, composition, lighting, background, body regions, and proportions only where they are not explicitly requested to change." : "",
      "Keep one connected human body. Do not add, remove, duplicate, enlarge, or relocate limbs, hands, feet, fingers, toes, torso, pelvis, or facial features unless the request explicitly requires it.",
      "Make the edit seamless, photorealistic, and consistent with the source image.",
    ].filter(Boolean).join(" "),
    negative: "unrequested changes, identity drift, face replacement, unrequested body redesign, unrequested wardrobe change, unrequested background change, duplicated anatomy, edit seams, artifacts",
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

function compileModelPromptsRaw({
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
  const resolveComposition = compiler === "chroma" ? resolveChromaComposition : resolveZImageComposition;
  const primaryGuard = resolveComposition(dna, { forceMulti: isMulti });
  const guardedSubjects = isMulti
    ? (subjects || []).map((subject) => ({ ...subject, dna: resolveComposition(subject?.dna || {}, { forceMulti: true }).dna }))
    : subjects;
  // Chroma's PRIMARY BODY PROPORTIONS block is the sole source for
  // detailed physique slider sizes. Build its generic priority plan from the
  // sanitized DNA so bust/glute/hip/thigh/waist scale wording is not re-added
  // later by promptPriority. Shape controls remain independent.
  const priorityDna = compiler === "chroma" && !isMulti
    ? chromaDnaWithAuthoritativeScales(primaryGuard.dna)
    : primaryGuard.dna;
  const priorityPlan = buildPromptPriorityPlan({
    dna: priorityDna,
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
  if (compiler === "sdxl" || compiler === "sdxl_dmd2") {
    const prompts = basePrompts({ dna: primaryGuard.dna, subjects: guardedSubjects, isMulti, raunch });
    return withPriorityGuard({ ...prompts, negative: "" }, "sdxl");
  }
  if (compiler === "flux2_klein") {
    const prompts = basePrompts({ dna: primaryGuard.dna, subjects: guardedSubjects, isMulti, raunch });
    return {
      ...withPriorityGuard({ ...prompts, negative: "" }, "flux"),
      negativeStrategy: "zeroed",
    };
  }
  if (compiler === "chroma" && isMulti) {
    const prompts = buildMultiChromaPrompts(guardedSubjects, { raunch });
    return {
      ...prompts,
      priorityPlan,
      droppedClauses: [],
      promptBudget: null,
      promptWords: clean(prompts.positive).split(/\s+/).filter(Boolean).length,
      omittedClauseCount: 0,
      guardAdjustments: primaryGuard.adjustments,
      negativeStrategy: "text",
    };
  }
  if (compiler === "chroma") {
    const sourceDna = primaryGuard.dna;
    const chromaDna = chromaDnaWithAuthoritativeScales(sourceDna);
    const prompts = chromaLeanSingleSubjectPrompt(chromaDna, primaryGuard, sourceDna);
    return {
      ...prompts,
      priorityPlan,
      droppedClauses: [],
      promptBudget: null,
      promptWords: clean(prompts.positive).split(/\s+/).filter(Boolean).length,
      omittedClauseCount: 0,
      guardAdjustments: primaryGuard.adjustments,
      negativeStrategy: "text",
    };
  }
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
  if (["qwen_image", "qwen_rapid"].includes(compiler)) {
    const result = withPriorityGuard(basePrompts({ dna: primaryGuard.dna, subjects: guardedSubjects, isMulti, raunch }), "standard");
    return compiler === "qwen_rapid" ? { ...result, negative: "", negativeStrategy: "zeroed" } : result;
  }
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

// Apply the same cast contract after each family-specific compiler. Headcount,
// selected ages and resemblance cannot be lost to a later word-budget trim.
export function compileModelPrompts(options = {}) {
  const auditSources = options.subjects?.length > 1 ? options.subjects : [{dna:options.dna || options.subjects?.[0]?.dna || {}}];
  const promptCatalog = options.promptCatalog || getPromptCatalog();
  const outfitDna = dna => ({ ...dna, wardrobe: resolveWardrobeMode(withCoveragePrompt(dna?.wardrobe || {}, promptCatalog)) });
  options = { ...options, dna: outfitDna(options.dna || {}), subjects: options.subjects?.map(subject => ({ ...subject, dna: outfitDna(subject.dna || {}) })) };
  const originalSubjects = options.subjects?.length > 1 ? options.subjects : [{dna:options.dna || options.subjects?.[0]?.dna || {}}];
  const customKeywords = originalSubjects.map((subject,index) => {
    const phrase=customCatalogPrompt(subject.dna, promptCatalog);
    return phrase ? `${originalSubjects.length > 1 ? `Subject ${subject.label || String.fromCharCode(65+index)}: ` : ''}${phrase}` : '';
  }).filter(Boolean).join('; ');
  options = {...options, dna:catalogDna(options.dna || {}, promptCatalog, true), subjects:options.subjects?.map(subject => ({...subject,dna:catalogDna(subject.dna, promptCatalog, true)}))};
  const compiler = resolvePromptCompiler(options);
  const direct = ["qwen_edit", "wan_i2v"].includes(compiler);
  const photographic = !direct && compiler !== "wan_t2v";
  const photoDna = dna => ({ ...dna, style: { ...dna?.style, render: !dna?.style?.render || dna.style.render === 'octane' ? 'photorealistic' : dna.style.render } });
  if (photographic) options = { ...options, dna: photoDna(options.dna || {}), subjects: (options.subjects || []).map(subject => ({ ...subject, dna: photoDna(subject.dna || {}) })) };
  const source = Array.isArray(options.subjects) ? options.subjects : [];
  const isMulti = !direct && source.length > 1;
  const scenarioDna = source[0]?.dna || options.dna || {};
  const scenario = { ...scenarioDna.scenario,
    cast_age_mode: catalogSelection(scenarioDna, 'scenario', 'cast_age_mode'),
    cast_resemblance: catalogSelection(scenarioDna, 'scenario', 'cast_resemblance'),
  };
  const subjects = isMulti ? applyCastAppearance(source, scenario, options.sectionLocks) : source;
  let result = compileModelPromptsRaw({ ...options, subjects, isMulti: isMulti || (!source.length && !!options.isMulti), dna: isMulti ? subjects[0].dna : options.dna });
  if (customKeywords) result = {...result,positive:`${result.positive}; ${customKeywords}`};
  const contract = isMulti ? castAppearancePrompt(subjects) : "";
  if (direct) return applyCatalogRules(result, options.workflowKind || "edit", promptCatalog);
  const fidelitySubjects = isMulti ? subjects : [{ dna: options.dna || source[0]?.dna || {} }];
  // Preserve resolved selections so the fidelity pass cannot re-add conflicts.
  const resolvedSubjects = fidelitySubjects.map(subject => {
    const guard = (compiler === 'chroma' ? resolveChromaComposition : resolveZImageComposition)(subject.dna, {forceMulti:isMulti});
    return {...subject, dna:guard.dna, controlNotes:guard.controlNotes};
  });
  let protectedResult = preserveGeneralSelections(result, resolvedSubjects);
  const detailed = resolvedSubjects.some(subject => hasDetailedBodyScale(subject.dna));
  protectedResult = {
    ...protectedResult,
    positive: photographic ? photographicPrompt(detailed ? normalizeSelectedProportionLanguage(protectedResult.positive, resolvedSubjects.find(subject => hasDetailedBodyScale(subject.dna)).dna) : protectedResult.positive) : protectedResult.positive,
  };
  if (photographic) {
    protectedResult = { ...protectedResult, ...applyPhotographicGuidance(protectedResult) };
  }
  const supportingFootDetails = [];
  const controls = resolvedSubjects.map((subject, index) => {
    const d = subject.dna;
    const values = sliderPromptSignature(d, subjectPromptText(protectedResult.positive, subject.label || String.fromCharCode(65 + index), isMulti));
    const footDetails = Object.entries(d.feet || {}).filter(([key, value]) =>
      key !== 'composition_mode' && !['framing', 'sole_presentation', 'foot_pose', 'foot_act'].includes(key)
      && (Array.isArray(value) ? value.length : value)
      && !String(protectedResult.positive).toLowerCase().includes(Array.isArray(value) ? value.join(' and ').toLowerCase() : String(value).toLowerCase())).map(([key, value]) => `${key.replace(/_/g, ' ')}: ${key === 'foot_size' && value === 'size queen' ? 'very large feet' : Array.isArray(value) ? value.join(' and ') : value}`);
    const prefix = isMulti ? `Subject ${subject.label || String.fromCharCode(65 + index)} ` : '';
    // Complete outfit presets must not erase an explicit barefoot choice.
    // Use resolved coverage so heels or hosiery cannot regain conflicting skin details.
    const bareFeet = d.wardrobe?.footwear === 'barefoot' && footVisibility(d.wardrobe, d.feet).bare && kreaFeetVisible(d);
    const barefootText = bareFeet ? `${prefix}barefoot, uncovered feet with natural skin, natural heels and individually defined toes` : '';
    const footText = footDetails.length ? `${prefix}Foot details: ${footDetails.join(', ')}` : '';
    const feetFocused = d.pose?.focus === 'feet';
    if (!feetFocused) supportingFootDetails.push(...[barefootText, footText].filter(Boolean));
    return [feetFocused && barefootText, values && `${prefix}Selected slider values: ${values}`, feetFocused && footText].filter(Boolean).join('; ');
  }).filter(Boolean).join('; ');
  if (controls) {
    // Keep requested slider values inside the early encoder context rather than
    // appending them beyond a long prompt's token limit. Preserve Pony score lead.
    const score = protectedResult.positive.match(/^((?:score_[^,; ]+,?\s*)+)/)?.[0] || '';
    protectedResult.positive = `${score}${controls}; ${protectedResult.positive.slice(score.length)}`;
  }
  if (supportingFootDetails.length) protectedResult.positive += `; ${supportingFootDetails.join('; ')}`;
  protectedResult.promptWords = clean(protectedResult.positive).split(/\s+/).filter(Boolean).length;
  const finalize = prompts => {
    // Compact output is opt-in for still images. Edit and motion instructions
    // retain their dedicated compilers and existing model conditioning.
    if (options.promptFormat === 'compact' && photographic) {
      const compact = buildCompactNarrative(resolvedSubjects, promptCatalog, compiler, options.raunch);
      const positive = [contract, compact.positive].filter(Boolean).join(' ');
      prompts = {...prompts, positive, profile:compact.profile, compactRequirements:compact.requirements,
        detailedPromptWords:clean(prompts.positive).split(/\s+/).filter(Boolean).length,
        promptWords:clean(positive).split(/\s+/).filter(Boolean).length,
        promptBudget:null, droppedClauses:[], omittedClauseCount:0};
    }
    const final = applyCatalogRules(prompts, options.workflowKind || 'image', promptCatalog);
    return {...final, selectionManifest:buildSelectionManifest({sources:auditSources, prepared:fidelitySubjects, resolved:resolvedSubjects,
      sections:catalogSections(SECTIONS, promptCatalog), raunch:options.raunch, compactRequirements:final.compactRequirements})};
  };
  if (!contract) return finalize(protectedResult);
  const positive = `${contract} ${protectedResult.positive}`;
  const negative = scenario.cast_resemblance === "matching faces"
    ? String(protectedResult.negative || "").split(",").filter(clause => !/duplicate face/i.test(clause)).join(",").trim()
    : protectedResult.negative;
  return finalize({ ...protectedResult, positive, negative, promptWords: clean(positive).split(/\s+/).filter(Boolean).length });
}
