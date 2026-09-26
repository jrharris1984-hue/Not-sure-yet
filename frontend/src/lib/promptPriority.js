import { expandPrompt } from "@/lib/promptMap";

export const PROMPT_BUDGET_WORDS = {
  zimage: 260,
  chroma: 330,
  pony: 160,
  standard: 320,
  wan_t2v: 340,
};

const MUST_FIELDS = new Set([
  "identity.gender",
  "identity.age",
  "physique.body_type",
  "wardrobe.outfit_preset",
  "pose.action",
  "pose.distance",
  "pose.angle",
  "pose.focus",
  "scenario.cast_size",
  "scenario.acts",
]);

const IMPORTANT_FIELDS = new Set([
  "identity.ethnicity",
  "physique.height",
  "physique.curves",
  "physique.bust",
  "physique.bust_shape",
  "physique.butt",
  "physique.hips",
  "physique.waist",
  "physique.thighs",
  "face.eye_shape",
  "face.eye_color",
  "face.expression",
  "hair.style",
  "hair.length",
  "hair.color",
  "skin.tone",
  "wardrobe.top",
  "wardrobe.bottom",
  "wardrobe.underwear",
  "wardrobe.footwear",
  "scene.environment",
  "lighting.source",
  "lighting.style",
  "lighting.mood",
  "camera.lens",
  "camera.aspect_ratio",
  "scenario.roleplay",
]);

const IMPORTANT_SECTIONS = new Set(["intimate", "kink", "watersports"]);

const clean = (value) => String(value ?? "").replace(/\s+/g, " ").trim();
const normalize = (value) => clean(value).toLowerCase().replace(/[^a-z0-9%+.-]+/g, " ").replace(/\s+/g, " ").trim();
const humanize = (key) => String(key || "").replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());

const isMeaningful = (value, locked = false) => {
  if (Array.isArray(value)) return value.some((item) => isMeaningful(item, locked));
  if (value && typeof value === "object") return false;
  if (typeof value === "number") return locked ? Number.isFinite(value) : value > 0;
  if (typeof value === "boolean") return locked ? true : value;
  const normalized = normalize(value);
  return !!normalized && !["none", "default", "off", "n a", "null", "undefined"].includes(normalized);
};

const rawDisplay = (value) => Array.isArray(value)
  ? value.filter((item) => isMeaningful(item, true)).map(clean).join(" and ")
  : clean(value);

function literalRequirement(section, field, value) {
  const display = rawDisplay(value);
  if (!display && display !== "0") return "";

  const key = `${section}.${field}`;
  if (key === "identity.age") return `${display}-year-old adult`;
  if (key === "identity.gender") return `${display} adult subject`;
  if (key === "scenario.cast_size") {
    const countMap = {
      solo: "exactly one adult subject",
      duo: "exactly two adult subjects",
      threesome: "exactly three adult subjects",
      foursome: "exactly four adult subjects",
      group: "multiple adult subjects",
      gangbang: "multiple adult subjects",
      orgy: "multiple adult subjects",
    };
    return countMap[normalize(display)] || `cast size: ${display}`;
  }
  if (key === "physique.body_type") return `${display} body type`;
  if (key === "physique.bust") return `${display} bust size`;
  if (key === "physique.butt") return `${display} buttock size and shape`;
  if (key === "physique.hips") return `${display} hips`;
  if (key === "physique.thighs") return `${display} thighs`;
  if (key === "pose.action") return `${display} pose`;
  if (key === "pose.distance") return `${display} framing`;
  if (key === "pose.angle") return `${display} view`;
  if (key === "pose.focus") return `${display} composition focus`;
  if (key === "wardrobe.outfit_preset") return `${display} wardrobe`;
  if (key === "hair.color") return `${display} hair`;
  if (key === "hair.style") return `${display} hairstyle`;
  if (key === "hair.length") return `${display} hair length`;
  if (key === "scene.environment") return `${display} environment`;
  if (section === "lighting") return `${display} lighting`;
  if (key === "camera.aspect_ratio") return `${display} aspect ratio`;
  return `${humanize(field)}: ${display}`;
}

function expandedTerms(section, field, value, raunch) {
  const values = Array.isArray(value) ? value : [value];
  const terms = [];
  values.filter((item) => isMeaningful(item, true)).forEach((item) => {
    if (typeof item === "number" || typeof item === "boolean") return;
    const expanded = clean(expandPrompt(section, field, item, { raunch }));
    if (!expanded) return;
    expanded.split(/,\s*/).forEach((part) => {
      const normalized = normalize(part);
      if (normalized.length >= 5) terms.push(normalized);
    });
  });
  return terms;
}

function fieldPriority(section, field, locked) {
  const key = `${section}.${field}`;
  if (locked || MUST_FIELDS.has(key)) return "must";
  if (IMPORTANT_FIELDS.has(key) || IMPORTANT_SECTIONS.has(section)) return "important";
  return "detail";
}

