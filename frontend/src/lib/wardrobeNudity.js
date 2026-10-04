export const EXPOSURE_CHOICES = [
  "use selected outfit", "slightly revealing", "revealing outfit",
  "open or shifted outfit", "partially nude", "nude",
];

export function wardrobeExposure(wardrobe = {}) {
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
    "open or shifted outfit": "partially nude, selected outfit worn open or shifted to expose skin",
    "partially nude": "partially nude with exposed skin",
    nude: "fully nude, no clothing except selected accessories and hosiery",
  };
  return {
    mode, direction: directions[mode],
    level: { "use selected outfit": 0, "slightly revealing": 15, "revealing outfit": 40,
      "open or shifted outfit": 60, "partially nude": 60, nude: 100 }[mode],
    suppressClothing: ["partially nude", "nude"].includes(mode),
    keepLingerie: mode === "open or shifted outfit",
  };
}
