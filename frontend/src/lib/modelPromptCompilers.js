import { buildPrompts, buildMultiVenicePrompts, buildChromaPrompts, buildMultiChromaPrompts } from "@/lib/dna";
import { buildPonyPrompts, buildMultiPonyPrompts } from "@/lib/ponyPrompts";

const ZIMAGE_NEGATIVE = [
  "low quality, blurry, out of focus, jpeg artifacts, oversharpened",
  "bad anatomy, deformed body, extra limbs, missing limbs",
  "malformed hands, extra fingers, fused fingers",
  "malformed feet, extra toes, missing toes, hand-like feet",
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
  const base = basePrompts({ dna, subjects, isMulti, raunch });
  return { positive: compactWords(dedupeClauses(base.positive), 360), negative: ZIMAGE_NEGATIVE };
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
