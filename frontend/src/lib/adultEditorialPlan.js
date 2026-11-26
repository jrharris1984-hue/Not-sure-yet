import { EXPOSURE_CHOICES } from "@/lib/wardrobeNudity";

export const ADULT_EDITORIAL_COVERAGE_STAGES = [
  "use selected outfit",
  "slightly revealing",
  "revealing outfit",
  "open or shifted outfit",
  "lingerie showing",
  "lingerie only",
  "partially nude",
  "nude",
];

export const ADULT_EDITORIAL_TEMPLATES = [
  { key: "editorial-arc", label: "Editorial day-to-night", description: "A polished studio-to-boudoir progression with a balanced editorial wardrobe.", outfits: ["tailored satin evening look layered over coordinated lace lingerie, sheer stockings and high heels", "silk robe over matching lingerie, sheer thigh-high stockings and classic heels", "coordinated lace lingerie set with sheer stockings and high heels", "tasteful fine-art figure study with a draped silk sheet"], environments: ["warm gray seamless studio", "loft window dressing area", "ivory bedroom with chaise", "charcoal fine-art studio"], lighting: ["large softbox key with fill", "soft natural window light", "warm practical lamps with softbox fill", "sculpting strip light and gentle rim"] },
  { key: "boudoir-suite", label: "Private suite boudoir", description: "A cohesive hotel-suite story with window, mirror, bed and lounge chapters.", outfits: ["elegant wrap dress over coordinated lingerie and stockings", "silk dressing robe over matching lingerie, stockings and heels", "lace lingerie set with sheer stockings and heels", "non-explicit fine-art figure study with a sheet draped for coverage"], environments: ["boutique hotel dressing room", "sunlit hotel window and mirror", "cream hotel suite with soft bedding", "quiet shadowed suite with velvet chair"], lighting: ["soft vanity bulbs and fill", "morning window light", "warm bedside lamps with soft fill", "low-key window rim light"] },
  { key: "heels-hosiery", label: "Heels & hosiery editorial", description: "A fashion-led shoe and hosiery feature with full-body looks and detail framing.", outfits: ["tailored mini dress with sheer stockings and pointed high heels", "satin robe over lace lingerie, stockings and platform heels", "coordinated lingerie, seamed stockings and statement heels", "sculptural non-explicit figure study with heels or draped fabric"], environments: ["editorial shoe studio with pale seamless", "black lacquer dressing room", "warm boudoir set with chaise", "minimal dark studio with sculptural plinth"], lighting: ["crisp beauty dish with soft fill", "side strip light emphasizing footwear", "warm softbox and window fill", "controlled rim light and broad fill"] },
  { key: "retro-glamour", label: "Retro glamour story", description: "Vintage-inspired robe, satin and pin-up editorial styling across four set changes.", outfits: ["structured vintage-inspired dress, seamed stockings and classic pumps", "satin robe over retro-inspired lingerie and seamed stockings", "coordinated satin lingerie with vintage stockings and heels", "tasteful vintage fine-art figure study with a draped sheet"], environments: ["mid-century dressing room", "cream pin-up studio with paper backdrop", "rose-toned bedroom with vanity", "black-and-white portrait studio"], lighting: ["classic butterfly key and fill", "bright vintage studio softbox", "warm vanity practicals", "dramatic monochrome side light"] },
  { key: "resort-glamour", label: "Resort glamour story", description: "A resort suite and terrace sequence with airy wardrobe, warm light and a fine-art finish.", outfits: ["flowing resort wrap dress with elegant sandals", "sheer cover-up layered over coordinated swim-inspired lingerie", "coordinated lingerie with a light robe and barefoot styling", "non-explicit sunlit figure study with draped linen"], environments: ["sunlit resort dressing suite", "shaded terrace with linen curtains", "bright white suite beside balcony doors", "warm stone-toned studio with linen drape"], lighting: ["bright indirect daylight", "late-afternoon window light", "soft terrace bounce light", "warm sunset rim with soft fill"] },
  { key: "footwear-care", label: "Foot fetish · heels, hosiery & care", description: "Adult foot-focused editorial photography for heels, stockings, pedicures and subtle lotion or massage-oil sheen.", outfits: ["tailored satin dress, sheer stockings and elegant heels", "silk robe over coordinated lingerie, stockings and platform heels", "lace lingerie with sheer stockings and statement heels", "non-explicit fine-art figure study with a sheet and refined foot styling"], environments: ["editorial shoe studio with pale seamless", "luxury dressing room with full-length mirror", "warm boudoir set with velvet chaise", "quiet beauty studio with linen and a low riser"], lighting: ["crisp beauty dish with soft fill", "side strip light on stockings and shoes", "warm softbox with window fill", "macro detail light with gentle rim"], footEditorial: true },
];

