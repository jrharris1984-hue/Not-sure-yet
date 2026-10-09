import { CAMERA_VARIATIONS } from "@/lib/batchCameraVariation";
import { sharedPoseGroups } from "@/lib/promptCatalog";
import { PHOTOGRAPHY_POSE_GROUPS, photographyPosePrompt } from "@/lib/photographyPoses";

const EXPRESSIONS = ["neutral", "smirk", "smile", "serious", "sultry", "laughing"];
const SMART_SHARED_GROUP = /portrait|interaction|movement|seated|angle|composition|candid/i;
const BLOCKED_SHARED_GROUP = /explicit|specialty|sex|fetish|kink|adult|nsfw/i;
const normalize = value => String(value || "").replace(/\s+/g, " ").trim();

export const SMART_VARIATION_STRENGTHS = [
  ["subtle", "Subtle"],
  ["balanced", "Balanced"],
  ["bold", "Bold"],
];

const shot = (title, poseGroup, framing, camera, expression) => ({
  title, poseGroup, framing, camera, expression,
});

export const SMART_SHOOT_CATEGORIES = [
  {
    key: "portrait",
    label: "Portrait",
    presets: [
      {
        key: "classic_portrait",
        label: "Classic Portrait",
        description: "Clean portrait coverage with a balanced hero, close portrait and relaxed alternate.",
        sequence: [
          shot("Hero", /portrait standing|portrait/i, "full body", /front|3\/4/i, "neutral"),
          shot("Portrait", /portrait standing|portrait seated|portrait/i, "waist-up", /3\/4|front/i, "smile"),
          shot("Relaxed", /relaxed leaning|portrait/i, "thigh-up", /eye-level|3\/4/i, "smirk"),
          shot("Seated", /portrait seated|seated/i, "thigh-up", /eye-level/i, "neutral"),
          shot("Profile", /portrait standing|angles|portrait/i, "full body", /profile/i, "serious"),
          shot("Finale", /portrait standing|portrait/i, "full body", /front|3\/4/i, "smile"),
        ],
      },
      {
        key: "headshot",
        label: "Headshot Session",
        description: "Tighter professional portrait coverage with subtle camera and expression changes.",
        sequence: [
          shot("Clean headshot", /portrait standing|portrait seated|portrait/i, "portrait", /front/i, "neutral"),
          shot("Three-quarter", /portrait standing|portrait seated|portrait/i, "portrait", /3\/4/i, "smile"),
          shot("Serious", /portrait standing|portrait seated|portrait/i, "waist-up", /front/i, "serious"),
          shot("Relaxed", /relaxed leaning|portrait/i, "waist-up", /3\/4/i, "smirk"),
          shot("High angle", /portrait standing|portrait seated|portrait/i, "portrait", /high angle/i, "smile"),
          shot("Final headshot", /portrait standing|portrait seated|portrait/i, "portrait", /front|3\/4/i, "neutral"),
        ],
      },
    ],
  },
  {
    key: "fashion",
    label: "Fashion & Editorial",
    presets: [
      {
        key: "editorial",
        label: "Editorial",
        description: "Magazine-style hero, seated, movement and alternate compositions.",
        sequence: [
          shot("Hero", /portrait standing|portrait/i, "full body", /front|3\/4/i, "neutral"),
          shot("Portrait", /portrait standing|portrait seated|portrait/i, "waist-up", /3\/4/i, "serious"),
          shot("Relaxed", /relaxed leaning|interaction|candid/i, "thigh-up", /eye-level|3\/4/i, "smirk"),
          shot("Movement", /natural movement|movement/i, "full body", /3\/4|front/i, "smile"),
          shot("Alternate", /portrait standing|angles|portrait/i, "full body", /profile|low angle/i, "neutral"),
          shot("Finale", /portrait standing|portrait|composition/i, "full body", /front|3\/4/i, "serious"),
        ],
      },
      {
        key: "lookbook",
        label: "Fashion Lookbook",
        description: "Full-body outfit coverage with clean, repeatable modeling angles.",
        sequence: [
          shot("Front look", /portrait standing|portrait/i, "full body", /front/i, "neutral"),
          shot("Quarter turn", /portrait standing|portrait/i, "full body", /3\/4/i, "serious"),
          shot("Stride", /natural movement|movement/i, "full body", /3\/4|front/i, "neutral"),
          shot("Profile look", /portrait standing|angles/i, "full body", /profile/i, "neutral"),
          shot("Seated look", /portrait seated|seated/i, "full body", /eye-level/i, "neutral"),
          shot("Campaign hero", /portrait standing|portrait|composition/i, "full body", /low angle|3\/4/i, "serious"),
        ],
      },
      {
        key: "runway",
        label: "Runway / Model Test",
        description: "Strong full-length coverage with movement and model-test variety.",
        sequence: [
          shot("Model test", /portrait standing|portrait/i, "full body", /front/i, "neutral"),
          shot("Walk", /natural movement|movement/i, "full body", /front|3\/4/i, "serious"),
          shot("Turn", /natural movement|angles|portrait/i, "full body", /3\/4|profile/i, "neutral"),
          shot("Low-angle look", /portrait standing|portrait/i, "full body", /low angle/i, "serious"),
          shot("Profile", /portrait standing|angles/i, "full body", /profile/i, "neutral"),
          shot("Final walk", /natural movement|movement/i, "full body", /3\/4/i, "serious"),
        ],
      },
    ],
  },
  {
    key: "lifestyle",
    label: "Lifestyle",
    presets: [
      {
        key: "casual_candid",
        label: "Casual Candid",
        description: "Relaxed movement, sitting and natural-looking in-between moments.",
        sequence: [
          shot("Arrival", /natural movement|movement|candid/i, "full body", /front|3\/4/i, "smile"),
          shot("Walking", /natural movement|movement/i, "full body", /3\/4/i, "smile"),
          shot("Lean", /relaxed leaning|interaction|candid/i, "thigh-up", /eye-level/i, "smirk"),
          shot("Seated break", /portrait seated|seated/i, "thigh-up", /eye-level/i, "smile"),
          shot("Turn", /natural movement|angles|candid/i, "full body", /3\/4|over-shoulder/i, "neutral"),
          shot("Candid finale", /interaction|portrait|candid/i, "waist-up", /eye-level|3\/4/i, "laughing"),
        ],
      },
      {
        key: "street_style",
        label: "Street Style",
        description: "Urban full-body and movement coverage with stronger camera angles.",
        sequence: [
          shot("Street hero", /portrait standing|portrait/i, "full body", /front|low angle/i, "serious"),
          shot("Walk", /natural movement|movement/i, "full body", /3\/4/i, "neutral"),
          shot("Wall lean", /relaxed leaning|portrait/i, "thigh-up", /3\/4/i, "smirk"),
          shot("Profile", /portrait standing|angles/i, "full body", /profile/i, "serious"),
          shot("High alternate", /portrait standing|portrait/i, "full body", /high angle/i, "neutral"),
          shot("Street finale", /natural movement|portrait/i, "full body", /low angle|3\/4/i, "serious"),
        ],
      },
    ],
  },
  {
    key: "glamour",
    label: "Glamour & Boudoir",
    presets: [
      {
        key: "glamour",
        label: "Glamour",
        description: "Polished confident posing with portrait, seated and hero coverage.",
        sequence: [
          shot("Glamour hero", /portrait standing|portrait/i, "full body", /3\/4|front/i, "sultry"),
          shot("Close glamour", /portrait standing|portrait seated|portrait/i, "waist-up", /eye-level|3\/4/i, "smirk"),
          shot("Lean", /relaxed leaning|interaction/i, "thigh-up", /3\/4/i, "sultry"),
          shot("Seated", /portrait seated|seated/i, "thigh-up", /eye-level/i, "neutral"),
          shot("Low-angle", /portrait standing|portrait/i, "full body", /low angle/i, "serious"),
          shot("Finale", /portrait standing|portrait/i, "full body", /front|3\/4/i, "sultry"),
        ],
      },
      {
        key: "boudoir",
        label: "Boudoir",
        description: "Soft, intimate editorial coverage with elegant seated, reclining and close portrait direction.",
        sequence: [
          shot("Boudoir hero", /portrait standing|relaxed leaning|portrait/i, "full body", /3\/4|eye-level/i, "sultry"),
          shot("Soft portrait", /portrait standing|portrait seated|portrait/i, "waist-up", /3\/4|front/i, "smirk"),
          shot("Seated intimate", /portrait seated|seated/i, "thigh-up", /eye-level/i, "sultry"),
          shot("Reclined mood", /relaxed leaning|portrait seated|portrait/i, "full body", /3\/4|high angle/i, "neutral"),
          shot("Over-shoulder", /angles|portrait standing|portrait/i, "thigh-up", /over-shoulder|3\/4/i, "sultry"),
          shot("Boudoir finale", /portrait standing|relaxed leaning|portrait/i, "full body", /front|3\/4/i, "smirk"),
        ],
      },
      {
        key: "pinup",
        label: "Classic Pin-Up",
        description: "Playful retro-inspired poses with confident full-body coverage and expressive portrait beats.",
        sequence: [
          shot("Pin-up hero", /portrait standing|portrait/i, "full body", /front|3\/4/i, "smile"),
          shot("Playful quarter turn", /portrait standing|angles|portrait/i, "full body", /3\/4/i, "smirk"),
          shot("Seated pin-up", /portrait seated|seated/i, "thigh-up", /eye-level/i, "smile"),
          shot("Candid tease", /interaction|candid|relaxed leaning/i, "waist-up", /3\/4|eye-level/i, "laughing"),
          shot("Profile pose", /portrait standing|angles/i, "full body", /profile/i, "smile"),
          shot("Poster finale", /portrait standing|portrait|composition/i, "full body", /front|low angle/i, "smirk"),
        ],
      },
      {
        key: "old_hollywood",
        label: "Old Hollywood",
        description: "Elegant vintage glamour with dramatic portraits, poised seated shots and cinematic hero framing.",
        sequence: [
          shot("Hollywood hero", /portrait standing|portrait/i, "full body", /3\/4|low angle/i, "serious"),
          shot("Close glamour", /portrait standing|portrait seated|portrait/i, "portrait", /3\/4|front/i, "neutral"),
          shot("Poised seated", /portrait seated|seated/i, "thigh-up", /eye-level/i, "serious"),
          shot("Profile light", /portrait standing|angles/i, "waist-up", /profile/i, "neutral"),
          shot("High-drama alternate", /portrait standing|portrait/i, "full body", /high angle|3\/4/i, "serious"),
          shot("Silver-screen finale", /portrait standing|portrait/i, "full body", /front|3\/4/i, "smile"),
        ],
      },
      {
        key: "fifties_pinup",
        label: "1950s Pin-Up",
        description: "Bright mid-century pin-up styling with playful poster poses, seated glamour and cheerful full-body coverage.",
        sequence: [
          shot("Poster hero", /portrait standing|portrait/i, "full body", /front|3\/4/i, "smile"),
          shot("Waist-up charm", /portrait standing|portrait/i, "waist-up", /3\/4|eye-level/i, "smirk"),
          shot("Seated pin-up", /portrait seated|seated/i, "thigh-up", /eye-level/i, "smile"),
          shot("Playful lean", /relaxed leaning|candid|interaction/i, "full body", /3\/4/i, "laughing"),
          shot("Profile poster", /portrait standing|angles/i, "full body", /profile/i, "smile"),
          shot("Calendar finale", /portrait standing|portrait|composition/i, "full body", /front|low angle/i, "smirk"),
        ],
      },
      {
        key: "eighties_glamour",
        label: "1980s Glamour",
        description: "Bold retro glamour with stronger angles, confident posing and high-energy campaign-style coverage.",
        sequence: [
          shot("Power hero", /portrait standing|portrait/i, "full body", /low angle|front/i, "serious"),
          shot("Studio close-up", /portrait standing|portrait seated|portrait/i, "waist-up", /3\/4/i, "smirk"),
          shot("Power lean", /relaxed leaning|portrait/i, "thigh-up", /3\/4|low angle/i, "serious"),
          shot("Seated glamour", /portrait seated|seated/i, "thigh-up", /eye-level/i, "sultry"),
          shot("Profile campaign", /portrait standing|angles/i, "full body", /profile|high angle/i, "neutral"),
          shot("Neon-era finale", /portrait standing|movement|portrait/i, "full body", /front|3\/4/i, "smile"),
        ],
      },
      {
        key: "beauty",
        label: "Beauty Campaign",
        description: "Closer beauty-focused coverage with subtle pose and expression variation.",
        sequence: [
          shot("Beauty hero", /portrait standing|portrait seated|portrait/i, "waist-up", /front/i, "neutral"),
          shot("Three-quarter beauty", /portrait standing|portrait seated|portrait/i, "portrait", /3\/4/i, "smile"),
          shot("Soft serious", /portrait standing|portrait seated|portrait/i, "portrait", /front/i, "serious"),
          shot("Lean close", /relaxed leaning|portrait/i, "waist-up", /3\/4/i, "smirk"),
          shot("High beauty", /portrait standing|portrait seated|portrait/i, "portrait", /high angle/i, "neutral"),
          shot("Campaign finish", /portrait standing|portrait seated|portrait/i, "waist-up", /front|3\/4/i, "smile"),
        ],
      },
    ],
  },
  {
    key: "cinematic",
    label: "Cinematic",
    presets: [
      {
        key: "cinematic_story",
        label: "Cinematic Story",
        description: "Wide establishing coverage, movement and dramatic alternate angles.",
        sequence: [
          shot("Establishing", /portrait standing|movement|portrait/i, "wide shot", /front|3\/4/i, "neutral"),
          shot("Hero", /portrait standing|portrait/i, "full body", /low angle|3\/4/i, "serious"),
          shot("Movement", /natural movement|movement/i, "full body", /3\/4/i, "neutral"),
          shot("Close story beat", /portrait standing|portrait seated|portrait/i, "waist-up", /eye-level/i, "serious"),
          shot("Alternate", /angles|portrait standing|portrait/i, "full body", /high angle|profile/i, "neutral"),
          shot("Final frame", /portrait standing|portrait|composition/i, "wide shot", /front|3\/4/i, "serious"),
        ],
      },
      {
        key: "dramatic",
        label: "Dramatic Portrait",
        description: "Stronger low/high angles and serious portrait coverage.",
        sequence: [
          shot("Dramatic hero", /portrait standing|portrait/i, "full body", /low angle/i, "serious"),
          shot("Close dramatic", /portrait standing|portrait seated|portrait/i, "waist-up", /3\/4/i, "serious"),
          shot("Profile", /portrait standing|angles/i, "thigh-up", /profile/i, "neutral"),
          shot("Seated tension", /portrait seated|seated/i, "thigh-up", /eye-level/i, "serious"),
          shot("High alternate", /portrait standing|portrait/i, "full body", /high angle/i, "neutral"),
          shot("Final hero", /portrait standing|portrait/i, "full body", /low angle|3\/4/i, "serious"),
        ],
      },
    ],
  },
  {
    key: "professional",
    label: "Professional",
    presets: [
      {
        key: "corporate",
        label: "Corporate / Branding",
        description: "Approachable professional coverage for profiles, websites and branding.",
        sequence: [
          shot("Brand hero", /portrait standing|portrait/i, "full body", /front/i, "neutral"),
          shot("Professional portrait", /portrait standing|portrait seated|portrait/i, "waist-up", /3\/4/i, "smile"),
          shot("Confident standing", /portrait standing|portrait/i, "thigh-up", /front|3\/4/i, "serious"),
          shot("Seated professional", /portrait seated|seated/i, "thigh-up", /eye-level/i, "neutral"),
          shot("Relaxed branding", /relaxed leaning|portrait/i, "waist-up", /3\/4/i, "smile"),
          shot("Profile finish", /portrait standing|portrait/i, "portrait", /front|3\/4/i, "neutral"),
        ],
      },
    ],
  },
  {
    key: "fitness",
    label: "Fitness & Movement",
    presets: [
      {
        key: "fitness",
        label: "Fitness",
        description: "Full-body movement and athletic-feeling coverage with clear form.",
        sequence: [
          shot("Athletic hero", /portrait standing|portrait/i, "full body", /front|3\/4/i, "serious"),
          shot("Movement", /natural movement|movement/i, "full body", /3\/4/i, "neutral"),
          shot("Low-angle strength", /portrait standing|portrait/i, "full body", /low angle/i, "serious"),
          shot("Side profile", /portrait standing|angles/i, "full body", /profile/i, "neutral"),
          shot("Recovery", /portrait seated|relaxed leaning|seated/i, "thigh-up", /eye-level/i, "neutral"),
          shot("Final athletic", /portrait standing|movement|portrait/i, "full body", /front|3\/4/i, "serious"),
        ],
      },
    ],
  },
  {
    key: "group",
    label: "Couples & Groups",
    presets: [
      {
        key: "duo_editorial",
        label: "Duo Editorial",
        description: "Structured two-person coverage using compatible shared poses.",
        sequence: [
          shot("Pair hero", /portrait|composition/i, "wide shot", /front/i, "neutral"),
          shot("Three-quarter pair", /portrait|interaction/i, "full body", /3\/4/i, "neutral"),
          shot("Interaction", /interaction/i, "thigh-up", /eye-level|3\/4/i, "smile"),
          shot("Movement", /movement/i, "wide shot", /3\/4/i, "smile"),
          shot("Seated pair", /seated/i, "full body", /eye-level/i, "neutral"),
          shot("Pair finale", /portrait|angles|composition/i, "wide shot", /front|3\/4/i, "neutral"),
        ],
      },
      {
        key: "group_portrait",
        label: "Group Portrait",
        description: "Balanced group composition with portrait, seated and candid coverage.",
        sequence: [
          shot("Group hero", /portrait|composition/i, "wide shot", /front/i, "neutral"),
          shot("Staggered group", /composition|portrait/i, "wide shot", /3\/4/i, "neutral"),
          shot("Group interaction", /interaction|candid/i, "wide shot", /eye-level/i, "smile"),
          shot("Seated group", /seated/i, "wide shot", /eye-level/i, "neutral"),
          shot("Movement", /movement/i, "wide shot", /3\/4/i, "smile"),
          shot("Group finale", /portrait|composition|angles/i, "wide shot", /front|3\/4/i, "neutral"),
        ],
      },
    ],
  },
];

