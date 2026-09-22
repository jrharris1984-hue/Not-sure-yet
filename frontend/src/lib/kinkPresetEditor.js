const clone = (value) => JSON.parse(JSON.stringify(value || {}));

export const KINK_EDITOR_SECTIONS = [
  ["kink", "Kink details"],
  ["watersports", "Watersports"],
  ["feet", "Feet"],
  ["intimate", "Fluids / intimate details"],
  ["pose", "Pose and camera"],
  ["face", "Expression"],
  ["wardrobe", "Wardrobe"],
  ["scene", "Scene"],
  ["lighting", "Lighting"],
  ["scenario", "Scenario and acts"],
];

export function presetSectionOptions(preset = {}) {
  return Object.fromEntries(KINK_EDITOR_SECTIONS.map(([key]) => [key, !!preset?.dna?.[key]]));
}

export function applyAdjustedKinkPreset(baseDna = {}, preset = {}, options = {}) {
  const out = clone(baseDna);
  const patch = clone(preset.dna);
  const enabled = options.sections || presetSectionOptions(preset);

  Object.entries(patch).forEach(([sectionKey, fields]) => {
    if (!enabled[sectionKey]) return;
    out[sectionKey] = { ...(out[sectionKey] || {}), ...(fields || {}) };
  });

  out.scenario = { ...(out.scenario || {}) };
  if (options.explicitLevel != null) out.scenario.explicit_level = Number(options.explicitLevel);
  if (options.kinkLevel != null) out.scenario.kink_level = Number(options.kinkLevel);

  if (options.powerDynamic && options.powerDynamic !== "preserve") {
    out.kink = { ...(out.kink || {}) };
    if (options.powerDynamic === "preset") {
      if (patch.kink?.power_dynamic) out.kink.power_dynamic = patch.kink.power_dynamic;
    } else out.kink.power_dynamic = options.powerDynamic;
  } else if (options.powerDynamic === "preserve" && baseDna?.kink) {
    out.kink = { ...(out.kink || {}), power_dynamic: baseDna.kink.power_dynamic };
  }

  if (options.restraintMode) {
    out.kink = { ...(out.kink || {}) };
    const presetRestraints = Array.isArray(patch.kink?.restraint) ? patch.kink.restraint : [];
    if (options.restraintMode === "preserve") out.kink.restraint = clone(baseDna?.kink?.restraint || []);
    else if (options.restraintMode === "none") out.kink.restraint = [];
    else if (options.restraintMode === "light") out.kink.restraint = presetRestraints.slice(0, 1);
    else if (options.restraintMode === "moderate") out.kink.restraint = presetRestraints.slice(0, 2);
    else if (options.restraintMode === "preset") out.kink.restraint = presetRestraints;
  }

  if (options.role && options.role !== "preset") {
    if (options.role === "preserve") out.scenario.roleplay = baseDna?.scenario?.roleplay;
    else out.scenario.roleplay = options.role === "none" ? "" : options.role;
  }

  if (options.position && options.position !== "preset") {
    out.pose = { ...(out.pose || {}) };
    if (options.position !== "preserve") out.pose.action = options.position;
    else out.pose.action = baseDna?.pose?.action;
  }
  if (options.expression && options.expression !== "preset") {
    out.face = { ...(out.face || {}) };
    if (options.expression !== "preserve") out.face.expression = options.expression;
    else out.face.expression = baseDna?.face?.expression;
  }
  if (options.mood && options.mood !== "preset") {
    out.lighting = { ...(out.lighting || {}) };
    if (options.mood !== "preserve") out.lighting.mood = options.mood;
    else out.lighting.mood = baseDna?.lighting?.mood;
  }
  return out;
}

export function kinkPresetChangeSummary(preset = {}, sections = {}) {
  return KINK_EDITOR_SECTIONS
    .filter(([key]) => sections[key] && preset?.dna?.[key])
    .map(([, label]) => label);
}
