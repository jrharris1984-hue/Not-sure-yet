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
  [/detailed anatomy with natural proportions, anatomically correct body, realistic weight distribution, natural breast shape with realistic gravity, detailed vulva, visible labia, realistic skin flush, natural moisture/gi,
    "coherent human anatomy, realistic proportions, natural weight distribution, realistic joints and limb connections"],
];

function normalizeZImageLanguage(value) {
  return ZIMAGE_SIZE_REWRITES.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), value);
}

export function resolveZImageComposition(dna = {}) {
  const resolved = JSON.parse(JSON.stringify(dna || {}));
  resolved.pose = { ...(resolved.pose || {}) };
  resolved.feet = { ...(resolved.feet || {}) };
  resolved.hair = { ...(resolved.hair || {}) };

  const adjustments = [];
  const hands = arrayValue(resolved.pose.hands).filter((item) => lower(item) !== "none");
  if (hands.length > 1) {
    const kept = hands[hands.length - 1];
    resolved.pose.hands = [kept];
    adjustments.push(`Kept “${kept}” as the single hand action.`);
  }

  const hairStyle = lower(resolved.hair.style);
  const hairLength = lower(resolved.hair.length);
  if (["updo", "ponytail"].includes(hairStyle) && ["pixie", "short bob"].includes(hairLength)) {
    resolved.hair.length = "";
    adjustments.push("Removed the incompatible short hair length from the selected tied-up hairstyle.");
  }

  const focus = lower(resolved.pose.focus) || "full frame";
  const distance = lower(resolved.pose.distance);
  const feetFraming = lower(resolved.feet.framing);
  const solePresentation = lower(resolved.feet.sole_presentation);
  const feetRequested = !!(solePresentation || feetFraming || arrayValue(resolved.feet.foot_act).length);
  const fullBody = ["full body", "wide shot"].includes(distance);
  const feetCloseup = ["feet close-up", "sole close-up", "pov under foot", "low angle sole"].includes(feetFraming);

  if (fullBody && feetCloseup && focus !== "feet") {
    resolved.feet.framing = "full body";
    adjustments.push("Changed the feet close-up to full-body foot visibility so it matches the selected framing.");
  }

  let composition = "";
  if (focus === "feet") {
    composition = fullBody
      ? "PRIMARY COMPOSITION — full character visible head to feet, both complete feet clearly visible and prominent without extreme lens enlargement"
      : "PRIMARY COMPOSITION — feet are the single visual priority, both complete feet and ankles visible with realistic scale and perspective";
  } else if (["butt", "hips"].includes(focus) && feetRequested && fullBody) {
    composition = "PRIMARY COMPOSITION — rear three-quarter full-body view, face and complete body visible, buttocks prominent but not filling the frame, both complete feet naturally visible in an anatomically achievable position";
  } else if (["butt", "hips"].includes(focus)) {
    composition = "PRIMARY COMPOSITION — rear three-quarter view with the lower body as the single visual priority, coherent pelvis and connected limbs, moderate perspective";
  } else if (focus === "face") {
    composition = "PRIMARY COMPOSITION — face is the single visual priority, coherent body perspective and no body part enlarged toward the lens";
  } else {
    composition = "PRIMARY COMPOSITION — balanced full-character framing, coherent perspective, connected limbs, no competing body-part close-up";
  }

  return { dna: resolved, composition, adjustments };
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
  const primaryGuard = resolveZImageComposition(dna);
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
    positive: compactWords(dedupeClauses(guardedPositive), 360),
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
      "Use coherent natural motion with stable hands, feet, face, hair, and fabric from first frame to last.",
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
  if (compiler === "pony") return isMulti ? buildMultiPonyPrompts(subjects, { raunch }) : buildPonyPrompts(dna, { raunch });
  if (compiler === "chroma") return isMulti ? buildMultiChromaPrompts(subjects, { raunch }) : buildChromaPrompts(dna, { raunch });
  if (compiler === "zimage") return buildZImagePrompts({ dna, subjects, isMulti, raunch });
  if (compiler === "qwen_edit") return buildQwenEditPrompts({ instruction: editInstruction, preserveUnmentioned });
  if (compiler === "wan_i2v") return buildWanImageToVideoPrompts({ instruction: videoInstruction });
  if (compiler === "wan_t2v") return buildWanTextToVideoPrompts({ dna, subjects, isMulti, raunch, instruction: videoInstruction });
  return basePrompts({ dna, subjects, isMulti, raunch });
}
