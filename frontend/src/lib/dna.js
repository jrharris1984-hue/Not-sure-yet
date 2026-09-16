// DNA schema + prompt builder + randomizer
export const SECTIONS = [
  {
    key: "identity",
    title: "Identity",
    fields: [
      { key: "gender", type: "chips", label: "Gender", options: ["female", "male", "non-binary", "androgynous"] },
      { key: "age", type: "slider", label: "Age", min: 18, max: 70, step: 1 },
      { key: "ethnicity", type: "chips", label: "Ethnicity", options: ["latina", "east asian", "south asian", "black", "white", "middle eastern", "mixed", "nordic", "polynesian"] },
      { key: "archetype", type: "chips", label: "Archetype", options: ["girl next door", "femme fatale", "warrior", "pirate", "cyberpunk", "goth", "cottagecore", "athlete", "queen"] },
      { key: "name", type: "text", label: "Name" },
    ],
  },
  {
    key: "physique",
    title: "Physique",
    fields: [
      { key: "height", type: "chips", label: "Height", options: ["petite", "short", "average", "tall", "statuesque"] },
      { key: "body_type", type: "chips", label: "Body type", options: ["slim", "athletic", "curvy", "voluptuous", "plus size", "hourglass", "pear", "apple", "bombshell", "amazonian"] },
      { key: "muscularity", type: "slider", label: "Muscularity", min: 0, max: 100, step: 1 },
      { key: "curves", type: "slider", label: "Curves", min: 0, max: 100, step: 1 },
      { key: "exaggeration", type: "slider", label: "Proportion exaggeration (natural → hyper)", min: 0, max: 100, step: 1 },
      { key: "bust", type: "chips", label: "Bust size", options: ["flat", "small", "medium", "large", "very large", "huge", "enormous", "hyper"] },
      { key: "bust_shape", type: "chips", label: "Bust shape", options: ["natural", "perky", "round", "teardrop", "athletic", "augmented", "gravity-defying"] },
      { key: "butt", type: "chips", label: "Butt", options: ["flat", "small", "toned", "round", "bubble", "large", "very large", "huge", "hyper"] },
      { key: "thighs", type: "chips", label: "Thighs", options: ["slim", "toned", "athletic", "thick", "very thick", "massive"] },
      { key: "hips", type: "chips", label: "Hips", options: ["narrow", "average", "wide", "very wide", "extreme"] },
      { key: "waist", type: "chips", label: "Waist", options: ["thick", "average", "slim", "cinched", "tiny", "wasp-thin"] },
      { key: "shoulders", type: "chips", label: "Shoulders", options: ["narrow", "average", "broad", "athletic"] },
      { key: "legs", type: "chips", label: "Legs", options: ["short", "average", "long", "endless"] },
      { key: "proportions", type: "text", label: "Extra proportions notes" },
    ],
  },
  {
    key: "face",
    title: "Face",
    fields: [
      { key: "eye_shape", type: "chips", label: "Eye shape", options: ["almond", "round", "hooded", "monolid", "upturned", "downturned"] },
      { key: "eye_color", type: "chips", label: "Eye color", options: ["deep brown", "hazel", "green", "blue", "grey", "amber", "violet"] },
      { key: "jawline", type: "chips", label: "Jawline", options: ["soft", "defined", "angular", "square", "heart-shaped"] },
      { key: "nose", type: "chips", label: "Nose", options: ["button", "straight", "roman", "aquiline", "upturned"] },
      { key: "lips", type: "chips", label: "Lips", options: ["thin", "medium", "full", "pouty", "bow-shaped"] },
      { key: "expression", type: "chips", label: "Expression", options: ["neutral", "smirk", "smile", "serious", "sultry", "laughing"] },
    ],
  },
  {
    key: "hair",
    title: "Hair",
    fields: [
      { key: "style", type: "chips", label: "Style", options: ["straight", "wavy", "curly", "coily", "braids", "updo", "ponytail", "messy"] },
      { key: "length", type: "chips", label: "Length", options: ["pixie", "short bob", "shoulder", "long", "waist-length"] },
      { key: "color", type: "chips", label: "Color", options: ["jet black", "chestnut", "auburn", "fiery red", "platinum blonde", "honey blonde", "silver", "raven", "ombre"] },
      { key: "texture", type: "chips", label: "Texture", options: ["fine", "medium", "thick", "coarse"] },
      { key: "bangs", type: "chips", label: "Bangs", options: ["none", "curtain", "blunt", "side-swept", "wispy"] },
    ],
  },
  {
    key: "skin",
    title: "Skin",
    fields: [
      { key: "tone", type: "chips", label: "Tone", options: ["porcelain", "fair", "olive", "tan", "bronze", "dark brown", "ebony"] },
      { key: "texture", type: "chips", label: "Texture", options: ["smooth", "natural pores", "textured", "matte", "dewy", "oiled", "sweat-glistening"] },
      { key: "freckles", type: "chips", label: "Freckles", options: ["none", "light", "scattered", "heavy"] },
      { key: "tattoos", type: "text", label: "Tattoos" },
      { key: "glow", type: "slider", label: "Glow", min: 0, max: 100, step: 1 },
    ],
  },
  {
    key: "intimate",
    title: "Intimate",
    fields: [
      { key: "pubic_hair", type: "chips", label: "Pubic hair", options: ["hairless", "shaved smooth", "stubble", "trimmed", "landing strip", "natural bush", "hairy", "very hairy", "wild bush", "heart-shaped"] },
      { key: "pussy", type: "chips", label: "Pussy", options: ["closed", "small labia", "prominent labia", "puffy", "innie", "outie", "meaty", "tight", "spread", "wet"] },
      { key: "clit", type: "chips", label: "Clit", options: ["hidden", "subtle", "prominent", "large", "pierced"] },
      { key: "asshole", type: "chips", label: "Butthole", options: ["hidden", "tight", "visible", "puckered", "trimmed", "hairy", "bleached", "pierced", "spread"] },
      { key: "nipples", type: "chips", label: "Nipples", options: ["soft", "erect", "inverted", "small", "large", "puffy", "pierced"] },
      { key: "areolas", type: "chips", label: "Areolas", options: ["small pale", "medium pink", "large brown", "very large dark", "puffy dome"] },
      { key: "body_hair", type: "chips", label: "Body hair", options: ["hairless", "light peach fuzz", "moderate", "heavy", "natural", "unshaven armpits"] },
      { key: "piercings", type: "chips", label: "Piercings", options: ["none", "nipple", "navel", "nose", "septum", "tongue", "clit hood", "labia", "multi"] },
    ],
  },
  {
    key: "wardrobe",
    title: "Wardrobe",
    fields: [
      { key: "outfit_preset", type: "chips", label: "Outfit preset", options: [
        "nude", "topless", "bottomless", "boudoir lingerie", "sheer negligee", "silk robe open", "wet t-shirt", "bikini", "micro bikini", "string bikini",
        "sexy schoolgirl", "naughty nurse", "french maid", "playboy bunny", "showgirl", "pole dancer", "gogo dancer", "stripper", "cheerleader",
        "dominatrix", "leather mistress", "latex catsuit", "kinky harness", "shibari rope", "fetish gimp",
        "secretary unbuttoned", "librarian undone", "biker chick", "cowgirl chaps", "cop uniform undone", "flight attendant undone",
        "cocktail dress", "evening gown slit", "backless red carpet", "club outfit",
        "yoga wear", "gym set", "sports bra and shorts", "cheerleader off-duty",
        "streetwear", "casual home", "just a shirt", "boyfriend's shirt", "just panties"
      ]},
      { key: "top", type: "chips", label: "Top", options: [
        "none", "sheer top", "mesh top", "lace bralette", "bikini top", "corset", "bustier", "crop top", "backless top", "keyhole top", "halter",
        "tube top", "strapless", "wet t-shirt", "unbuttoned blouse", "ripped shirt", "nipple pasties", "leather harness", "cage bra", "chainmail top"
      ]},
      { key: "bottom", type: "chips", label: "Bottom", options: [
        "none", "micro-mini skirt", "pencil skirt", "leather skirt", "school skirt", "denim shorts", "hot pants", "booty shorts", "yoga pants",
        "latex leggings", "wet look pants", "cutoff jeans", "chaps", "fishnet stockings", "garter belt", "thigh-high stockings"
      ]},
      { key: "underwear", type: "chips", label: "Lingerie", options: [
        "none", "thong", "g-string", "lace panties", "sheer panties", "crotchless", "microkini", "boy shorts", "high-waist briefs",
        "teddy", "babydoll", "chemise", "bodysuit", "mesh bodysuit", "corset with garters", "harness lingerie", "leather harness", "bikini set"
      ]},
      { key: "footwear", type: "chips", label: "Footwear", options: [
        "barefoot", "stiletto heels", "stripper heels", "thigh-high boots", "over-the-knee boots", "ankle boots", "combat boots", "sneakers", "platform heels", "sandals", "kitten heels", "cowgirl boots"
      ]},
      { key: "accessories", type: "chips", label: "Accessories", options: [
        "none", "choker", "leather collar", "leash", "handcuffs", "gloves", "opera gloves", "fishnet gloves", "garters", "stockings", "veil", "cat ears", "bunny ears", "devil horns", "angel wings", "sunglasses", "jewelry", "body chain", "belly chain"
      ]},
      { key: "material", type: "chips", label: "Material", options: ["cotton", "silk", "satin", "leather", "denim", "lace", "linen", "latex", "PVC", "wet look", "sheer mesh", "fishnet", "chainmail", "chrome", "velvet"] },
      { key: "palette", type: "chips", label: "Palette", options: ["monochrome black", "blood red", "hot pink", "neon", "pastel", "white bridal", "gold and black", "silver", "leopard print", "zebra print"] },
      { key: "fit", type: "chips", label: "Fit", options: ["skin-tight", "fitted", "loose", "cropped", "oversized", "torn", "wet and clinging"] },
      { key: "state", type: "chips", label: "State", options: ["fully clothed", "one strap down", "top pulled down", "shirt open", "unbuttoned", "unzipped", "panties pulled aside", "riding up", "coming off", "ripped", "disheveled"] },
    ],
  },
  {
    key: "pose",
    title: "Pose",
    fields: [
      { key: "action", type: "pose_chips", label: "Pose", options: [
        "standing", "standing hip out", "standing hands on hips", "standing arms up", "standing back arched", "standing legs apart", "standing splits", "walking",
        "leaning wall", "leaning forward", "bending over",
        "sitting legs crossed", "sitting legs open", "sitting reverse chair", "sitting on edge",
        "kneeling upright", "kneeling back arched", "kneeling hands floor",
        "lying back", "lying side", "lying stomach", "lying legs spread", "lying legs up", "on back legs up",
        "all fours", "doggy arched", "doggy low",
        "squatting", "squatting spread", "squatting deep",
        "over shoulder look", "arched on knees", "hands on knees", "hair flip", "dancing", "reverse view"
      ]},
      { key: "angle", type: "chips", label: "Camera angle", options: ["front", "3/4", "profile", "back", "over-shoulder", "from above", "from below", "pov"] },
      { key: "distance", type: "chips", label: "Framing", options: ["close-up", "portrait", "waist-up", "full body", "wide shot", "detail shot"] },
      { key: "focus", type: "chips", label: "Focus on", options: ["face", "body", "breasts", "butt", "hips", "legs", "feet", "hands", "full frame"] },
      { key: "hands", type: "chips", label: "Hands", options: ["at sides", "on hips", "in hair", "touching body", "on breasts", "between legs", "gripping something", "over head", "behind back", "behind head"] },
      { key: "body_language", type: "chips", label: "Vibe", options: ["confident", "relaxed", "intimate", "playful", "powerful", "vulnerable", "sultry", "coy", "come-hither", "dominant", "submissive", "teasing"] },
    ],
  },
  {
    key: "scene",
    title: "Scene",
    fields: [
      { key: "environment", type: "chips", label: "Environment", options: ["studio", "beach", "forest", "urban street", "rooftop", "bedroom", "warehouse", "desert", "neon alley", "castle"] },
      { key: "background", type: "text", label: "Background details" },
      { key: "indoor_outdoor", type: "chips", label: "Indoor / Outdoor", options: ["indoor", "outdoor", "mixed"] },
      { key: "era", type: "chips", label: "Era / theme", options: ["contemporary", "80s", "90s", "vintage", "futuristic", "medieval", "victorian", "cyberpunk"] },
      { key: "props", type: "text", label: "Props" },
    ],
  },
  {
    key: "lighting",
    title: "Lighting",
    fields: [
      { key: "source", type: "chips", label: "Source", options: ["natural", "window", "softbox", "hard key", "neon", "candle", "firelight", "moonlight"] },
      { key: "color_temp", type: "chips", label: "Color temp", options: ["warm", "neutral", "cool", "mixed"] },
      { key: "direction", type: "chips", label: "Direction", options: ["front", "side", "rim", "back", "top", "underlit"] },
      { key: "style", type: "chips", label: "Style", options: ["cinematic", "chiaroscuro", "high-key", "low-key", "golden hour", "blue hour", "hard shadows"] },
      { key: "mood", type: "chips", label: "Mood", options: ["dramatic", "soft", "moody", "playful", "sensual", "harsh"] },
    ],
  },
  {
    key: "camera",
    title: "Camera",
    fields: [
      { key: "lens", type: "chips", label: "Lens", options: ["24mm", "35mm", "50mm", "85mm", "135mm", "macro"] },
      { key: "aperture", type: "chips", label: "Aperture", options: ["f/1.4", "f/1.8", "f/2.8", "f/4", "f/8"] },
      { key: "angle", type: "chips", label: "Angle", options: ["eye-level", "low", "high", "dutch", "birds-eye"] },
      { key: "aspect_ratio", type: "chips", label: "Aspect ratio", options: ["1:1", "4:5", "3:2", "16:9", "9:16", "2.35:1"] },
    ],
  },
  {
    key: "style",
    title: "Style",
    fields: [
      { key: "render", type: "chips", label: "Render", options: ["photorealistic", "cinematic", "analog film", "octane", "editorial", "documentary", "35mm film"] },
      { key: "film_grain", type: "chips", label: "Film grain", options: ["none", "subtle", "medium", "heavy"] },
      { key: "artistic_tone", type: "chips", label: "Tone", options: ["natural", "moody", "vibrant", "desaturated", "high-contrast", "faded"] },
      { key: "extra", type: "text", label: "Extra style tokens" },
    ],
  },
];