const SHOTS = [
  ["Cover portrait", "standing, one hand at waist", "front", "eye-level", "portrait", "85mm", "warm gray seamless", "large softbox key"],
  ["Full-length hero", "standing with relaxed contrapposto", "front left three-quarter", "low", "full body", "50mm", "cream cyclorama", "soft beauty dish"],
  ["Three-quarter turn", "standing, shoulders turned toward lens", "front right three-quarter", "eye-level", "thigh-up", "85mm", "warm gray seamless", "soft window light"],
  ["Profile silhouette", "standing in clean side profile", "left profile", "side profile low upward", "full body", "50mm", "charcoal studio", "strip softbox rim"],
  ["Over-shoulder portrait", "looking back over one shoulder", "rear left three-quarter", "eye-level", "waist-up", "85mm", "cream cyclorama", "large softbox key"],
  ["Seated chair portrait", "seated upright on chair, ankles crossed", "front", "high", "thigh-up", "50mm", "ivory bedroom", "soft window light"],
  ["Studio walk", "mid-stride toward camera", "front right three-quarter", "low", "full body", "35mm", "charcoal studio", "hard rim with fill"],
  ["Detail: heels and hem", "standing with one heel lifted", "front left three-quarter", "low", "full body", "macro", "cream cyclorama", "side strip light"],
  ["Soft seated look", "seated at edge of chaise, hands relaxed", "front right three-quarter", "eye-level", "thigh-up", "85mm", "ivory bedroom", "soft window light"],
  ["Hands at lapel", "standing, lightly holding open jacket lapels", "front", "eye-level", "waist-up", "50mm", "warm gray seamless", "beauty dish with fill"],
  ["Window-side turn", "standing beside window, torso gently turned", "right profile", "high", "full body", "50mm", "loft window", "natural window light"],
  ["Seated profile", "seated sideways, looking toward lens", "right profile", "eye-level", "thigh-up", "85mm", "ivory bedroom", "curtain-diffused light"],
  ["Reclining editorial", "reclining on one side, supported by elbow", "front left three-quarter", "high", "full body", "35mm", "ivory bedroom", "soft window light"],
  ["Kneeling portrait", "kneeling upright beside chaise", "front", "eye-level", "thigh-up", "85mm", "cream cyclorama", "large softbox key"],
  ["Back view with turn", "back to camera, head turned toward lens", "back", "eye-level", "full body", "50mm", "charcoal studio", "rim light and soft fill"],
  ["Hemline movement", "turning gently so fabric moves", "rear right three-quarter", "low", "full body", "35mm", "loft window", "window light with bounce"],
  ["Lingerie hero", "standing with one hand resting at hip", "front left three-quarter", "eye-level", "full body", "50mm", "warm gray seamless", "soft beauty dish"],
  ["Lingerie close portrait", "seated, shoulders relaxed, direct gaze", "front", "eye-level", "portrait", "85mm", "ivory bedroom", "large softbox key"],
  ["Strap detail", "three-quarter pose, one hand near shoulder strap", "front right three-quarter", "high", "waist-up", "macro", "cream cyclorama", "side strip light"],
  ["Stocking adjustment", "seated, hands resting near stocking top", "front left three-quarter", "high", "thigh-up", "50mm", "ivory bedroom", "soft window light"],
  ["Heel on riser", "one foot resting on low studio riser", "front", "low", "full body", "35mm", "charcoal studio", "hard rim with fill"],
  ["Chaise recline", "reclining on chaise with one knee softly bent", "front right three-quarter", "high", "full body", "50mm", "ivory bedroom", "curtain-diffused light"],
  ["Back three-quarter", "back turned, looking over shoulder", "rear right three-quarter", "eye-level", "thigh-up", "85mm", "warm gray seamless", "rim light and soft fill"],
  ["Seated crossed legs", "seated with legs crossed at ankle", "front left three-quarter", "eye-level", "full body", "50mm", "ivory bedroom", "soft window light"],
  ["Lounge portrait", "leaning against chaise, one knee bent", "left profile", "low", "thigh-up", "85mm", "cream cyclorama", "large softbox key"],
  ["Lingerie walk", "walking slowly across set", "front right three-quarter", "low", "full body", "35mm", "loft window", "window light with bounce"],
  ["Hands in hair", "seated, hands lightly lifted to hair", "front", "high", "waist-up", "85mm", "warm gray seamless", "beauty dish with fill"],
  ["Side-light silhouette", "standing with arms relaxed by sides", "right profile", "side profile high downward", "full body", "50mm", "charcoal studio", "strip softbox rim"],
  ["Bare shoulder portrait", "three-quarter portrait with robe draped at elbows", "front left three-quarter", "eye-level", "portrait", "85mm", "ivory bedroom", "soft window light"],
  ["Robe reveal", "standing, robe open over lingerie", "front", "low", "full body", "50mm", "cream cyclorama", "soft beauty dish"],
  ["Artful seated study", "seated with torso angled and arms gently crossed", "front right three-quarter", "high", "thigh-up", "85mm", "charcoal studio", "Rembrandt softbox"],
  ["Reclined side study", "reclining on side with a draped sheet", "rear left three-quarter", "high", "full body", "50mm", "ivory bedroom", "window light with bounce"],
  ["Sculptural kneel", "kneeling, torso elongated, one arm above head", "front left three-quarter", "low", "full body", "35mm", "charcoal studio", "hard rim with fill"],
  ["Backlit contour", "standing in profile against backlight", "left profile", "eye-level", "full body", "85mm", "charcoal studio", "backlit silhouette"],
  ["Seated drape study", "seated, sheet draped across lap", "front", "high", "thigh-up", "50mm", "ivory bedroom", "curtain-diffused light"],
  ["Reclining contour", "reclining on back with sheet arranged across torso", "front right three-quarter", "high", "full body", "35mm", "cream cyclorama", "large softbox key"],
  ["Standing fine-art figure", "standing with arms gently crossed across torso", "front left three-quarter", "eye-level", "full body", "85mm", "charcoal studio", "Rembrandt softbox"],
  ["Fine-art seated silhouette", "seated in profile with arms softly folded", "right profile", "low", "full body", "50mm", "charcoal studio", "backlit silhouette"],
  ["Sculptural kneeling figure", "kneeling upright with draped fabric across lap", "rear left three-quarter", "high", "thigh-up", "85mm", "warm gray seamless", "strip softbox rim"],
  ["Final portrait", "relaxed seated pose, direct confident gaze", "front", "eye-level", "portrait", "85mm", "warm gray seamless", "large softbox key"],
  ["Window frame study", "standing with shoulder resting against window frame", "left profile", "high", "full body", "35mm", "loft window", "natural window light"],
  ["Draped shoulder portrait", "seated with sheet draped over one shoulder", "front right three-quarter", "eye-level", "waist-up", "85mm", "ivory bedroom", "curtain-diffused light"],
  ["Reclining back view", "reclining on side with back toward lens", "back from above", "high", "full body", "50mm", "charcoal studio", "backlit silhouette"],
  ["Sculptural arm line", "standing with one arm curved overhead", "back from below", "rear low upward", "full body", "50mm", "cream cyclorama", "Rembrandt softbox"],
  ["Seated foot detail", "seated with one heel resting on a low stool", "front", "low", "full body", "macro", "warm gray seamless", "side strip light"],
  ["Soft focus profile", "standing in profile with gaze lowered", "right profile", "eye-level", "portrait", "135mm", "ivory bedroom", "soft window light"],
  ["Curtain silhouette", "standing behind a translucent curtain", "front right three-quarter", "high", "full body", "85mm", "loft window", "curtain-diffused light"],
  ["Closing seated portrait", "seated upright with hands resting on chair back", "front", "eye-level", "thigh-up", "50mm", "warm gray seamless", "beauty dish with fill"],
];