export const SMART_PHOTOSHOOT_PRESETS = Object.fromEntries(
  SMART_SHOOT_CATEGORIES.flatMap(category =>
    category.presets.map(preset => [preset.key, { ...preset, category: category.key, categoryLabel: category.label }])
  )
);

const REGEX_SPECIALS = new Set(["\\", "^", "$", ".", "|", "?", "*", "+", "(", ")", "[", "]", "{", "}"]);
const escapeRegex = value => [...String(value || "")].map(char => REGEX_SPECIALS.has(char) ? `\\${char}` : char).join("");
const matcherFromText = value => {
  const parts = String(value || "").split("|").map(part => part.trim()).filter(Boolean);
  return parts.length ? new RegExp(parts.map(escapeRegex).join("|"), "i") : null;
};

export const CUSTOM_POSE_GROUP_OPTIONS = [
  ["", "Any compatible pose"],
  ["portrait standing|portrait", "Standing / portrait"],
  ["portrait seated|seated", "Seated"],
  ["relaxed leaning", "Leaning"],
  ["natural movement|movement", "Movement"],
  ["interaction|candid", "Interaction / candid"],
  ["angles|composition", "Angles / composition"],
];

export const CUSTOM_CAMERA_OPTIONS = [
  ["", "Any compatible camera"],
  ["front", "Front"],
  ["3/4", "Three-quarter"],
  ["profile", "Profile"],
  ["eye-level", "Eye-level"],
  ["low angle", "Low angle"],
  ["high angle", "High angle"],
  ["over-shoulder", "Over shoulder"],
];

