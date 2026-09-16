// DNA schema + prompt builder + randomizer
import { expandPrompt } from "@/lib/promptMap";

export const SECTIONS = [
  {
    key: "identity",
    title: "Identity",
    fields: [
      { key: "gender", type: "chips", label: "Gender", options: ["female", "male", "non-binary", "androgynous"] },
      { key: "age", type: "slider", label: "Age", min: 18, max: 70, step: 1 },
      { key: "ethnicity", type: "chips", label: "Ethnicity", options: [
        "latina", "mexican", "brazilian", "colombian", "puerto rican", "cuban", "dominican", "venezuelan", "argentinian", "peruvian",
        "east asian", "japanese", "korean", "chinese", "vietnamese", "thai", "filipina", "indonesian", "cambodian",
        "south asian", "indian", "pakistani", "bangladeshi", "sri lankan",
        "black", "african american", "ebony", "afro-caribbean", "nigerian", "ethiopian", "somali",
        "white", "caucasian", "european", "british", "french", "german", "italian", "spanish", "irish", "russian", "polish",
        "nordic", "scandinavian", "swedish", "norwegian", "icelandic",
        "middle eastern", "arab", "persian", "turkish", "lebanese", "egyptian", "moroccan", "israeli",
        "polynesian", "hawaiian", "samoan", "maori",
        "native american", "indigenous",
        "mixed", "blasian", "afro-latina", "eurasian", "mulatto", "mestiza", "creole", "amerasian",
        "mediterranean", "greek",
      ]},
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
    key: "scenario",
    title: "Scenario",
    fields: [
      { key: "cast_size", type: "chips", label: "Cast size", options: ["solo", "duo", "threesome", "foursome", "group", "gangbang", "orgy"] },
      { key: "cast_type", type: "chips", label: "Cast pairing", options: [
        "none", "twins", "identical twins", "sisters", "best friends", "roommates",
        "mother and daughter", "stepmom and stepdaughter", "aunt and niece",
        "grandma and granddaughter", "milf granny", "mature and young",
        "teacher and student", "boss and secretary", "nurse and patient", "coach and athlete",
        "dominant and submissive", "wife and mistress",
      ]},
      { key: "roleplay", type: "chips", label: "Role", options: [
        "none", "girl next door", "sexy stepmom", "hot aunt", "sexy granny", "milf",
        "cougar", "sugar mommy", "lonely housewife", "trophy wife", "best friend's mom",
        "step-sister", "schoolgirl", "college coed", "sorority girl", "cheerleader",
        "librarian", "teacher", "secretary", "boss lady", "nurse", "doctor",
        "yoga instructor", "personal trainer", "maid", "waitress", "flight attendant",
        "dominatrix", "submissive", "gothic girl", "e-girl", "onlyfans model", "cam girl", "porn star",
      ]},
      { key: "acts", type: "chips", label: "Explicit acts", options: [
        "none", "posing", "teasing", "stripping", "flashing", "upskirt", "exposed", "spread eagle", "spreading pussy",
        "masturbating", "fingering", "using dildo", "using vibrator", "using rabbit", "riding toy",
        "oral", "blowjob", "deepthroat", "throatpie", "titfucking", "handjob",
        "missionary", "cowgirl", "reverse cowgirl", "doggy style", "prone bone", "spooning",
        "standing sex", "against wall", "table sex", "bent over", "legs on shoulders", "amazon position",
        "anal", "anal doggy", "anal reverse cowgirl", "double penetration", "DAP", "DVP", "DP",
        "facesitting", "sixty-nine", "eating pussy", "rimming",
        "lesbian", "tribbing", "scissoring", "strap-on",
        "creampie", "cumshot", "facial", "bukkake", "cum on tits", "cum on ass", "cum on face", "swallowing",
        "squirting", "fisting", "gaping", "stretched",
        "bondage", "shibari", "tied up", "collared and leashed", "spanking", "gagged",
      ]},
      { key: "intensity", type: "slider", label: "Explicit intensity (softcore → hardcore)", min: 0, max: 100, step: 1 },
      { key: "extra_acts", type: "text", label: "Additional acts / notes" },
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
  // Expanded token lookup via promptMap
  const mp = (section, field) => {
    const v = dna?.[section]?.[field];
    return v ? expandPrompt(section, field, v) : "";
  };

  // Quality suffix — enforced at end for photorealism
  const quality = "masterpiece, best quality, ultra-detailed, 8k resolution, sharp focus, professional photography, realistic skin texture, detailed eyes, detailed skin pores, cinematic composition, physically accurate lighting";

  const id = dna.identity || {};
  if (id.name) push(`portrait of ${id.name}`);
  push(id.age && `${id.age} year old adult`);
  push(mp("identity", "ethnicity"));
  push(mp("identity", "gender"));
  push(mp("identity", "archetype"));

  const ph = dna.physique || {};
  push(ph.height && `${ph.height} height`);
  push(mp("physique", "body_type"));
  if (ph.muscularity > 60) push("athletic toned build, defined muscles");
  if (ph.muscularity > 85) push("highly muscular fitness model physique");
  if (ph.curves > 60) push("curvaceous voluptuous body");
  if (ph.curves > 85) push("extremely curvy dramatic hourglass proportions");
  const ex = Number(ph.exaggeration || 0);
  const emphasize = (label) => {
    if (ex >= 85) return `hyper-exaggerated cartoonishly ${label}`;
    if (ex >= 65) return `dramatically exaggerated ${label}`;
    if (ex >= 40) return `enhanced ${label}`;
    return label;
  };
  push(ph.bust && emphasize(expandPrompt("physique", "bust", ph.bust)));
  push(mp("physique", "bust_shape"));
  push(ph.butt && emphasize(expandPrompt("physique", "butt", ph.butt)));
  push(ph.thighs && emphasize(expandPrompt("physique", "thighs", ph.thighs)));
  push(ph.hips && emphasize(expandPrompt("physique", "hips", ph.hips)));
  push(mp("physique", "waist"));
  push(mp("physique", "shoulders"));
  push(mp("physique", "legs"));
  if (ex >= 75) push("stylized exaggerated body proportions, extreme feminine silhouette, dramatic curves");
  push(ph.proportions);

  const face = dna.face || {};
  push(mp("face", "eye_shape"));
  push(mp("face", "eye_color"));
  push(mp("face", "jawline"));
  push(face.nose && `${face.nose} nose`);
  push(mp("face", "lips"));
  push(mp("face", "expression"));

  const hair = dna.hair || {};
  const hairColor = hair.color && expandPrompt("hair", "color", hair.color);
  const hairLength = hair.length && expandPrompt("hair", "length", hair.length);
  const hairStyle = hair.style && expandPrompt("hair", "style", hair.style);
  push([hairLength, hairStyle, hairColor].filter(Boolean).join(", "));
  push(hair.bangs && hair.bangs !== "none" && `${hair.bangs} bangs`);
  push(hair.texture && `${hair.texture} hair texture`);

  const skin = dna.skin || {};
  push(mp("skin", "tone"));
  push(mp("skin", "texture"));
  push(mp("skin", "freckles"));
  push(skin.tattoos);
  if (skin.glow > 60) push("dewy glowing luminous skin, healthy sheen");
  if (skin.glow > 85) push("oiled glistening sweaty body, wet shine on skin");

  const im = dna.intimate || {};
  push(mp("intimate", "pubic_hair"));
  push(mp("intimate", "pussy"));
  push(im.clit && im.clit !== "hidden" && expandPrompt("intimate", "clit", im.clit));
  push(im.asshole && im.asshole !== "hidden" && expandPrompt("intimate", "asshole", im.asshole));
  push(mp("intimate", "nipples"));
  push(mp("intimate", "areolas"));
  push(im.body_hair && im.body_hair !== "hairless" && expandPrompt("intimate", "body_hair", im.body_hair));
  push(im.piercings && im.piercings !== "none" && expandPrompt("intimate", "piercings", im.piercings));

  const wd = dna.wardrobe || {};
  push(mp("wardrobe", "outfit_preset"));
  if (wd.top && wd.top !== "none") push(expandPrompt("wardrobe", "top", wd.top));
  if (wd.bottom && wd.bottom !== "none") push(expandPrompt("wardrobe", "bottom", wd.bottom));
  if (wd.underwear && wd.underwear !== "none") push(expandPrompt("wardrobe", "underwear", wd.underwear));
  if (wd.footwear && wd.footwear !== "barefoot") push(expandPrompt("wardrobe", "footwear", wd.footwear));
  if (wd.accessories && wd.accessories !== "none") push(expandPrompt("wardrobe", "accessories", wd.accessories));
  push(mp("wardrobe", "material"));
  push(wd.palette && `${wd.palette} color palette`);
  push(wd.fit && `${wd.fit} fit`);
  push(wd.state && wd.state !== "fully clothed" && expandPrompt("wardrobe", "state", wd.state));

  const pose = dna.pose || {};
  push(mp("pose", "action"));
  push(mp("pose", "angle"));
  push(mp("pose", "distance"));
  push(pose.focus && pose.focus !== "full frame" && expandPrompt("pose", "focus", pose.focus));
  push(pose.hands && expandPrompt("pose", "hands", pose.hands));
  push(mp("pose", "body_language"));

  const sc = dna.scenario || {};
  push(sc.cast_size && sc.cast_size !== "solo" && expandPrompt("scenario", "cast_size", sc.cast_size));
  push(sc.cast_type && sc.cast_type !== "none" && expandPrompt("scenario", "cast_type", sc.cast_type));
  push(sc.roleplay && sc.roleplay !== "none" && expandPrompt("scenario", "roleplay", sc.roleplay));
  push(sc.acts && sc.acts !== "none" && expandPrompt("scenario", "acts", sc.acts));
  const intensity = Number(sc.intensity || 0);
  if (intensity >= 85) push("extreme hardcore XXX pornographic scene, explicit sexual content, uncensored");
  else if (intensity >= 65) push("hardcore explicit adult scene, uncensored NSFW");
  else if (intensity >= 40) push("explicit adult content, NSFW");
  else if (intensity >= 20) push("sensual softcore, tasteful nude");
  push(sc.extra_acts);

  const scene = dna.scene || {};
  push(mp("scene", "environment"));
  push(scene.background);
  push(mp("scene", "era"));
  push(scene.props);

  const lg = dna.lighting || {};
  push(lg.source && expandPrompt("lighting", "source", lg.source));
  push(lg.color_temp && `${lg.color_temp} color temperature`);
  push(lg.direction && `${lg.direction} lighting direction`);
  push(mp("lighting", "style"));
  push(mp("lighting", "mood"));

  const cam = dna.camera || {};
  push(mp("camera", "lens"));
  push(mp("camera", "aperture"));
  push(cam.angle && `${cam.angle} camera angle`);
  push(cam.aspect_ratio && `${cam.aspect_ratio} aspect ratio`);

  const st = dna.style || {};
  push(mp("style", "render"));
  push(st.film_grain && st.film_grain !== "none" && `${st.film_grain} film grain`);
  push(mp("style", "artistic_tone"));
  push(st.extra);

  bits.push(quality);

  const positive = bits.filter(Boolean).join(", ");
  const negative = [
    "low quality, worst quality, blurry, out of focus, jpeg artifacts, compression artifacts",
    "deformed, disfigured, mutated, extra fingers, missing fingers, fused fingers, extra limbs, missing limbs, mutated hands, bad anatomy, bad proportions, unnatural body",
    "poorly drawn face, asymmetric face, cross-eyed, poorly drawn eyes, dead eyes",
    "cartoon, anime, 3d render, cgi, painting, illustration, drawing, sketch, doll-like, plastic, wax figure, uncanny valley",
    "watermark, signature, text, username, logo, artist name",
    "underage, child, teen, young girl, minor, loli",
    "overexposed, underexposed, harsh flash, oversaturated, washed out",
  ].join(", ");
  return { positive, negative };
}

// ============================================================
// Star / celebrity presets — one-tap DNA fills
// Trait descriptions only; if you have a LoRA for a star,
// add the trigger token in Style → Extra style tokens.
// ============================================================
export const STAR_PRESETS = [
  {
    name: "Ava Devine",
    tags: ["mature", "MILF", "brunette", "big bust", "tattoos"],
    dna: {
      identity: { gender: "female", age: 48, ethnicity: "white", archetype: "femme fatale", name: "Ava Devine" },
      physique: { height: "average", body_type: "hourglass", muscularity: 20, curves: 80, exaggeration: 55, bust: "huge", bust_shape: "augmented", butt: "large", thighs: "thick", hips: "very wide", waist: "cinched", shoulders: "average", legs: "average" },
      face: { eye_shape: "almond", eye_color: "deep brown", jawline: "defined", nose: "straight", lips: "full", expression: "sultry" },
      hair: { style: "wavy", length: "long", color: "jet black", texture: "thick", bangs: "none" },
      skin: { tone: "tan", texture: "dewy", freckles: "none", tattoos: "tramp stamp, full sleeve tattoos" },
      intimate: { pubic_hair: "trimmed", nipples: "erect", areolas: "large brown", piercings: "nipple" },
    },
  },
  {
    name: "Ebony Mystique",
    tags: ["ebony", "huge natural bust", "curvy"],
    dna: {
      identity: { gender: "female", age: 32, ethnicity: "black", archetype: "bombshell", name: "Ebony Mystique" },
      physique: { height: "average", body_type: "hourglass", muscularity: 30, curves: 95, exaggeration: 75, bust: "enormous", bust_shape: "natural", butt: "huge", thighs: "very thick", hips: "very wide", waist: "cinched", shoulders: "average", legs: "average" },
      face: { eye_shape: "almond", eye_color: "deep brown", jawline: "soft", nose: "button", lips: "full", expression: "sultry" },
      hair: { style: "wavy", length: "long", color: "jet black", texture: "thick", bangs: "none" },
      skin: { tone: "dark brown", texture: "dewy", glow: 70, tattoos: "" },
      intimate: { pubic_hair: "shaved smooth", nipples: "erect", areolas: "very large dark" },
    },
  },
  {
    name: "Gracie Bon",
    tags: ["latina", "huge butt", "curvy"],
    dna: {
      identity: { gender: "female", age: 26, ethnicity: "latina", archetype: "bombshell", name: "Gracie Bon" },
      physique: { height: "average", body_type: "pear", muscularity: 25, curves: 95, exaggeration: 80, bust: "large", bust_shape: "natural", butt: "hyper", thighs: "very thick", hips: "extreme", waist: "tiny", shoulders: "narrow", legs: "average" },
      face: { eye_shape: "almond", eye_color: "deep brown", jawline: "soft", nose: "button", lips: "full", expression: "sultry" },
      hair: { style: "wavy", length: "long", color: "chestnut", texture: "thick", bangs: "none" },
      skin: { tone: "tan", texture: "dewy", glow: 70 },
      intimate: { pubic_hair: "shaved smooth" },
    },
  },
  {
    name: "Allegra Cole",
    tags: ["mature", "MILF", "blonde", "natural huge bust"],
    dna: {
      identity: { gender: "female", age: 45, ethnicity: "white", archetype: "queen", name: "Allegra Cole" },
      physique: { height: "tall", body_type: "hourglass", muscularity: 25, curves: 90, exaggeration: 70, bust: "enormous", bust_shape: "natural", butt: "large", thighs: "thick", hips: "wide", waist: "slim", shoulders: "average", legs: "long" },
      face: { eye_shape: "almond", eye_color: "blue", jawline: "defined", nose: "straight", lips: "full", expression: "sultry" },
      hair: { style: "wavy", length: "long", color: "honey blonde", texture: "thick", bangs: "curtain" },
      skin: { tone: "fair", texture: "dewy", glow: 60 },
      intimate: { pubic_hair: "trimmed", areolas: "medium pink" },
    },
  },
  {
    name: "Angela White",
    tags: ["brunette", "natural huge bust", "curvy"],
    dna: {
      identity: { gender: "female", age: 34, ethnicity: "white", archetype: "bombshell", name: "Angela White" },
      physique: { height: "average", body_type: "hourglass", muscularity: 35, curves: 90, exaggeration: 60, bust: "enormous", bust_shape: "natural", butt: "large", thighs: "thick", hips: "wide", waist: "slim", shoulders: "average", legs: "average" },
      face: { eye_shape: "almond", eye_color: "green", jawline: "defined", nose: "straight", lips: "full", expression: "sultry" },
      hair: { style: "straight", length: "long", color: "jet black", texture: "thick", bangs: "none" },
      skin: { tone: "fair", texture: "dewy", glow: 55, tattoos: "small arm and back tattoos" },
    },
  },
  {
    name: "Lisa Ann",
    tags: ["MILF", "brunette", "mature"],
    dna: {
      identity: { gender: "female", age: 52, ethnicity: "white", archetype: "femme fatale", name: "Lisa Ann" },
      physique: { height: "average", body_type: "hourglass", muscularity: 25, curves: 80, exaggeration: 55, bust: "very large", bust_shape: "augmented", butt: "large", thighs: "thick", hips: "wide", waist: "slim", shoulders: "average", legs: "average" },
      face: { eye_shape: "almond", eye_color: "hazel", jawline: "defined", nose: "straight", lips: "full", expression: "sultry" },
      hair: { style: "straight", length: "shoulder", color: "jet black", texture: "medium", bangs: "curtain" },
      skin: { tone: "tan", texture: "dewy" },
    },
  },
  {
    name: "Sara Jay",
    tags: ["MILF", "blonde", "huge bust"],
    dna: {
      identity: { gender: "female", age: 47, ethnicity: "white", archetype: "queen", name: "Sara Jay" },
      physique: { height: "average", body_type: "hourglass", muscularity: 20, curves: 90, exaggeration: 65, bust: "enormous", bust_shape: "augmented", butt: "large", thighs: "thick", hips: "very wide", waist: "cinched", shoulders: "average", legs: "average" },
      face: { eye_shape: "almond", eye_color: "hazel", jawline: "defined", nose: "straight", lips: "full", expression: "sultry" },
      hair: { style: "wavy", length: "long", color: "platinum blonde", texture: "thick", bangs: "curtain" },
      skin: { tone: "tan", texture: "dewy", tattoos: "" },
    },
  },
  {
    name: "Kelly Divine",
    tags: ["huge butt", "brunette", "PAWG"],
    dna: {
      identity: { gender: "female", age: 36, ethnicity: "white", archetype: "bombshell", name: "Kelly Divine" },
      physique: { height: "average", body_type: "pear", muscularity: 25, curves: 95, exaggeration: 75, bust: "large", bust_shape: "natural", butt: "hyper", thighs: "very thick", hips: "extreme", waist: "cinched", shoulders: "narrow", legs: "average" },
      face: { eye_shape: "almond", eye_color: "green", jawline: "soft", nose: "button", lips: "full", expression: "sultry" },
      hair: { style: "wavy", length: "long", color: "chestnut", texture: "thick", bangs: "none" },
      skin: { tone: "tan", texture: "dewy" },
    },
  },
  {
    name: "Riley Reid",
    tags: ["petite", "brunette", "young adult"],
    dna: {
      identity: { gender: "female", age: 28, ethnicity: "white", archetype: "girl next door", name: "Riley Reid" },
      physique: { height: "petite", body_type: "slim", muscularity: 35, curves: 45, exaggeration: 10, bust: "small", bust_shape: "perky", butt: "toned", thighs: "toned", hips: "narrow", waist: "slim", shoulders: "narrow", legs: "average" },
      face: { eye_shape: "round", eye_color: "hazel", jawline: "soft", nose: "button", lips: "medium", expression: "playful" },
      hair: { style: "wavy", length: "long", color: "chestnut", texture: "medium", bangs: "curtain" },
      skin: { tone: "fair", texture: "smooth", freckles: "light" },
    },
  },
  {
    name: "Mia Malkova",
    tags: ["blonde", "athletic", "fit"],
    dna: {
      identity: { gender: "female", age: 30, ethnicity: "white", archetype: "athlete", name: "Mia Malkova" },
      physique: { height: "average", body_type: "athletic", muscularity: 65, curves: 60, exaggeration: 20, bust: "medium", bust_shape: "perky", butt: "bubble", thighs: "toned", hips: "average", waist: "slim", shoulders: "average", legs: "long" },
      face: { eye_shape: "almond", eye_color: "blue", jawline: "defined", nose: "straight", lips: "medium", expression: "sultry" },
      hair: { style: "wavy", length: "long", color: "honey blonde", texture: "medium", bangs: "none" },
      skin: { tone: "fair", texture: "dewy", glow: 55 },
    },
  },
  {
    name: "Alexis Texas",
    tags: ["blonde", "big butt", "PAWG"],
    dna: {
      identity: { gender: "female", age: 36, ethnicity: "white", archetype: "bombshell", name: "Alexis Texas" },
      physique: { height: "average", body_type: "pear", muscularity: 40, curves: 85, exaggeration: 60, bust: "large", bust_shape: "natural", butt: "very large", thighs: "very thick", hips: "very wide", waist: "cinched", shoulders: "average", legs: "average" },
      face: { eye_shape: "almond", eye_color: "blue", jawline: "defined", nose: "straight", lips: "full", expression: "sultry" },
      hair: { style: "wavy", length: "long", color: "honey blonde", texture: "thick", bangs: "curtain" },
      skin: { tone: "tan", texture: "dewy" },
    },
  },
  {
    name: "Sommer Ray",
    tags: ["fitness", "curvy", "tan"],
    dna: {
      identity: { gender: "female", age: 28, ethnicity: "white", archetype: "athlete", name: "Sommer Ray" },
      physique: { height: "average", body_type: "hourglass", muscularity: 65, curves: 85, exaggeration: 45, bust: "medium", bust_shape: "perky", butt: "bubble", thighs: "toned", hips: "wide", waist: "tiny", shoulders: "average", legs: "long" },
      face: { eye_shape: "almond", eye_color: "hazel", jawline: "defined", nose: "straight", lips: "medium", expression: "playful" },
      hair: { style: "wavy", length: "long", color: "chestnut", texture: "medium", bangs: "none" },
      skin: { tone: "tan", texture: "dewy", glow: 70 },
    },
  },
];
