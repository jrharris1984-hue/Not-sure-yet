export const EXPOSURE_CHOICES = [
  "use selected outfit", "slightly revealing", "revealing outfit",
  "lingerie showing", "lingerie only",
  "open or shifted outfit", "partially nude", "nude",
];

export function wardrobeExposure(wardrobe = {}) {
  if (wardrobe.set_lingerie_mode === 'none' && (wardrobe.outfit_mode === 'full' || (!wardrobe.outfit_mode && wardrobe.outfit_set))
      && ['lingerie showing', 'lingerie only'].includes(wardrobe.exposure_mode)) return 'use selected outfit';
  if (EXPOSURE_CHOICES.includes(wardrobe.exposure_mode)) return wardrobe.exposure_mode;
  // Interpret saved recipes without mutating them. New selections override these fields.
  const level = Math.max(0, Math.min(100, Number(wardrobe.nudity_level) || 0));
  if (level >= 55 && wardrobe.nudity_outfit === "keep lingerie") return "open or shifted outfit";
  return level >= 80 ? "nude" : level >= 55 ? "partially nude"
    : level >= 30 ? "revealing outfit" : level > 0 ? "slightly revealing" : "use selected outfit";
}

export function wardrobeNudity(wardrobe = {}) {
  const mode = wardrobeExposure(wardrobe);
  const directions = {
    "use selected outfit": "",
    "slightly revealing": "selected outfit with modestly revealing coverage",
    "revealing outfit": "revealing clothing with some skin visible",
    "lingerie showing": "selected outfit open enough to reveal lingerie underneath",
    "lingerie only": "lingerie only, no outer clothing",
    "open or shifted outfit": "partially nude, selected outfit worn open or shifted to expose skin",
    "partially nude": "partially nude, some clothing remains on the body covering part of it, never fully undressed",
    nude: "fully nude, no clothing except selected accessories and hosiery",
  };
  return {
    mode, direction: directions[mode] + (["lingerie showing", "lingerie only"].includes(mode) && wardrobe.underwear && wardrobe.underwear !== "none" ? `, ${wardrobe.underwear}` : ""),
    level: { "use selected outfit": 0, "slightly revealing": 15, "revealing outfit": 40,
      "lingerie showing": 35, "lingerie only": 50, "open or shifted outfit": 60, "partially nude": 60, nude: 100 }[mode],
    suppressClothing: mode === "nude",
    keepLingerie: mode === "open or shifted outfit",
  };
}