const WARDROBE_ACTIONS = [
  "Keep the selected outfit fully worn and neatly styled; this is the dressed opening of the shoot.",
  "Show the adult model beginning a gradual wardrobe change by loosening one outer layer; keep the main outfit in place.",
  "Remove one outer garment between frames and hold or drape it naturally; keep opaque base garments on.",
  "Let the robe or outer layer fall from the shoulders while the coordinated lingerie remains in place.",
  "Finish removing the outer layer to reveal the chosen lingerie, stockings and footwear; do not restore removed layers.",
  "Continue the sequence in lingerie; change pose and remove only optional accessories or footwear between frames.",
  "Transition to partial nudity one garment at a time, using pose, arms or draped fabric for tasteful non-explicit coverage.",
  "Complete the arc as an adult non-explicit fine-art nude study, with composed posing, natural anatomy and no sexual activity.",
];
const POSE_VARIATIONS = ["with a softened gaze and relaxed hands", "with chin lifted slightly and shoulders turned", "with gaze directed off-camera and a longer arm line"];

export const ADULT_EDITORIAL_POSES = [...new Set(SHOTS.flatMap(shot => [shot[1], ...POSE_VARIATIONS.map(variation => `${shot[1]}, ${variation}`)]))];

export function createAdultEditorialPlan({ characterId = null, count = 40, outfit = "", templateKey = "editorial-arc" } = {}) {
  const total = Math.max(1, Math.min(120, Math.trunc(Number(count) || 40)));
  const exposures = ADULT_EDITORIAL_COVERAGE_STAGES.filter(stage => EXPOSURE_CHOICES.includes(stage));
  const template = ADULT_EDITORIAL_TEMPLATES.find(item => item.key === templateKey) || ADULT_EDITORIAL_TEMPLATES[0];
  const views = ["front", "front left three-quarter", "front right three-quarter", "left profile", "right profile", "rear left three-quarter", "rear right three-quarter", "back", "back from below", "back from above"];
  const cameraHeights = ["eye-level", "low", "high", "rear low upward", "rear high downward", "side profile low upward", "side profile high downward"];
  const lenses = ["24mm", "35mm", "50mm", "85mm", "135mm", "macro"];
  const framings = ["close-up", "portrait", "waist-up", "thigh-up", "knees-up", "full body", "wide shot", "detail shot"];
  return {
    version: 1,
    characterId,
    templateId: template.key,
    planType: "adult-editorial",
    shots: Array.from({ length: total }, (_, index) => {
      const base = SHOTS[index % SHOTS.length];
      const [title, basePose, baseView, baseCamera, baseFraming, baseLens, baseEnvironment, baseLight] = base;
      const variant = Math.floor(index / SHOTS.length);
      const chapterIndex = Math.min(3, Math.floor(index * 4 / total));
      const view = variant ? views[(index * 7 + variant) % views.length] : baseView;
      const cameraAngle = variant ? cameraHeights[(index * 5 + variant) % cameraHeights.length] : baseCamera;
      const framing = variant ? framings[(index * 3 + variant) % framings.length] : baseFraming;
      const lens = variant ? lenses[(index * 5 + variant) % lenses.length] : baseLens;
      const environment = template.environments[chapterIndex] || baseEnvironment;
      const light = template.lighting[chapterIndex] || baseLight;
      const pose = variant ? `${basePose}, ${POSE_VARIATIONS[(variant - 1) % POSE_VARIATIONS.length]}` : basePose;
      const chapter = ["Dressed introduction", "Wardrobe reveal", "Lingerie editorial", "Fine-art finale"][chapterIndex];
      const stageIndex = Math.min(exposures.length - 1, Math.floor(index * exposures.length / total));
      const footPoses = ["heels together", "ankles crossed", "one heel resting on a low riser", "pedicure detail with relaxed toes", "arches visible in profile", "one foot lifted", "feet side by side", "toes pointed"];
      const hosiery = ["sheer stockings", "toeless stockings", "footed stockings", "fishnet stockings", "bare", "sheer stockings", "bare", "bare"];
      return {
        id: `shot-${index + 1}`,
        enabled: true,
        label: `${String(index + 1).padStart(3, "0")} · ${title}`,
        chapter,
        pose,
        subjectView: view,
        cameraAngle,
        framing,
        lens,
        coverage: exposures[stageIndex],
        wardrobeAction: WARDROBE_ACTIONS[stageIndex],
        outfit: outfit || template.outfits[chapterIndex] || null,
        scene: { environment },
        lighting: { style: light },
        ...(template.footEditorial ? { feet: {
          composition_mode: "feet focus",
          framing: ["full body", "ankle and arch close-up", "pedicure close-up", "knees-down", "feet close-up"][index % 5],
          hosiery: hosiery[stageIndex],
          skin_finish: ["soft lotion sheen", "light massage oil sheen", "natural matte"][Math.floor(index / 2) % 3],
          foot_pose: footPoses[index % footPoses.length],
          ground_surface: ["velvet cushion", "polished wood floor", "silk sheets", "soft carpet"][chapterIndex],
          ...(index % 3 === 0 ? { foot_state: ["oiled"] } : {}),
        } } : {}),
      };
    }),
  };
}
