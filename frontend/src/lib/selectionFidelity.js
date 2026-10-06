import { HERITAGE_PROFILES } from './heritageProfiles';
const meaningful = value => value !== undefined && value !== null && value !== "" && value !== "none" && value !== "default";
const text = value => String(value).replace(/\s+/g, " ").trim();

const appearanceFields = {
  face: { eye_shape: "eye shape", eye_color: "eye color", jawline: "jawline", nose: "nose shape", lips: "lip shape", expression: "expression" },
  hair: { color: "hair color", length: "hair length", style: "hairstyle", texture: "hair texture", bangs: "bangs" },
  skin: { tone: "skin tone", texture: "skin texture", freckles: "freckles", tattoos: "tattoos" },
  wardrobe: { nail_color: "fingernail color", nail_shape: "fingernail shape", glasses_style: "glasses style", glasses_color: "glasses color" },
  physique: { height: "height", body_type: "build", shoulders: "shoulder width", legs: "leg length" },
};

// This compact block protects general appearance controls from compiler budgets.
// It intentionally excludes intimate anatomy and sexual activity fields.
export function appearanceSignature(dna = {}, existing = "") {
  const traits = [];
  if (dna.hair?.bangs === "none" && !/\bno bangs\b/i.test(existing)) traits.push("no bangs");
  if (dna.skin?.freckles === "none" && !/\bno freckles\b/i.test(existing)) traits.push("no freckles");
  const chunks = existing.toLowerCase().split(/[,;.!]/);
  const present = (value, label = "") => chunks.some(chunk => {
    const context = label.includes("eye") ? "eye" : label.includes("hair") || label === "bangs" ? "hair" : label.includes("lip") ? "lip" : label.includes("nose") ? "nose" : label.includes("skin") ? "skin" : label.includes("fingernail") ? "nail" : label.includes("glasses") ? "glass" : label.split(" ")[0];
    const valuePresent = chunk.includes(text(value).toLowerCase());
    const contextPresent = label === "build" ? /\bbuild\b|body type|physique/.test(chunk) : chunk.includes(context);
    return valuePresent && (!label || contextPresent);
  }) || (text(value).includes(',') && existing.toLowerCase().includes(text(value).toLowerCase()));
  const heritage = HERITAGE_PROFILES[dna.identity?.ethnicity]?.ancestry;
  const heritagePresent = heritage ? existing.toLowerCase().includes(heritage.split(",")[0].toLowerCase()) : present(dna.identity?.ethnicity);
  if (meaningful(dna.identity?.ethnicity) && !heritagePresent) {
    traits.push(heritage || `${text(dna.identity.ethnicity)} heritage`);
  }
  for (const [section, fields] of Object.entries(appearanceFields)) {
    for (const [key, label] of Object.entries(fields)) {
      const value = dna[section]?.[key];
      if (meaningful(value) && !present(value, label)) traits.push(`${label}: ${text(value)}`);
    }
  }
  return traits.join(", ");
}

export function generalSelectionRequirements(dna = {}) {
  const fields = {
    scene: ["environment", "background", "indoor_outdoor", "era", "props"],
    lighting: ["source", "style", "mood", "direction", "color_temp"],
    camera: ["lens", "angle", "aperture", "aspect_ratio"],
    style: ["render", "artistic_tone", "film_grain", "extra"],
  };
  return Object.entries(fields).flatMap(([section, keys]) => keys.flatMap(key => {
    const value = dna[section]?.[key];
    return meaningful(value) ? [`${section} ${key.replace(/_/g, " ")}: ${text(value)}`] : [];
  }));
}

export function subjectPromptText(positive, label, multi = false) {
  const all = String(positive || "");
  if (!multi) return all;
  const start = all.indexOf(`Subject ${label}`);
  if (start < 0) return "";
  const remaining = all.slice(start);
  const other = remaining.slice(`Subject ${label}`.length).search(/Subject [A-D]\b/);
  return other >= 0 ? remaining.slice(0, other + `Subject ${label}`.length) : remaining;
}

export function preserveGeneralSelections(result, subjects = []) {
  const appearances = subjects.map((subject, index) => {
    const label = subject.label || String.fromCharCode(65 + index);
    const existing = subjectPromptText(result.positive, label, subjects.length > 1);
    const signature = appearanceSignature(subject.dna, existing);
    return signature ? `${subjects.length > 1 ? `Subject ${subject.label || String.fromCharCode(65 + index)} appearance` : "Selected appearance"}: ${signature}` : "";
  }).filter(Boolean);
  const shared = generalSelectionRequirements(subjects[0]?.dna).filter(clause => {
    const value = clause.slice(clause.indexOf(":") + 1).trim().toLowerCase();
    return !String(result.positive || "").toLowerCase().includes(value);
  });
  if (!appearances.length && !shared.length) return result;
  const clauses = [...appearances, ...shared].join("; ");
  // Keep the existing framing/quality lead first (including Pony score tags).
  const match = String(result.positive).match(/^(.*?[.;](?=\s|$)|(?:score_[^,]+,\s*)+)/);
  const lead = match?.[0] || "";
  const positive = lead ? `${lead} ${clauses}; ${result.positive.slice(lead.length).trim()}` : `${clauses}; ${result.positive}`;
  return { ...result, positive, promptWords: positive.split(/\s+/).filter(Boolean).length };
}
