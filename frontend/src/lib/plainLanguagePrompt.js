import { implantVisualPrompt } from "./implantVisualScale";

// Labeled observations from an imported photo are reference metadata. Current
// Builder controls own these instructions; leave unlabeled requests untouched.
export function resolveReferenceNotes(input, dna = {}, subjects = []) {
  const ownedValues = (source) => ({
    "body orientation": source.pose?.angle,
    "camera angle": source.camera?.angle,
    pose: source.pose?.action,
    framing: source.pose?.distance,
    expression: source.face?.expression,
  });
  return String(input || "").split(/\n/).filter(line => {
    const match = line.match(/^\s*(?:Subject\s+(\w+)\s*—\s*)?([^:]+):/i);
    if (!match) return true;
    const source = match[1] ? subjects.find(subject => subject.label === match[1])?.dna : dna;
    const value = ownedValues(source || {})[match[2].trim().toLowerCase()];
    return !value || ["none", "default"].includes(String(value).toLowerCase());
  }).join("\n").trim();
}

// Keep the user's words separate from model wording. This makes the translation
// reviewable and prevents a model switch from permanently rewriting the input.
export function translatePlainLanguage(input, compiler = "sdxl") {
  let remaining = String(input || "").trim();
  const attributes = [];
  const implant = remaining.match(/\b(?:breast\s*)?implants?\s*(?:of\s*)?(\d[\d,]*)\s*(?:cc|cubic centimeters?)\b|\b(\d[\d,]*)\s*(?:cc|cubic centimeters?)\s*(?:breast\s*)?implants?\b/i);
  if (implant) {
    const volume = Number((implant[1] || implant[2]).replace(/,/g, ""));
    attributes.push({ source: implant[0], meaning: implantVisualPrompt(volume), key: "implant" });
    remaining = remaining.replace(implant[0], " ");
  }
  if (/\b(?:bbl|brazilian butt lift)\b/i.test(remaining)) {
    const match = remaining.match(/\b(?:bbl|brazilian butt lift)\b/i)[0];
    attributes.push({ source: match, meaning: "pronounced rounded buttocks, fuller hips and a defined waist-to-hip silhouette", key: "bbl" });
    remaining = remaining.replace(/\b(?:bbl|brazilian butt lift)\b/i, " ");
  }
  remaining = remaining.replace(/\s+,/g, ",").replace(/,\s*,/g, ",").replace(/^[\s,]+|[\s,]+$/g, "").trim();
  const descriptions = attributes.map(({ meaning }) => meaning);
  if (!remaining && !descriptions.length) return { text: "", attributes };
  if (compiler === "qwen_edit") {
    const changes = [remaining, ...descriptions].filter(Boolean).join("; ");
    return { text: `Change only the requested features: ${changes}. Preserve the subject's identity, pose, clothing, lighting, and background unless explicitly changed.`, attributes };
  }
  if (compiler === "wan_i2v") {
    // An image-to-video model should animate the supplied frame, not redesign its anatomy.
    return { text: remaining ? `Animate the source image: ${remaining}. Preserve the subject and body proportions.` : "", attributes };
  }
  if (compiler === "pony" || compiler === "sdxl" || compiler === "sdxl_dmd2") {
    return { text: [remaining, ...descriptions].filter(Boolean).join(", "), attributes };
  }
  return { text: [remaining, ...descriptions].filter(Boolean).join(". ").replace(/\.(?=\.)/g, "") + ".", attributes };
}
