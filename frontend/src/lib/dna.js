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

// Build positive/negative prompts from DNA — Venice-style structured formula:
// [QUALITY] + [SUBJECT] + [OUTFIT] + [POSE] + [SCENE] + [LIGHTING] + [CAMERA] + [STYLE] + [EXPLICIT]
export function buildPrompts(dna = {}) {
  // Value + expansion helpers
  const val = (section, field) => dna?.[section]?.[field] || "";
  const exp = (section, field) => {
    const v = val(section, field);
    return v ? expandPrompt(section, field, v) : "";
  };
  const join = (parts, sep = ", ") => parts.filter((p) => p && String(p).trim()).map(String).join(sep);

  // -------- 1. QUALITY (leading) --------
  const st = dna.style || {};
  const genre = exp("style", "render") || "photorealistic photograph";
  const quality = join(["photorealistic", "hyperrealistic", "editorial photograph", "8K UHD", "highly detailed"]);

  // -------- 2. SUBJECT (age + ethnicity + skin + body + face + hair) --------
  const id = dna.identity || {};
  const ph = dna.physique || {};
  const face = dna.face || {};
  const hair = dna.hair || {};
  const skin = dna.skin || {};
  const im = dna.intimate || {};

  const ex = Number(ph.exaggeration || 0);
  const exaggerate = (label) => {
    if (!label) return "";
    if (ex >= 85) return `hyper-exaggerated cartoonishly ${label}`;
    if (ex >= 65) return `dramatically exaggerated ${label}`;
    if (ex >= 40) return `enhanced ${label}`;
    return label;
  };

  const ageStr = id.age ? `${id.age}-year-old` : "";
  const ethn = exp("identity", "ethnicity") || "woman";
  const gender = id.gender && id.gender !== "female" ? id.gender : "woman";
  const skinTone = exp("skin", "tone") || (skin.tone ? `${skin.tone} skin` : "");
  const bodyType = exp("physique", "body_type");
  const height = ph.height && ph.height !== "average" ? `${ph.height} height` : "";
  const musc = ph.muscularity > 85 ? "highly muscular fitness physique"
             : ph.muscularity > 60 ? "athletic toned build" : "";
  const curves = ph.curves > 85 ? "extremely curvaceous dramatic hourglass"
               : ph.curves > 60 ? "voluptuous curvy body" : "";

  const subjectHead = join([
    ageStr,
    ethn,
    gender.includes("woman") || ethn.includes("woman") ? "" : gender,
  ]);

  const subjectBody = join([
    skinTone,
    bodyType,
    height,
    musc,
    curves,
    exaggerate(exp("physique", "bust") || (ph.bust && `${ph.bust} breasts`)),
    exp("physique", "bust_shape"),
    exaggerate(exp("physique", "butt") || (ph.butt && `${ph.butt} butt`)),
    exaggerate(exp("physique", "thighs") || (ph.thighs && `${ph.thighs} thighs`)),
    exaggerate(exp("physique", "hips") || (ph.hips && `${ph.hips} hips`)),
    exp("physique", "waist"),
    ph.shoulders && ph.shoulders !== "average" && exp("physique", "shoulders"),
    ph.legs && ph.legs !== "average" && exp("physique", "legs"),
    ex >= 75 ? "stylized exaggerated body proportions, extreme feminine silhouette" : "",
    ph.proportions,
  ]);

  const subjectFace = join([
    exp("face", "eye_shape"),
    exp("face", "eye_color"),
    exp("face", "jawline"),
    face.nose && `${face.nose} nose`,
    exp("face", "lips"),
    exp("face", "expression"),
  ]);

  const hairStr = (hair.length || hair.style || hair.color)
    ? [exp("hair", "length"), exp("hair", "style"), exp("hair", "color")].filter(Boolean).join(", ")
    : "";
  const hairExtras = join([
    hair.bangs && hair.bangs !== "none" && `${hair.bangs} bangs`,
    hair.texture && `${hair.texture} hair texture`,
  ]);

  const skinDetails = join([
    exp("skin", "texture"),
    skin.freckles && skin.freckles !== "none" && exp("skin", "freckles"),
    skin.tattoos,
    skin.glow > 85 ? "oiled glistening sweaty body, wet shine on skin"
      : skin.glow > 60 ? "dewy glowing luminous skin, healthy sheen" : "",
  ]);

  const nameTag = id.name ? `portrait of ${id.name}` : "";

  const subject = join([nameTag, subjectHead, subjectBody, subjectFace, hairStr, hairExtras, skinDetails]);

  // -------- 3. OUTFIT --------
  const wd = dna.wardrobe || {};
  const outfitPieces = [];
  if (wd.outfit_preset) outfitPieces.push(exp("wardrobe", "outfit_preset"));
  if (wd.top && wd.top !== "none") outfitPieces.push(exp("wardrobe", "top"));
  if (wd.bottom && wd.bottom !== "none") outfitPieces.push(exp("wardrobe", "bottom"));
  if (wd.underwear && wd.underwear !== "none") outfitPieces.push(exp("wardrobe", "underwear"));
  if (wd.footwear && wd.footwear !== "barefoot") outfitPieces.push(exp("wardrobe", "footwear"));
  if (wd.accessories && wd.accessories !== "none") outfitPieces.push(exp("wardrobe", "accessories"));
  const outfitCore = outfitPieces.length ? `wearing ${outfitPieces.join(", ")}` : "";
  const outfitTail = join([
    exp("wardrobe", "material"),
    wd.palette && `${wd.palette} color palette`,
    wd.fit && `${wd.fit} fit`,
    wd.state && wd.state !== "fully clothed" && exp("wardrobe", "state"),
  ]);
  const outfit = join([outfitCore, outfitTail]);

  // -------- 4. POSE --------
  const pose = dna.pose || {};
  const poseCore = exp("pose", "action");
  const poseFraming = join([
    exp("pose", "angle"),
    exp("pose", "distance"),
    pose.focus && pose.focus !== "full frame" && exp("pose", "focus"),
  ]);
  const poseDetails = join([
    pose.hands && exp("pose", "hands"),
    exp("pose", "body_language"),
  ]);
  const poseStr = join([poseCore, poseFraming, poseDetails]);

  // -------- 5. SCENE --------
  const scene = dna.scene || {};
  const scenePieces = [
    scene.environment && `in a ${exp("scene", "environment")}`,
    scene.background,
    exp("scene", "era"),
    scene.props && `with ${scene.props}`,
  ];
  const sceneStr = join(scenePieces);

  // -------- 6. LIGHTING --------
  const lg = dna.lighting || {};
  const lightingStr = join([
    lg.source && exp("lighting", "source"),
    lg.direction && `${lg.direction} lighting direction`,
    lg.color_temp && `${lg.color_temp} color temperature`,
    exp("lighting", "style"),
    exp("lighting", "mood"),
  ]);

  // -------- 7. CAMERA --------
  const cam = dna.camera || {};
  const camStr = join([
    cam.lens && `shot on ${exp("camera", "lens")}`,
    exp("camera", "aperture"),
    cam.angle && `${cam.angle} camera angle`,
    cam.aspect_ratio && `${cam.aspect_ratio} aspect ratio`,
  ]);

  // -------- 8. STYLE --------
  const styleStr = join([
    genre,
    st.film_grain && st.film_grain !== "none" && `${st.film_grain} film grain`,
    exp("style", "artistic_tone"),
    st.extra,
  ]);

  // -------- 9. EXPLICIT DETAILS (scenario + intimate) --------
  const sc = dna.scenario || {};
  const intensity = Number(sc.intensity || 0);
  const intensityTag = intensity >= 85 ? "extreme hardcore XXX pornographic scene, explicit uncensored"
                     : intensity >= 65 ? "hardcore explicit adult scene, uncensored NSFW"
                     : intensity >= 40 ? "explicit adult content, NSFW"
                     : intensity >= 20 ? "sensual softcore, tasteful nude" : "";

  const scenarioStr = join([
    sc.cast_size && sc.cast_size !== "solo" && exp("scenario", "cast_size"),
    sc.cast_type && sc.cast_type !== "none" && exp("scenario", "cast_type"),
    sc.roleplay && sc.roleplay !== "none" && exp("scenario", "roleplay"),
    sc.acts && sc.acts !== "none" && exp("scenario", "acts"),
    intensityTag,
    sc.extra_acts,
  ]);

  const intimateStr = join([
    exp("intimate", "pubic_hair"),
    exp("intimate", "pussy"),
    im.clit && im.clit !== "hidden" && exp("intimate", "clit"),
    im.asshole && im.asshole !== "hidden" && exp("intimate", "asshole"),
    exp("intimate", "nipples"),
    exp("intimate", "areolas"),
    im.body_hair && im.body_hair !== "hairless" && exp("intimate", "body_hair"),
    im.piercings && im.piercings !== "none" && exp("intimate", "piercings"),
  ]);

  // Anatomical accuracy phrases — only added when the scene calls for it
  const hasExplicit = scenarioStr || intimateStr || intensity > 0;
  const anatomyStr = hasExplicit
    ? "detailed anatomy with natural proportions, anatomically correct body, realistic weight distribution, natural breast shape with realistic gravity, detailed vulva, visible labia, realistic skin flush, natural moisture"
    : "detailed anatomy with natural proportions, anatomically correct body, natural weight distribution";

  // -------- Quality suffix (technical grade) --------
  const qualityTail = "masterpiece, best quality, ultra-detailed, 8k resolution, sharp focus, professional photography, realistic skin texture with visible pores, detailed eyes with catchlights, physically accurate lighting, award-winning composition";

  // Assemble in Venice order
  const positive = join([
    quality,
    subject,
    outfit,
    poseStr,
    sceneStr,
    lightingStr,
    camStr,
    styleStr,
    scenarioStr,
    intimateStr,
    anatomyStr,
    qualityTail,
  ]);

  const negative = [
    "low quality, worst quality, blurry, out of focus, jpeg artifacts, compression artifacts, noisy",
    "deformed, disfigured, mutated, extra fingers, missing fingers, fused fingers, extra limbs, missing limbs, mutated hands, poorly drawn hands, bad anatomy, bad proportions, unnatural body, floating limbs, disconnected limbs",
    "poorly drawn face, asymmetric face, cross-eyed, poorly drawn eyes, dead eyes, ugly, unattractive",
    "cartoon, anime, 3d render, cgi, painting, illustration, drawing, sketch, doll-like, plastic skin, airbrushed, wax figure, uncanny valley, overly smooth skin, plastic appearance",
    "watermark, signature, text, username, logo, artist name, cropped, frame, border",
    "underage, child, teen, young girl, minor, loli, shota",
    "overexposed, underexposed, harsh flash, oversaturated, washed out, blown highlights, crushed blacks",
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