export const CUSTOM_FRAMING_OPTIONS = ["", "close-up", "portrait", "waist-up", "thigh-up", "knees-up", "full body", "wide shot", "detail shot"];
export const CUSTOM_EXPRESSION_OPTIONS = ["", ...EXPRESSIONS];

// Snapshot the actual planned choices rather than re-randomizing a saved shoot.
export function photoshootPresetFromPlan(plan, label) {
  return {
    key: '', label: `${label || 'My Photoshoot'} plan`, category: 'Saved plans', description: '',
    sequence: plan.map(item => ({
      title: item.title || 'Shot', pose_group: '', camera_match: '',
      framing: item.framing || '', expression: item.expression || '',
      pose_prompt: item.pose?.value || '', pose_label: item.pose?.label || '',
      camera_pose_angle: item.camera?.poseAngle || '', camera_angle: item.camera?.cameraAngle || '',
    })),
  };
}

export function normalizeCustomPhotoshootPreset(preset = {}) {
  return {
    key: String(preset.key || "").trim(),
    label: String(preset.label || "Custom Photoshoot").trim(),
    category: String(preset.category || "Custom").trim() || "Custom",
    categoryLabel: String(preset.category || "Custom").trim() || "Custom",
    description: String(preset.description || "").trim(),
    custom: true,
    sequence: (Array.isArray(preset.sequence) ? preset.sequence : []).map(item => ({
      title: String(item.title || "Shot").trim() || "Shot",
      poseGroup: matcherFromText(item.pose_group),
      camera: matcherFromText(item.camera_match),
      framing: String(item.framing || "").trim(),
      expression: String(item.expression || "").trim(),
      raw: {
        ...(Object.hasOwn(item, 'pose_prompt') ? { pose_prompt: String(item.pose_prompt || '').trim(), pose_label: String(item.pose_label || '').trim() } : {}),
        ...(Object.hasOwn(item, 'camera_pose_angle') ? { camera_pose_angle: String(item.camera_pose_angle || '').trim(), camera_angle: String(item.camera_angle || '').trim() } : {}),
        title: String(item.title || "Shot").trim() || "Shot",
        pose_group: String(item.pose_group || "").trim(),
        camera_match: String(item.camera_match || "").trim(),
        framing: String(item.framing || "").trim(),
        expression: String(item.expression || "").trim(),
      },
    })),
  };
}