export const DEFAULT_DNA = SECTIONS.reduce((acc, s) => {
  acc[s.key] = {};
  s.fields.forEach((f) => {
    if (f.type === "slider") acc[s.key][f.key] = Math.round((f.min + f.max) / 2);
    else acc[s.key][f.key] = "";
  });
  return acc;
}, {});

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export function randomizeSection(sectionKey, current = {}) {
  const section = SECTIONS.find((s) => s.key === sectionKey);
  const out = { ...current };
  section.fields.forEach((f) => {
    if (f.type === "chips" || f.type === "pose_chips") out[f.key] = pick(f.options);
    else if (f.type === "slider") out[f.key] = Math.floor(Math.random() * (f.max - f.min + 1)) + f.min;
    else if (f.type === "text") out[f.key] = out[f.key] || "";
  });
  return out;
}

export function randomizeDna(current = {}, locks = {}) {
  const out = { ...current };
  SECTIONS.forEach((s) => {
    if (locks[s.key]) return;
    out[s.key] = randomizeSection(s.key, current[s.key] || {});
  });
  return out;
}

export function resetSection(sectionKey) {
  return { ...DEFAULT_DNA[sectionKey] };
}

// Build positive/negative prompts from DNA
export function buildPrompts(dna = {}) {
  const bits = [];
  const push = (v) => { if (v !== undefined && v !== null && String(v).trim() !== "") bits.push(String(v).trim()); };

  const id = dna.identity || {};
  push(id.age && `${id.age} year old`);
  push(id.ethnicity);
  push(id.gender);
  push(id.archetype);

  const ph = dna.physique || {};
  push(ph.height);
  push(ph.body_type);
  if (ph.muscularity > 60) push("athletic build");
  if (ph.muscularity > 85) push("highly muscular");
  if (ph.curves > 60) push("curvy figure");
  if (ph.curves > 85) push("extremely curvy");
  // Exaggeration → prompt intensity modifiers
  const ex = Number(ph.exaggeration || 0);
  const emphasize = (label) => {
    if (ex >= 85) return `hyper-exaggerated ${label}`;
    if (ex >= 65) return `exaggerated ${label}`;
    if (ex >= 40) return `enhanced ${label}`;
    return label;
  };
  push(ph.bust && emphasize(`${ph.bust} bust`));
  push(ph.bust_shape && `${ph.bust_shape} breasts`);
  push(ph.butt && emphasize(`${ph.butt} butt`));
  push(ph.thighs && emphasize(`${ph.thighs} thighs`));
  push(ph.hips && emphasize(`${ph.hips} hips`));
  push(ph.waist && `${ph.waist} waist`);
  push(ph.shoulders && `${ph.shoulders} shoulders`);
  push(ph.legs && `${ph.legs} legs`);
  if (ex >= 75) push("stylized cartoonish proportions, exaggerated hourglass silhouette");
  push(ph.proportions);

  const face = dna.face || {};
  push(face.eye_shape && `${face.eye_shape} eyes`);
  push(face.eye_color && `${face.eye_color} eyes`);
  push(face.jawline && `${face.jawline} jawline`);
  push(face.nose && `${face.nose} nose`);
  push(face.lips && `${face.lips} lips`);
  push(face.expression);

  const hair = dna.hair || {};
  push([hair.length, hair.style, hair.color, "hair"].filter(Boolean).join(" "));
  push(hair.bangs && hair.bangs !== "none" && `${hair.bangs} bangs`);
  push(hair.texture && `${hair.texture} hair texture`);

  const skin = dna.skin || {};
  push(skin.tone && `${skin.tone} skin`);
  push(skin.texture);
  push(skin.freckles && skin.freckles !== "none" && `${skin.freckles} freckles`);
  push(skin.tattoos);
  if (skin.glow > 60) push("dewy glowing skin");

  const im = dna.intimate || {};
  push(im.pubic_hair && `${im.pubic_hair} pubic hair`);
  push(im.pussy && `${im.pussy} pussy`);
  push(im.clit && im.clit !== "hidden" && `${im.clit} clit`);
  push(im.asshole && im.asshole !== "hidden" && `${im.asshole} asshole`);
  push(im.nipples && `${im.nipples} nipples`);
  push(im.areolas && `${im.areolas} areolas`);
  push(im.body_hair && im.body_hair !== "hairless" && `${im.body_hair} body hair`);
  push(im.piercings && im.piercings !== "none" && `${im.piercings} piercing`);

  const wd = dna.wardrobe || {};
  push(wd.outfit_preset);
  const noneVals = new Set(["none", "nude"]);
  if (!noneVals.has(wd.top)) push(wd.top);
  if (!noneVals.has(wd.bottom)) push(wd.bottom);
  if (!noneVals.has(wd.underwear)) push(wd.underwear);
  push(wd.footwear && wd.footwear !== "barefoot" && wd.footwear);
  if (wd.accessories && wd.accessories !== "none") push(wd.accessories);
  push(wd.material);
  push(wd.palette);
  push(wd.fit);
  push(wd.state && wd.state !== "fully clothed" && wd.state);

  const pose = dna.pose || {};
  push(pose.action);
  push(pose.angle && `${pose.angle} angle`);
  push(pose.distance);
  push(pose.focus && pose.focus !== "full frame" && `focus on ${pose.focus}`);
  push(pose.hands && `hands ${pose.hands}`);
  push(pose.body_language);

  const scene = dna.scene || {};
  push(scene.environment);
  push(scene.background);
  push(scene.era);
  push(scene.props);

  const lg = dna.lighting || {};
  push(lg.source && `${lg.source} light`);
  push(lg.color_temp && `${lg.color_temp} color temperature`);
  push(lg.direction && `${lg.direction} lighting`);
  push(lg.style);
  push(lg.mood && `${lg.mood} mood`);

  const cam = dna.camera || {};
  push(cam.lens && `${cam.lens} lens`);
  push(cam.aperture);
  push(cam.angle);
  push(cam.aspect_ratio && `${cam.aspect_ratio} aspect ratio`);

  const st = dna.style || {};
  push(st.render);
  push(st.film_grain && st.film_grain !== "none" && `${st.film_grain} film grain`);
  push(st.artistic_tone);
  push(st.extra);

  const positive = bits.filter(Boolean).join(", ");
  const negative = "low quality, blurry, deformed anatomy, extra fingers, watermark, text, jpeg artifacts";
  return { positive, negative };
}