function collectSubjectItems(dna = {}, {
  subjectLabel = "",
  fieldLocks = {},
  sectionLocks = {},
  raunch = false,
} = {}) {
  const items = [];

  Object.entries(dna || {}).forEach(([section, fields]) => {
    if (!fields || typeof fields !== "object" || Array.isArray(fields)) return;
    Object.entries(fields).forEach(([field, value]) => {
      const locked = !!sectionLocks?.[section] || !!fieldLocks?.[section]?.[field];
      if (!isMeaningful(value, locked)) return;

      const priority = fieldPriority(section, field, locked);
      const literal = literalRequirement(section, field, value);
      if (!literal) return;
      const subjectPrefix = subjectLabel ? `Subject ${subjectLabel} ` : "";
      const phrase = `${subjectPrefix}${literal}`;
      const matchTerms = Array.from(new Set([
        normalize(phrase),
        normalize(literal),
        ...expandedTerms(section, field, value, raunch),
      ].filter((term) => term && term.length >= 5)));

      items.push({
        key: subjectLabel ? `${subjectLabel}:${section}.${field}` : `${section}.${field}`,
        section,
        field,
        label: `${subjectPrefix}${humanize(field)}`.trim(),
        value: rawDisplay(value),
        phrase,
        matchTerms,
        priority,
        locked,
      });
    });
  });

  return items;
}

export function emptyPromptPriorityPlan() {
  return { mustMatch: [], important: [], detail: [], counts: { mustMatch: 0, important: 0, detail: 0 } };
}

export function buildPromptPriorityPlan({
  dna = {},
  subjects = [],
  isMulti = false,
  raunch = false,
  fieldLocks = {},
  sectionLocks = {},
} = {}) {
  let items = [];

  if (isMulti && Array.isArray(subjects) && subjects.length) {
    subjects.forEach((subject, index) => {
      items.push(...collectSubjectItems(subject?.dna || {}, {
        subjectLabel: subject?.label || String.fromCharCode(65 + index),
        fieldLocks: subject?.field_locks || (index === 0 ? fieldLocks : {}),
        sectionLocks,
        raunch,
      }));
    });
  } else {
    items = collectSubjectItems(dna, { fieldLocks, sectionLocks, raunch });
  }

  const byKey = new Map();
  items.forEach((item) => {
    if (!byKey.has(item.key)) byKey.set(item.key, item);
  });
  const unique = Array.from(byKey.values());
  const mustMatch = unique.filter((item) => item.priority === "must");
  const important = unique.filter((item) => item.priority === "important");
  const detail = unique.filter((item) => item.priority === "detail");

  return {
    mustMatch,
    important,
    detail,
    counts: {
      mustMatch: mustMatch.length,
      important: important.length,
      detail: detail.length,
    },
  };
}

export function requirementPresent(text, item) {
  const haystack = normalize(text);
  if (!haystack || !item) return false;
  return (item.matchTerms || []).some((term) => term && haystack.includes(term));
}

function clauseRank(clause, plan) {
  const normalized = normalize(clause);
  if (/^(score \d|rating )/.test(normalized)) return -1;
  const matches = (item) => (item.matchTerms || []).some((term) => term && normalized.includes(term));
  if ((plan.mustMatch || []).some(matches)) return 0;
  if ((plan.important || []).some(matches)) return 1;
  return 2;
}

const wordCount = (value) => clean(value).split(/\s+/).filter(Boolean).length;

function fallbackSegments(plan) {
  return [
    ...(plan.mustMatch || []).map((item) => ({ text: item.phrase, rank: 0, source: item.key })),
    ...(plan.important || []).map((item) => ({ text: item.phrase, rank: 1, source: item.key })),
  ];
}

export function prioritizePrompt(basePositive = "", plan = emptyPromptPriorityPlan(), family = "standard", options = {}) {
  const budgetWords = Number(options.budgetWords || PROMPT_BUDGET_WORDS[family] || PROMPT_BUDGET_WORDS.standard);
  const extraLead = Array.isArray(options.extraLead) ? options.extraLead : [options.extraLead].filter(Boolean);
  const baseSegments = clean(basePositive).split(/,\s*/).filter(Boolean).map((text, index) => ({
    text,
    rank: clauseRank(text, plan),
    index,
  }));

  const presentBase = new Set();
  [...(plan.mustMatch || []), ...(plan.important || [])].forEach((item) => {
    if (requirementPresent(basePositive, item)) presentBase.add(item.key);
  });

  const fallbacks = fallbackSegments(plan).filter((segment) => !presentBase.has(segment.source));
  const segments = [
    ...extraLead.filter(Boolean).map((text, index) => ({ text: clean(text), rank: -1, index: -1000 + index })),
    ...baseSegments,
    ...fallbacks.map((segment, index) => ({ ...segment, index: 10000 + index })),
  ]
    .filter((segment) => segment.text)
    .sort((a, b) => (a.rank - b.rank) || (a.index - b.index));

  const seen = new Set();
  const kept = [];
  const omitted = [];
  let usedWords = 0;

  segments.forEach((segment) => {
    const key = normalize(segment.text);
    if (!key || seen.has(key)) return;
    seen.add(key);
    const segmentWords = wordCount(segment.text);
    if (segment.rank <= 0 || usedWords + segmentWords <= budgetWords) {
      kept.push(segment.text);
      usedWords += segmentWords;
    } else {
      omitted.push(segment.text);
    }
  });

  const positive = kept.join(", ");
  const droppedClauses = [...(plan.important || []), ...(plan.detail || [])]
    .filter((item) => !requirementPresent(positive, item))
    .map((item) => ({
      key: item.key,
      label: item.label,
      value: item.value,
      priority: item.priority,
    }));

  return {
    positive,
    droppedClauses,
    promptBudget: budgetWords,
    promptWords: usedWords,
    omittedClauseCount: omitted.length,
  };
}
