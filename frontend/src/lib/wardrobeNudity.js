import {coverageOption} from './coverageCatalog';
export const EXPOSURE_CHOICES = [
  "use selected outfit", "slightly revealing", "revealing outfit",
  "lingerie showing", "lingerie only",
  "open or shifted outfit", "partially nude", "nude",
];

export const COVERAGE_BEHAVIORS = [...EXPOSURE_CHOICES, 'replace outfit', 'topless', 'bottomless'];

export function withCoveragePrompt(wardrobe = {}, config) {
  const option = coverageOption(wardrobe.exposure_mode, config);
  if (!option) return {...wardrobe, _exposurePrompt:{mode:wardrobe.exposure_mode, missing:true}};
  const custom = String(option.value).startsWith('custom_');
  return {...wardrobe, _exposurePrompt:{mode:option.value,
    behavior:custom ? option.coverage_mode || 'use selected outfit' : option.value,
    text:option.keywords?.trim() || (custom ? option.label : EXPOSURE_PROMPTS[option.value] || ''),
    short:option.short?.trim(), short_tags:option.short_tags?.trim()}};
}

export function coverageBehavior(wardrobe) {
  const option = wardrobe._exposurePrompt?.missing ? undefined : coverageOption(wardrobe.exposure_mode);
  const metadata = wardrobe._exposurePrompt?.mode === wardrobe.exposure_mode ? wardrobe._exposurePrompt : null;
  return metadata?.behavior || option?.coverage_mode || wardrobe.exposure_mode;
}

export const EXPOSURE_PROMPTS = {
  "use selected outfit": "",
  "slightly revealing": "selected outfit with modestly revealing coverage",
  "revealing outfit": "revealing clothing with some skin visible",
  "lingerie showing": "selected outfit open enough to reveal lingerie underneath",
  "lingerie only": "lingerie only, no outer clothing",
  "open or shifted outfit": "partially nude, selected outfit worn open or shifted to expose skin",
  "partially nude": "partially nude, some clothing remains on the body covering part of it, never fully undressed",
  nude: "fully nude, no clothing except selected accessories and hosiery",
};
export function wardrobeExposure(wardrobe = {}) {
  if (wardrobe.set_lingerie_mode === 'none' && (wardrobe.outfit_mode === 'full' || (!wardrobe.outfit_mode && wardrobe.outfit_set))
      && ['lingerie showing', 'lingerie only'].includes(coverageBehavior(wardrobe))) return 'use selected outfit';
  if (EXPOSURE_CHOICES.includes(wardrobe.exposure_mode)) return wardrobe.exposure_mode;
  if (String(wardrobe.exposure_mode || '').startsWith('custom_') && !wardrobe._exposurePrompt?.missing && (coverageOption(wardrobe.exposure_mode) || wardrobe._exposurePrompt?.mode === wardrobe.exposure_mode)) return wardrobe.exposure_mode;
  // Interpret saved recipes without mutating them. New selections override these fields.
  const level = Math.max(0, Math.min(100, Number(wardrobe.nudity_level) || 0));
  if (level >= 55 && wardrobe.nudity_outfit === "keep lingerie") return "open or shifted outfit";
  return level >= 80 ? "nude" : level >= 55 ? "partially nude"
    : level >= 30 ? "revealing outfit" : level > 0 ? "slightly revealing" : "use selected outfit";
}

export function wardrobeNudity(wardrobe = {}) {
  const selection = wardrobeExposure(wardrobe);
  const metadata = wardrobe._exposurePrompt?.mode === selection ? wardrobe._exposurePrompt : null;
  const option = wardrobe._exposurePrompt?.missing ? undefined : coverageOption(selection);
  const mode = EXPOSURE_CHOICES.includes(selection) ? selection : metadata?.behavior || option?.coverage_mode || 'use selected outfit';
  const direction = metadata?.text ?? (option?.keywords?.trim() || (String(selection).startsWith('custom_') ? option?.label : EXPOSURE_PROMPTS[mode]) || '');

  return {
    mode, selection, direction: direction + (["lingerie showing", "lingerie only"].includes(mode) && wardrobe.underwear && wardrobe.underwear !== "none" ? `, ${wardrobe.underwear}` : ""),
    level: { "use selected outfit": 0, "slightly revealing": 15, "revealing outfit": 40,
      "lingerie showing": 35, "lingerie only": 50, "open or shifted outfit": 60, "partially nude": 60, nude: 100, "replace outfit":40, topless:60, bottomless:60 }[mode],
    suppressClothing: ["nude", "replace outfit"].includes(mode),
    removeUpper: mode === "topless", removeLower: mode === "bottomless",
    keepLingerie: mode === "open or shifted outfit",
  };
}
