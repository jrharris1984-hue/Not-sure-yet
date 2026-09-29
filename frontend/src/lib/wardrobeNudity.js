export function wardrobeNudity(wardrobe = {}) {
  const level = Math.max(0, Math.min(100, Number(wardrobe.nudity_level) || 0));
  const selectedOutfit = `${wardrobe.outfit_set || ""} ${wardrobe.outfit_preset || ""} ${wardrobe.underwear || ""}`;
  const keepLingerie = wardrobe.nudity_outfit === "keep lingerie" && level >= 55
    && /lingerie|bra|panties|corset|negligee|bodysuit|robe|garter|slip|underwear|thong/i.test(selectedOutfit);
  const direction = level >= 80
    ? keepLingerie ? "partially nude, selected lingerie worn open or shifted to expose skin" : "fully nude, no clothing except selected accessories and hosiery"
    : level >= 55
      ? keepLingerie ? "partially nude, selected lingerie worn open or shifted to expose skin" : "partially nude with exposed skin"
      : level >= 30 ? "revealing clothing with some skin visible"
      : level > 0 ? "clothed with a modestly suggestive look" : "";
  return { level, direction, suppressClothing: level >= 55 && !keepLingerie, keepLingerie };
}
