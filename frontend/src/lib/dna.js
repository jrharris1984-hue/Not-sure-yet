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
      { key: "texture", type: "chips", label: "Texture", options: ["smooth", "natural pores", "textured", "matte", "dewy"] },
      { key: "freckles", type: "chips", label: "Freckles", options: ["none", "light", "scattered", "heavy"] },
      { key: "tattoos", type: "text", label: "Tattoos" },
      { key: "glow", type: "slider", label: "Glow", min: 0, max: 100, step: 1 },
    ],
  },
  {
    key: "wardrobe",
    title: "Wardrobe",
    fields: [
      { key: "top", type: "text", label: "Top" },
      { key: "bottom", type: "text", label: "Bottom" },
      { key: "underwear", type: "text", label: "Lingerie / underwear" },
      { key: "material", type: "chips", label: "Material", options: ["cotton", "silk", "leather", "denim", "lace", "linen", "latex", "wool", "velvet"] },
      { key: "palette", type: "chips", label: "Palette", options: ["monochrome black", "neutrals", "warm earth", "cool jewel tones", "pastel", "neon", "crimson"] },
      { key: "fit", type: "chips", label: "Fit", options: ["fitted", "loose", "oversized", "tailored", "cropped"] },
    ],
  },
  {
    key: "pose",
    title: "Pose",
    fields: [
      { key: "action", type: "chips", label: "Action", options: ["standing", "sitting", "walking", "leaning", "lying", "kneeling", "dancing", "reaching"] },
      { key: "angle", type: "chips", label: "Angle", options: ["front", "3/4", "profile", "back", "over-shoulder"] },
      { key: "distance", type: "chips", label: "Distance", options: ["close-up", "waist-up", "full body", "wide shot"] },
      { key: "body_language", type: "chips", label: "Body language", options: ["confident", "relaxed", "intimate", "playful", "powerful", "vulnerable"] },
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
    if (f.type === "chips") out[f.key] = pick(f.options);
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

  const wd = dna.wardrobe || {};
  push(wd.top);
  push(wd.bottom);
  push(wd.underwear);
  push(wd.material);
  push(wd.palette);
  push(wd.fit);

  const pose = dna.pose || {};
  push(pose.action);
  push(pose.angle && `${pose.angle} angle`);
  push(pose.distance);
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