export function photoshootCatalog(customPresets = []) {
  const custom = (Array.isArray(customPresets) ? customPresets : [])
    .map(normalizeCustomPhotoshootPreset)
    .filter(preset => preset.key && preset.sequence.length);
  const customByCategory = new Map();
  const overrides = Object.fromEntries(custom.map(preset => [preset.key, preset]));
  const builtinCategories = Object.fromEntries(SMART_SHOOT_CATEGORIES.flatMap(category => category.presets.map(preset => [preset.key, category.label])));
  custom.filter(preset => !Object.hasOwn(SMART_PHOTOSHOOT_PRESETS, preset.key) || preset.categoryLabel !== builtinCategories[preset.key]).forEach(preset => {
    const label = preset.categoryLabel || "Custom";
    if (!customByCategory.has(label)) customByCategory.set(label, []);
    customByCategory.get(label).push(preset);
  });
  const categories = SMART_SHOOT_CATEGORIES.map(category => ({
    ...category,
    presets: category.presets.filter(preset => !overrides[preset.key] || overrides[preset.key].categoryLabel === category.label).map(preset => overrides[preset.key] || ({ ...preset, category: category.key, categoryLabel: category.label })),
  }));
  for (const [label, presets] of customByCategory.entries()) {
    categories.push({
      key: `custom-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      label: `My Shoots · ${label}`,
      custom: true,
      presets,
    });
  }
  return {
    categories,
    presets: {
      ...Object.fromEntries(categories.flatMap(category => category.presets).map(preset => [preset.key, preset])),
    },
  };
}

export function resolvePhotoshootPreset(key, customPresets = []) {
  const catalog = photoshootCatalog(customPresets);
  return Object.hasOwn(catalog.presets, key) ? catalog.presets[key] : SMART_PHOTOSHOOT_PRESETS.editorial;
}

function eligibleSharedGroups(count, promptCatalog) {
  return sharedPoseGroups(count, promptCatalog).filter(group => {
    const label = group.label || "";
    return SMART_SHARED_GROUP.test(label) && !BLOCKED_SHARED_GROUP.test(label);
  });
}

function soloPoseGroups() {
  return PHOTOGRAPHY_POSE_GROUPS.map(group => ({
    label: group.name,
    poses: (group.options || []).map(value => ({
      value: photographyPosePrompt(value),
      label: value,
    })),
  }));
}

function poseGroupsFor(count, promptCatalog) {
  return count > 1
    ? eligibleSharedGroups(count, promptCatalog).map(group => ({ label: group.label, poses: group.poses || [] }))
    : soloPoseGroups();
}

function choosePose(groups, shotDef, used, seed, strength = "balanced") {
  if (Object.hasOwn(shotDef?.raw || {}, 'pose_prompt')) return shotDef.raw.pose_prompt
    ? { value: shotDef.raw.pose_prompt, label: shotDef.raw.pose_label || shotDef.raw.pose_prompt } : null;
  const matched = groups.filter(group => !shotDef?.poseGroup || shotDef.poseGroup.test(group.label || ""));
  const source = strength === "bold"
    ? groups
    : matched.length
      ? matched
      : groups;
  const pool = source.flatMap(group => group.poses || [])
    .map(pose => ({
      value: normalize(pose.prompt || pose.value),
      label: pose.label || pose.value,
    }))
    .filter(pose => pose.value && !used.has(normalize(pose.value)));
  if (!pool.length) return null;
  return pool[Math.abs(Math.trunc(seed || 0)) % pool.length];
}

function chooseCamera(shotDef, used, seed, strength = "balanced") {
  if (Object.hasOwn(shotDef?.raw || {}, 'camera_pose_angle')) return shotDef.raw.camera_pose_angle
    ? { poseAngle: shotDef.raw.camera_pose_angle, cameraAngle: shotDef.raw.camera_angle,
        label: `${shotDef.raw.camera_pose_angle} · ${shotDef.raw.camera_angle}` } : null;
  const conservative = CAMERA_VARIATIONS.filter(item =>
    item.cameraAngle === "eye-level" && ["front", "3/4", "profile"].includes(item.poseAngle)
  );
  const matched = CAMERA_VARIATIONS.filter(item => !shotDef?.camera || shotDef.camera.test(item.label || ""));
  const source = strength === "subtle"
    ? (matched.filter(item => conservative.includes(item)).length ? matched.filter(item => conservative.includes(item)) : conservative)
    : strength === "bold"
      ? CAMERA_VARIATIONS
      : (matched.length ? matched : CAMERA_VARIATIONS);
  const pool = source.filter(item => !used.has(item.label));
  if (!pool.length) return null;
  return pool[Math.abs(Math.trunc(seed || 0)) % pool.length];
}

export function buildSmartPhotoshootPlan({
  count = 6,
  subjects = [],
  promptCatalog,
  preset = "editorial",
  seed = 0,
  options = {},
  customPresets = [],
  strength = "balanced",
} = {}) {
  const definition = resolvePhotoshootPreset(preset, customPresets);
  const groups = poseGroupsFor(subjects.length || 1, promptCatalog);
  const usedPoses = new Set();
  const usedCameras = new Set();

  return Array.from({ length: count }, (_, index) => {
    const shotDef = definition.sequence[index % definition.sequence.length];
    const pose = options.pose === false ? null : choosePose(groups, shotDef, usedPoses, seed + index * 104729, strength);
    if (pose) usedPoses.add(normalize(pose.value));
    const camera = options.camera === false ? null : chooseCamera(shotDef, usedCameras, seed + index * 7919, strength);
    if (camera) usedCameras.add(camera.label);

    return {
      index,
      title: shotDef.title,
      pose,
      camera,
      framing: options.framing === false
        ? null
        : strength === "subtle" && !shotDef.raw
          ? (subjects[0]?.dna?.pose?.distance || shotDef.framing)
          : shotDef.framing,
      expression: options.expression === true ? shotDef.expression : null,
    };
  });
}

// Reserve preserved shots first so replacement choices cannot duplicate them.
// If a style has exhausted its compatible choices, retain the previous field.
export function regenerateSmartPhotoshootPlan({ plan = [], index = null, ...config } = {}) {
  const definition = resolvePhotoshootPreset(config.preset, config.customPresets);
  const groups = poseGroupsFor(config.subjects?.length || 1, config.promptCatalog);
  const options = config.options || {};
  const replace = (shot, position) => !shot.kept && (index === null || position === index);
  const preserved = plan.filter((shot, position) => !replace(shot, position));
  const usedPoses = new Set(preserved.map(shot => normalize(shot.pose?.value)).filter(Boolean));
  const usedCameras = new Set(preserved.map(shot => shot.camera?.label).filter(Boolean));

  return plan.map((shot, position) => {
    if (!replace(shot, position)) return shot;
    const shotDef = definition.sequence[position % definition.sequence.length];
    const seed = (config.seed || 0) + position * 104729;
    const pose = options.pose === false ? null : choosePose(groups, shotDef,
      new Set([...usedPoses, normalize(shot.pose?.value)]), seed, config.strength) || shot.pose;
    const camera = options.camera === false ? null : chooseCamera(shotDef,
      new Set([...usedCameras, shot.camera?.label]), seed, config.strength) || shot.camera;
    if (pose) usedPoses.add(normalize(pose.value));
    if (camera) usedCameras.add(camera.label);
    return { ...shot, pose, camera };
  });
}

export function smartPhotoshootVariation({
  subjects = [],
  promptCatalog,
  index = 0,
  seed = 0,
  options = {},
  preset = "editorial",
  plan,
  customPresets = [],
  strength = "balanced",
} = {}) {
  if (!subjects.length) return { subjects, changed: false, plan: {} };

  const planned = plan?.[index] || buildSmartPhotoshootPlan({
    count: Math.max(index + 1, 1),
    subjects,
    promptCatalog,
    preset,
    seed,
    options,
    customPresets,
    strength,
  })[index];

  let nextSubjects = subjects;
  const applied = { title: planned?.title };

  if (options.pose !== false && planned?.pose) {
    nextSubjects = nextSubjects.map(subject => ({
      ...subject,
      dna: {
        ...(subject.dna || {}),
        pose: {
          ...(subject.dna?.pose || {}),
          action: planned.pose.value,
        },
      },
    }));
    applied.pose = planned.pose.label;
  }

  if (options.camera !== false && planned?.camera) {
    nextSubjects = nextSubjects.map(subject => ({
      ...subject,
      dna: {
        ...(subject.dna || {}),
        pose: {
          ...(subject.dna?.pose || {}),
          angle: planned.camera.poseAngle,
        },
        camera: {
          ...(subject.dna?.camera || {}),
          angle: planned.camera.cameraAngle,
        },
      },
    }));
    applied.camera = planned.camera.label;
  }

  if (options.framing !== false && planned?.framing) {
    nextSubjects = nextSubjects.map(subject => ({
      ...subject,
      dna: {
        ...(subject.dna || {}),
        pose: {
          ...(subject.dna?.pose || {}),
          distance: planned.framing,
        },
      },
    }));
    applied.framing = planned.framing;
  }

  if (options.expression === true && planned?.expression) {
    nextSubjects = nextSubjects.map(subject => ({
      ...subject,
      dna: {
        ...(subject.dna || {}),
        face: {
          ...(subject.dna?.face || {}),
          expression: planned.expression,
        },
      },
    }));
    applied.expression = planned.expression;
  }

  return {
    subjects: nextSubjects,
    changed: Object.keys(applied).some(key => key !== "title"),
    plan: applied,
  };
}

export { EXPRESSIONS };
