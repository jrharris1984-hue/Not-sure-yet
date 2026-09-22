import { buildPrompts, buildMultiVenicePrompts, buildChromaPrompts, buildMultiChromaPrompts } from "@/lib/dna";
import { buildPonyPrompts, buildMultiPonyPrompts } from "@/lib/ponyPrompts";

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
      supportingFeet = selectedPedicure && selectedPedicure !== "natural nails"
        ? `both naturally proportioned feet visible with ${selectedPedicure.replace(/^painted\s+(.+)$/i, "$1-painted")} toenails`
        : "both naturally proportioned feet visible";
      resolved.feet = {};
      adjustments.push("Removed the competing PRIMARY FEET block because feet are not the composition priority.");
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
  const humanLead = mode === "natural"
    ? "NORMAL HUMAN ANATOMY REQUIRED — believable adult proportions, one coherent torso and pelvis, exactly two arms and two legs, naturally sized hands and feet"
    : mode === "enhanced"
      ? "COHERENT HUMAN ANATOMY REQUIRED — enhanced proportions with one coherent torso and pelvis, exactly two arms and two legs"
      : "COHERENT ANATOMY REQUIRED — one connected adult body with no duplicated body parts";

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

  const lead = [
    humanLead,
    solo && "exactly one adult person in the image, no background people or partial extra bodies",
    composition,
    supportingFeet,
  ].filter(Boolean).join(", ");

  return { dna: resolved, composition: lead, adjustments, anatomyMode: mode };
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
  if (style === "zimage" || name.includes("z-image") || name.includes("z image")) return "zimage";
  return "standard";
}

export function buildZImagePrompts({ dna = {}, subjects = [], isMulti = false, raunch = false } = {}) {
  const primaryGuard = resolveZImageComposition(dna, { forceMulti: isMulti });
  const guardedSubjects = isMulti
    ? (subjects || []).map((subject) => ({ ...subject, dna: resolveZImageComposition(subject?.dna || {}).dna }))
    : subjects;
  const base = basePrompts({
    dna: primaryGuard.dna,
    subjects: guardedSubjects,
    isMulti,
    raunch,
  });
  const guardedPositive = [primaryGuard.composition, normalizeZImageLanguage(base.positive)]
    .filter(Boolean)
    .join(", ");
  return {
    positive: compactWords(
      dedupeClauses(guardedPositive),
      primaryGuard.anatomyMode === "natural" ? 220 : primaryGuard.anatomyMode === "enhanced" ? 280 : 340
    ),
    negative: ZIMAGE_NEGATIVE,
    guardAdjustments: primaryGuard.adjustments,
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
  const base = buildZImagePrompts({ dna, subjects, isMulti, raunch });
  const motion = clean(instruction);
  return {
    positive: compactWords([
      "Single continuous cinematic shot.", base.positive,
      motion && `Action over time: ${motion}.`,
      "Maintain consistent identity, anatomy, clothing, environment, and lighting across every frame. Use physically coherent body, hair, fabric, and camera motion.",
    ].filter(Boolean).join(" "), 420),
    negative: WAN_NEGATIVE,
  };
}

export function compileModelPrompts({ promptStyle = "", workflowKind = "", workflowName = "", dna = {}, subjects = [], isMulti = false, raunch = false, editInstruction = "", videoInstruction = "", preserveUnmentioned = true } = {}) {
  const compiler = resolvePromptCompiler({ promptStyle, workflowKind, workflowName });
  const primaryGuard = resolveZImageComposition(dna, { forceMulti: isMulti });
  const guardedSubjects = isMulti
    ? (subjects || []).map((subject) => ({ ...subject, dna: resolveZImageComposition(subject?.dna || {}).dna }))
    : subjects;
  const withUniversalGuard = (prompts, family) => ({
    ...prompts,
    positive: compactWords(
      dedupeClauses([primaryGuard.composition, prompts.positive].filter(Boolean).join(", ")),
      family === "pony" ? 300 : family === "chroma" ? 360 : 340
    ),
    guardAdjustments: primaryGuard.adjustments,
  });
  if (compiler === "pony") return withUniversalGuard(
    isMulti ? buildMultiPonyPrompts(guardedSubjects, { raunch }) : buildPonyPrompts(primaryGuard.dna, { raunch }),
    "pony"
  );
  if (compiler === "chroma") return withUniversalGuard(
    isMulti ? buildMultiChromaPrompts(guardedSubjects, { raunch }) : buildChromaPrompts(primaryGuard.dna, { raunch }),
    "chroma"
  );
  if (compiler === "zimage") return buildZImagePrompts({ dna, subjects, isMulti, raunch });
  if (compiler === "qwen_edit") return buildQwenEditPrompts({ instruction: editInstruction, preserveUnmentioned });
  if (compiler === "wan_i2v") return buildWanImageToVideoPrompts({ instruction: videoInstruction });
  if (compiler === "wan_t2v") return buildWanTextToVideoPrompts({ dna, subjects, isMulti, raunch, instruction: videoInstruction });
  return withUniversalGuard(basePrompts({ dna: primaryGuard.dna, subjects: guardedSubjects, isMulti, raunch }), "standard");
}
