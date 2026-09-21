// DNA schema + prompt builder + randomizer
import { expandPrompt } from "@/lib/promptMap";

export const SECTIONS = [
  {
    key: "identity",
    title: "Identity",
    fields: [
      { key: "gender", type: "chips", label: "Gender", options: ["female", "male", "non-binary", "androgynous"] },
      { key: "age", type: "slider", label: "Age", min: 18, max: 70, step: 1 },
      { key: "ethnicity", type: "chips", label: "Ethnicity", groups: [
        { name: "Latin", options: ["latina", "mexican", "brazilian", "colombian", "puerto rican", "cuban", "dominican", "venezuelan", "argentinian", "peruvian"] },
        { name: "East Asian", options: ["east asian", "japanese", "korean", "chinese", "vietnamese", "thai", "filipina", "indonesian", "cambodian"] },
        { name: "South Asian", options: ["south asian", "indian", "pakistani", "bangladeshi", "sri lankan"] },
        { name: "Black", options: ["black", "african american", "ebony", "afro-caribbean", "nigerian", "ethiopian", "somali"] },
        { name: "European", options: ["white", "caucasian", "european", "british", "french", "german", "italian", "spanish", "irish", "russian", "polish"] },
        { name: "Nordic", options: ["nordic", "scandinavian", "swedish", "norwegian", "icelandic"] },
        { name: "Middle Eastern", options: ["middle eastern", "arab", "persian", "turkish", "lebanese", "egyptian", "moroccan", "israeli"] },
        { name: "Islander", options: ["polynesian", "hawaiian", "samoan", "maori"] },
        { name: "Indigenous", options: ["native american", "indigenous"] },
        { name: "Mixed", options: ["mixed", "blasian", "afro-latina", "eurasian", "mulatto", "mestiza", "creole", "amerasian"] },
        { name: "Mediterranean", options: ["mediterranean", "greek"] },
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
      { key: "cum_state", type: "chips_multi", label: "Cum / mess (pick many)", groups: [
        { name: "Facial", options: ["cum on face", "cum in mouth open display", "cum in mouth held", "cum on lips", "cum on eyelashes", "cum in hair"] },
        { name: "Body", options: ["cum on tits", "cum on ass", "cum on stomach", "cum on thighs", "cum-covered whole body", "cum drenched"] },
        { name: "Holes", options: ["fresh creampie", "dripping creampie", "gaping creampie", "anal creampie", "ass-to-mouth", "pooled cum"] },
        { name: "Play", options: ["snowballing", "cum swap kiss", "cum drool", "cum gargle", "swallowing cum"] },
      ]},
      { key: "saliva", type: "chips_multi", label: "Saliva / spit (pick many)", options: ["glossy wet lips", "spit strand", "drool from mouth", "drool from chin", "spit trail chin to tits", "spit-covered cock", "spit shine on lips", "sloppy spit"] },
      { key: "squirt", type: "chips", label: "Squirt", options: ["none", "light squirt", "gushing squirt", "arcing stream", "mid-squirt", "post-squirt puddle", "squirting on face"] },
      { key: "lactation", type: "chips", label: "Lactation / milk", options: ["none", "lactating", "milk drip", "milk spray", "breastfeeding", "cow-milked"] },
      { key: "sweat", type: "chips", label: "Sweat", options: ["none", "dewy", "glistening", "sweat-drenched", "sweat on brow", "sweat between tits", "wet sheen everywhere"] },
      { key: "lube", type: "chips", label: "Lube / oil", options: ["none", "glossy", "dripping lube", "oiled up", "baby oil sheen"] },
      { key: "tears", type: "chips", label: "Tears", options: ["none", "single tear", "mascara tears", "ugly cry", "tear-streaked face"] },
    ],
  },
  {
    key: "feet",
    title: "Feet",
    fields: [
      { key: "sole_presentation", type: "pose_chips", label: "Sole presentation", groups: [
        { name: "Presentation", options: ["soles up", "soles together", "sole showcase", "sole toward camera", "one sole raised"] },
        { name: "Detail", options: ["wrinkled soles", "smooth soles", "oiled soles", "dirty soles", "muddy soles", "freshly washed"] },
      ]},
      { key: "toes", type: "chips_multi", label: "Toe action (pick many)", options: ["toe curl", "toe spread", "toe point", "toe suck", "toe ring", "toe scrunch", "big toe out", "toes in mouth"] },
      { key: "arch", type: "chips", label: "Arch style", options: ["high arch", "medium arch", "flat arch", "defined arch", "banana arch"] },
      { key: "pedicure", type: "chips", label: "Pedicure", options: ["natural nails", "painted red", "painted black", "painted french", "painted pink", "chipped polish", "long nails", "sharp claws", "glitter polish"] },
      { key: "foot_size", type: "chips", label: "Foot size", options: ["petite", "average", "large", "size queen"] },
      { key: "foot_state", type: "chips_multi", label: "Foot state (pick many)", options: ["bare", "sweaty", "oiled", "dirty", "muddy", "freshly washed", "in nylons", "in socks", "stinky", "cum on feet", "cum on soles"] },
      { key: "hosiery", type: "chips", label: "Hosiery", groups: [
        { name: "Bare / sheer", options: ["bare", "sheer stockings", "toeless stockings", "footed stockings", "pantyhose", "ripped pantyhose"] },
        { name: "Fishnet", options: ["fishnet stockings", "toeless fishnets", "ripped fishnets"] },
        { name: "Socks", options: ["ankle socks", "gym socks", "knee-high socks", "thigh-high socks", "over-the-knee socks", "dirty socks", "sweaty socks"] },
      ]},
      { key: "foot_act", type: "chips_multi", label: "Foot act (pick many)", groups: [
        { name: "Solo", options: ["foot showcase", "foot posing", "foot tease", "arched foot", "toe suck self"] },
        { name: "Worship", options: ["foot worship", "sole licking", "toe sucking", "foot kissing", "foot massage"] },
        { name: "Sex", options: ["footjob", "double footjob", "foot on cock", "foot in mouth POV"] },
        { name: "Dominance", options: ["foot on face", "foot smothering", "trampling", "standing on someone", "foot gag"] },
        { name: "Mess", options: ["cum on feet", "cum on soles", "cum between toes"] },
      ]},
      { key: "framing", type: "chips", label: "Framing", options: ["full body", "waist-down", "knees-down", "feet close-up", "sole close-up", "POV under foot", "low angle sole"] },
    ],
  },
  {
    key: "wardrobe",
    title: "Wardrobe",
    fields: [
      { key: "outfit_preset", type: "chips", label: "Outfit preset", groups: [
        { name: "Bare", options: ["nude", "topless", "bottomless", "just panties", "just a shirt", "boyfriend's shirt"] },
        { name: "Lingerie", options: ["boudoir lingerie", "sheer negligee", "silk robe open"] },
        { name: "Bikini", options: ["bikini", "micro bikini", "string bikini", "wet t-shirt"] },
        { name: "Roleplay", options: ["sexy schoolgirl", "naughty nurse", "french maid", "playboy bunny", "showgirl", "cheerleader", "secretary unbuttoned", "librarian undone", "biker chick", "cowgirl chaps", "cop uniform undone", "flight attendant undone"] },
        { name: "Fetish/Kink", options: ["dominatrix", "leather mistress", "latex catsuit", "kinky harness", "shibari rope", "fetish gimp"] },
        { name: "Adult Perf.", options: ["pole dancer", "gogo dancer", "stripper"] },
        { name: "Formal", options: ["cocktail dress", "evening gown slit", "backless red carpet", "club outfit"] },
        { name: "Athletic", options: ["yoga wear", "gym set", "sports bra and shorts", "cheerleader off-duty"] },
        { name: "Casual", options: ["streetwear", "casual home"] },
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
      { key: "accessories", type: "chips_multi", label: "Accessories (pick many)", options: [
        "choker", "leather collar", "leash", "handcuffs", "gloves", "opera gloves", "fishnet gloves", "garters", "stockings", "veil", "cat ears", "bunny ears", "devil horns", "angel wings", "sunglasses", "jewelry", "body chain", "belly chain"
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
      { key: "action", type: "pose_chips", label: "Pose", groups: [
        { name: "Standing", options: ["standing", "standing hip out", "standing hands on hips", "standing arms up", "standing back arched", "standing legs apart", "standing splits", "walking"] },
        { name: "Leaning", options: ["leaning wall", "leaning forward", "bending over"] },
        { name: "Sitting", options: ["sitting legs crossed", "sitting legs open", "sitting reverse chair", "sitting on edge"] },
        { name: "Kneeling", options: ["kneeling upright", "kneeling back arched", "kneeling hands floor"] },
        { name: "Lying", options: ["lying back", "lying side", "lying stomach", "lying legs spread", "lying legs up", "on back legs up"] },
        { name: "All Fours", options: ["all fours", "doggy arched", "doggy low"] },
        { name: "Squatting", options: ["squatting", "squatting spread", "squatting deep"] },
        { name: "Cinematic", options: ["over shoulder look", "arched on knees", "hands on knees", "hair flip", "dancing", "reverse view"] },
      ]},
      { key: "angle", type: "chips", label: "Camera angle", options: ["front", "3/4", "profile", "back", "over-shoulder", "from above", "from below", "pov"] },
      { key: "distance", type: "chips", label: "Framing", options: ["close-up", "portrait", "waist-up", "full body", "wide shot", "detail shot"] },
      { key: "focus", type: "chips", label: "Focus on", options: ["face", "body", "breasts", "butt", "hips", "legs", "feet", "hands", "full frame"] },
      { key: "hands", type: "chips_multi", label: "Hands (pick many)", options: ["at sides", "on hips", "in hair", "touching body", "on breasts", "between legs", "gripping something", "over head", "behind back", "behind head"] },
      { key: "body_language", type: "chips", label: "Vibe", options: ["confident", "relaxed", "intimate", "playful", "powerful", "vulnerable", "sultry", "coy", "come-hither", "dominant", "submissive", "teasing"] },
    ],
  },
  {
    key: "kink",
    title: "Kink",
    fields: [
      { key: "restraint", type: "chips_multi", label: "Restraint (pick many)", options: [
        "rope shibari", "hemp bondage", "leather cuffs", "metal handcuffs", "straitjacket", "spreader bar",
        "hogtie", "suspension", "chair-tied", "tied to bed", "wrists overhead", "ankle cuffs", "thigh cuffs",
        "chastity cage", "chastity belt", "collar and leash", "arms behind back", "frogtie",
      ]},
      { key: "gag", type: "chips_multi", label: "Gag (pick many)", options: [
        "ball gag", "ring gag", "bit gag", "cleave gag", "tape gag", "panty gag", "drool bib", "dildo gag", "muzzle", "spider gag",
      ]},
      { key: "marks", type: "chips_multi", label: "Impact & marks (pick many)", options: [
        "spanking", "red handprint", "paddled", "caned", "whipped", "cropped", "welts",
        "bruises", "rope marks", "scratched", "bite marks", "hickeys", "belt marks",
      ]},
      { key: "sensation", type: "chips_multi", label: "Sensation play (pick many)", options: [
        "wax play", "hot wax on tits", "ice play", "electro pads", "needle play", "clothespins",
        "clover clamps", "nipple clamps", "clamps with weights", "tit slaps", "nipple twist", "hair pulling",
      ]},
      { key: "humiliation", type: "chips_multi", label: "Humiliation / degradation (pick many)", groups: [
        { name: "Pet play", options: ["collared pet", "puppy hood", "kitten ears and tail plug", "ponygirl gear", "on all fours pet", "leash walk", "food bowl"] },
        { name: "Degradation", options: ["degradation stare", "spit on face", "face-fucked", "used", "wrecked", "spit-drenched"] },
        { name: "Ahegao / mind-break", options: ["ahegao expression", "mind-break", "tongue-out", "rolled-back eyes", "drooling", "mascara tears", "slut-face"] },
      ]},
      { key: "orgasm_control", type: "chips_multi", label: "Orgasm control (pick many)", options: [
        "edged", "denied", "ruined orgasm", "forced orgasm", "hitachi torture", "overstimulation",
        "post-orgasm torture", "chastity release", "milked dry", "back-to-back orgasms",
      ]},
      { key: "power_dynamic", type: "chips", label: "Power dynamic", options: [
        "none", "dominant", "submissive", "brat", "switch",
        "master and slave", "mistress and slave", "owner and pet", "princess and daddy dom", "mommy dom and boy",
        "slut in training", "goddess and worshipper",
      ]},
      { key: "group_kink", type: "chips_multi", label: "Group kink (pick many)", options: [
        "gangbang", "train", "double penetration", "triple penetration", "air-tight",
        "bukkake", "blowbang", "spitroast", "eiffel tower",
      ]},
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
      { key: "roleplay", type: "chips", label: "Role", groups: [
        { name: "MILF & Family", options: ["sexy stepmom", "hot aunt", "sexy granny", "milf", "cougar", "sugar mommy", "lonely housewife", "trophy wife", "best friend's mom", "step-sister"] },
        { name: "School", options: ["schoolgirl", "college coed", "sorority girl", "cheerleader", "librarian", "teacher"] },
        { name: "Office", options: ["secretary", "boss lady"] },
        { name: "Medical", options: ["nurse", "doctor"] },
        { name: "Fitness", options: ["yoga instructor", "personal trainer"] },
        { name: "Service", options: ["maid", "waitress", "flight attendant"] },
        { name: "Kink", options: ["dominatrix", "submissive"] },
        { name: "Alt", options: ["gothic girl", "e-girl"] },
        { name: "Adult", options: ["onlyfans model", "cam girl", "porn star", "girl next door"] },
      ]},
      { key: "acts", type: "chips_multi", label: "Explicit acts (pick many)", groups: [
        { name: "Solo/Tease", options: ["posing", "teasing", "stripping", "flashing", "upskirt", "exposed", "spread eagle", "spreading pussy"] },
        { name: "Toys/Solo", options: ["masturbating", "fingering", "using dildo", "using vibrator", "using rabbit", "riding toy"] },
        { name: "Oral", options: ["oral", "blowjob", "deepthroat", "throatpie", "titfucking", "handjob", "eating pussy", "sixty-nine", "rimming"] },
        { name: "Vaginal", options: ["missionary", "cowgirl", "reverse cowgirl", "doggy style", "prone bone", "spooning", "standing sex", "against wall", "table sex", "bent over", "legs on shoulders", "amazon position"] },
        { name: "Anal", options: ["anal", "anal doggy", "anal reverse cowgirl"] },
        { name: "DP", options: ["double penetration", "DAP", "DVP", "DP"] },
        { name: "Cum", options: ["creampie", "cumshot", "facial", "bukkake", "cum on tits", "cum on ass", "cum on face", "swallowing", "squirting"] },
        { name: "Extreme insertion", options: ["fisting", "fisting deep", "double fisting", "fisting anal", "prolapse", "gaping", "gaping wide", "stretched", "stretched hole", "object insertion", "bottle insertion"] },
        { name: "Rough / brutal", options: ["throat-fuck", "gagging", "choking hands on throat", "hair pulled hard", "slapped mid-fuck", "face-slapped", "hate-fuck framing"] },
        { name: "Cum play", options: ["snowballing", "cum-sharing kiss", "cum swap", "cum drool", "cum gargle", "bukkake shower", "cum drenched"] },
        { name: "Fantasy", options: ["cnc roleplay", "captured", "tentacle", "monster", "alien", "breeding kink", "impregnation kink", "pregnancy belly", "ahegao mid-cum", "mind-broken"] },
        { name: "Lesbian", options: ["lesbian", "tribbing", "scissoring", "strap-on", "facesitting"] },
        { name: "BDSM", options: ["bondage", "shibari", "tied up", "collared and leashed", "spanking", "gagged"] },
      ]},
      { key: "explicit_level", type: "slider", label: "Explicit level (softcore → depraved)", min: 0, max: 100, step: 1 },
      { key: "kink_level", type: "slider", label: "Kink level (vanilla → extreme kink)", min: 0, max: 100, step: 1 },
      { key: "extra_acts", type: "text", label: "Additional acts / notes" },
    ],
  },
  {
    key: "watersports",
    title: "Watersports",
    fields: [
      { key: "source", type: "chips", label: "Source", options: ["none", "self", "partner", "mutual", "group", "unknown POV"] },
      { key: "direction", type: "chips_multi", label: "Direction (pick many)", options: [
        "in mouth", "on face", "on tits", "on ass", "on feet", "on floor", "on another person",
        "inside pussy", "inside ass", "held in", "forced held-in",
      ]},
      { key: "stream", type: "chips", label: "Stream state", options: ["trickle", "steady stream", "gush", "spray", "arc", "pooling", "explosive"] },
      { key: "container", type: "chips", label: "Container / context", options: ["toilet", "tub", "shower", "outdoors", "in panties", "in jeans", "on bed", "into glass", "into cup", "through funnel", "public"] },
      { key: "wetness", type: "chips_multi", label: "Wetness (pick many)", options: [
        "dry", "damp", "soaked panties", "soaked jeans", "dripping thighs", "puddle at feet", "running down legs", "wet floor",
      ]},
      { key: "desperation", type: "chips", label: "Desperation", options: ["none", "calm", "needy", "holding it", "about to burst", "losing control", "humiliated"] },
      { key: "aftermath", type: "chips_multi", label: "Aftermath (pick many)", options: [
        "glistening skin", "wet hair", "wet clothes", "matted fur", "standing in puddle", "smeared mascara", "post-piss glow",
      ]},
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
    else if (f.type === "chips_multi") acc[s.key][f.key] = [];
    else acc[s.key][f.key] = "";
  });
  return acc;
}, {});

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Global/section randomize should not unexpectedly add fluids, mess, hosiery,
// or foot-play choices. Those remain user-controlled; Wet Dream is the explicit
// opt-in randomizer for them.
export const RANDOMIZE_PROTECTED_FIELDS = {
  intimate: new Set(["cum_state", "saliva", "squirt", "sweat", "lube", "tears"]),
  feet: new Set(["foot_state", "hosiery", "foot_act"]),
};

export function randomizeSection(sectionKey, current = {}, fieldLocks = {}, options = {}) {
  const section = SECTIONS.find((s) => s.key === sectionKey);
  const out = { ...current };
  const preserveProtected = options.preserveProtected !== false;
  section.fields.forEach((f) => {
    if (fieldLocks?.[f.key]) return; // per-field lock — keep current value
    if (preserveProtected && RANDOMIZE_PROTECTED_FIELDS[sectionKey]?.has(f.key)) return;
    if (f.type === "chips" || f.type === "pose_chips") {
      const pool = f.groups ? f.groups.flatMap((g) => g.options) : (f.options || []);
      if (pool.length) out[f.key] = pick(pool);
    }
    else if (f.type === "chips_multi") {
      const pool = f.groups ? f.groups.flatMap((g) => g.options) : (f.options || []);
      const n = 1 + Math.floor(Math.random() * 3); // 1-3 items
      const shuffled = [...pool].sort(() => Math.random() - 0.5);
      out[f.key] = shuffled.slice(0, n);
    }
    else if (f.type === "slider") out[f.key] = Math.floor(Math.random() * (f.max - f.min + 1)) + f.min;
    else if (f.type === "text") out[f.key] = out[f.key] || "";
  });
  return out;
}

export function randomizeDna(current = {}, locks = {}, fieldLocks = {}) {
  const out = { ...current };
  SECTIONS.forEach((s) => {
    if (locks[s.key]) return;
    out[s.key] = randomizeSection(s.key, current[s.key] || {}, fieldLocks?.[s.key] || {});
  });
  return out;
}

export function resetSection(sectionKey) {
  return { ...DEFAULT_DNA[sectionKey] };
}

// Phase groupings for the wizard rail — clusters 16 sections into 4 collapsible bands.
export const PHASES = [
  { key: "body",     label: "Body",     hint: "Who she is", sections: ["identity", "physique", "face", "hair", "skin"] },
  { key: "intimate", label: "Intimate", hint: "Anatomy & fluids", sections: ["intimate", "feet"] },
  { key: "style",    label: "Style",    hint: "How she's shot", sections: ["wardrobe", "pose", "scene", "lighting", "camera", "style"] },
  { key: "play",     label: "Play",     hint: "Kink & scenario", sections: ["kink", "scenario", "watersports"] },
];

export function phaseOfSection(sectionKey) {
  return PHASES.find((p) => p.sections.includes(sectionKey))?.key || "body";
}

// Returns true if the section has any user-set content beyond defaults.
export function isSectionFilled(sectionKey, dna) {
  const sec = dna?.[sectionKey];
  if (!sec) return false;
  const def = DEFAULT_DNA[sectionKey] || {};
  return Object.entries(sec).some(([k, v]) => {
    const dv = def[k];
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === "number") return v !== dv && v !== 0;
    if (typeof v === "string") return v && v !== dv && v !== "none";
    return v !== dv;
  });
}

// Spin the dice across ALL "Wet Dream" sections at once — feet + kink + watersports +
// intimate fluids/mess + scenario dials. Everything else (identity, physique, face, hair,
// wardrobe, scene, lighting, camera, style) is preserved. Respects `locks` so locked
// sections aren't touched.
export function randomizeWetDream(current = {}, locks = {}) {
  const out = { ...current };
  const targets = ["feet", "kink", "watersports"];
  targets.forEach((k) => {
    if (locks[k]) return;
    out[k] = randomizeSection(k, current[k] || {}, {}, { preserveProtected: false });
  });
  // Intimate — only shuffle the fluids/mess sub-block, keep anatomy fields intact
  if (!locks.intimate) {
    const im = { ...(current.intimate || {}) };
    const section = SECTIONS.find((s) => s.key === "intimate");
    const fluidsKeys = ["cum_state", "saliva", "squirt", "lactation", "sweat", "lube", "tears"];
    section.fields.forEach((f) => {
      if (!fluidsKeys.includes(f.key)) return;
      if (f.type === "chips_multi") {
        const pool = f.groups ? f.groups.flatMap((g) => g.options) : (f.options || []);
        const n = 1 + Math.floor(Math.random() * 3);
        im[f.key] = [...pool].sort(() => Math.random() - 0.5).slice(0, n);
      } else if (f.type === "chips") {
        const pool = f.groups ? f.groups.flatMap((g) => g.options) : (f.options || []);
        if (pool.length) im[f.key] = pool[Math.floor(Math.random() * pool.length)];
      }
    });
    out.intimate = im;
  }
  // Scenario — only shuffle the dual dials + push a couple of extra acts, keep cast/roleplay intact
  if (!locks.scenario) {
    const sc = { ...(current.scenario || {}) };
    sc.explicit_level = 40 + Math.floor(Math.random() * 61); // 40-100
    sc.kink_level = 30 + Math.floor(Math.random() * 71); // 30-100
    const section = SECTIONS.find((s) => s.key === "scenario");
    const actsField = section.fields.find((f) => f.key === "acts");
    const pool = actsField.groups ? actsField.groups.flatMap((g) => g.options) : (actsField.options || []);
    const existing = Array.isArray(sc.acts) ? sc.acts : [];
    const n = 1 + Math.floor(Math.random() * 3);
    const additions = [...pool].sort(() => Math.random() - 0.5).slice(0, n);
    sc.acts = Array.from(new Set([...existing, ...additions]));
    out.scenario = sc;
  }
  // Also nudge pose focus + lighting mood toward the "Wet Dream" aesthetic if unlocked
  if (!locks.pose) {
    const focusPool = ["face", "breasts", "hips", "feet", "full frame"];
    out.pose = { ...(current.pose || {}), focus: focusPool[Math.floor(Math.random() * focusPool.length)] };
  }
  return out;
}

// Sections whose DNA is per-subject in multi-subject scenes. Everything else is
// "shot-level" (shared) — read from the primary subject (Subject A).
export const SUBJECT_SCOPED_SECTIONS = [
  "identity", "physique", "face", "hair", "skin",
  "intimate", "feet", "wardrobe", "pose",
  "kink", "watersports",
];
export const SHARED_SECTIONS = ["scenario", "scene", "lighting", "camera", "style"];
export const MAX_SUBJECTS = 4;
const SUBJECT_LABELS = ["A", "B", "C", "D"];

// Small ID helper — enough uniqueness for local UI keys.
function _sid() {
  return Math.random().toString(36).slice(2, 10);
}

export function makeSubject({ label, dna: initialDna, fieldLocks, likeness } = {}) {
  return {
    id: _sid(),
    label: label || "A",
    dna: initialDna || JSON.parse(JSON.stringify(DEFAULT_DNA)),
    field_locks: fieldLocks || {},
    likeness: likeness || { enabled: false, node_id: "", lora_name: "", strength_model: 0.8, strength_clip: 0.8, trigger: "" },
  };
}

// Build the subjects array from a character doc, migrating legacy (single-dna) shape.
export function subjectsFromCharacter(character) {
  if (character && Array.isArray(character.subjects) && character.subjects.length > 0) {
    return character.subjects.map((s, i) => ({
      id: s.id || _sid(),
      label: s.label || SUBJECT_LABELS[i] || `S${i + 1}`,
      dna: { ...DEFAULT_DNA, ...(s.dna || {}) },
      field_locks: s.field_locks || {},
      likeness: s.likeness || { enabled: false, node_id: "", lora_name: "", strength_model: 0.8, strength_clip: 0.8, trigger: "" },
    }));
  }
  return [makeSubject({
    label: "A",
    dna: { ...DEFAULT_DNA, ...(character?.dna || {}) },
    fieldLocks: character?.field_locks || {},
  })];
}

// How many subjects a scenario currently expects (min 1).
export function expectedSubjectCount(dna = {}) {
  const sc = dna?.scenario || {};
  const cs = sc.cast_size || "solo";
  const ct = sc.cast_type || "none";
  const isPairing = ct && ct !== "none";
  if (cs === "orgy" || cs === "gangbang") return Math.min(MAX_SUBJECTS, 4);
  if (cs === "group") return Math.min(MAX_SUBJECTS, 4);
  if (cs === "foursome") return 4;
  if (cs === "threesome") return 3;
  if (cs === "duo") return 2;
  if (isPairing) return 2;
  return 1;
}

// Return sensible DNA overrides for the newly-added subject given the pairing on primary DNA.
// Only sets a few fields — never blocks user overrides. `subjectIndex` is the position of the
// NEW subject in the subjects array (1 = second, 2 = third, ...).
export function seedSubjectFromPairing(primaryDna = {}, subjectIndex = 1) {
  const sc = primaryDna?.scenario || {};
  const pairing = sc.cast_type || "none";
  const primaryAge = Number(primaryDna?.identity?.age || 0) || 0;
  const primaryEth = primaryDna?.identity?.ethnicity || "";
  const base = JSON.parse(JSON.stringify(DEFAULT_DNA));
  // Inherit ethnicity from primary by default (family scenes usually share heritage).
  if (primaryEth) base.identity.ethnicity = primaryEth;

  const setAge = (age) => { base.identity.age = age; };
  const setArchetype = (a) => { base.identity.archetype = a; };

  if (pairing === "twins" || pairing === "identical twins") {
    // Clone A verbatim (twins should look alike)
    return JSON.parse(JSON.stringify(primaryDna || DEFAULT_DNA));
  }
  if (pairing === "sisters") {
    const clone = JSON.parse(JSON.stringify(primaryDna || DEFAULT_DNA));
    const ageOffset = subjectIndex % 2 ? -3 : 3;
    clone.identity = { ...clone.identity, age: Math.max(21, (primaryAge || 27) + ageOffset), name: "" };
    // Preserve the recognizable family traits while allowing the user to edit either sister.
    clone.face = { ...clone.face, expression: DEFAULT_DNA.face.expression };
    return clone;
  }
  if (pairing === "best friends" || pairing === "roommates") {
    setAge(Math.max(21, primaryAge || 25));
  } else if (pairing === "mother and daughter") {
    // Clone inherited appearance, then create an unmistakable adult generation gap.
    const relative = JSON.parse(JSON.stringify(primaryDna || DEFAULT_DNA));
    const primaryIsMother = primaryAge >= 39;
    relative.identity = {
      ...relative.identity,
      age: primaryIsMother ? Math.max(21, primaryAge - 23) : Math.max(40, primaryAge + 23),
      archetype: primaryIsMother ? "girl next door" : "queen",
      name: "",
    };
    relative.face = { ...relative.face, expression: DEFAULT_DNA.face.expression };
    return relative;
  } else if (pairing === "stepmom and stepdaughter") {
    setAge(primaryAge >= 39 ? Math.max(21, primaryAge - 20) : Math.max(40, primaryAge + 20));
    setArchetype(primaryAge >= 39 ? "girl next door" : "queen");
  } else if (pairing === "aunt and niece") {
    setAge(22);
  } else if (pairing === "grandma and granddaughter" || pairing === "milf granny" || pairing === "mature and young") {
    setAge(22);
  } else if (pairing === "teacher and student" || pairing === "coach and athlete") {
    setAge(21); setArchetype("athlete");
  } else if (pairing === "boss and secretary") {
    setAge(26);
  } else if (pairing === "nurse and patient") {
    setAge(28);
  } else if (pairing === "dominant and submissive") {
    setAge(Math.max(21, primaryAge || 25));
    base.wardrobe.outfit_preset = "kinky harness";
  } else if (pairing === "wife and mistress") {
    setAge(Math.max(21, (primaryAge || 30) - 4));
  } else {
    // Fallback — a younger adult, roughly same age band
    setAge(Math.max(21, (primaryAge || 25) - 2));
  }
  // For subjectIndex > 1 (a third/fourth subject) — nudge to a slightly different age so the
  // group isn't a copy-paste.
  if (subjectIndex > 1) {
    base.identity.age = Math.max(21, (base.identity.age || 24) + (subjectIndex - 1) * 3);
  }
  return base;
}

export function subjectLabel(index) {
  return SUBJECT_LABELS[index] || `S${index + 1}`;
}

// Build positive/negative prompts from DNA — Venice-style structured formula:
// [QUALITY] + [SUBJECT] + [OUTFIT] + [POSE] + [SCENE] + [LIGHTING] + [CAMERA] + [STYLE] + [EXPLICIT]
export function buildPrompts(dna = {}, opts = {}) {
  const shared = _veniceSharedBlock(dna, opts, 1);
  const subject = _veniceSubjectBlock(dna, opts);
  const positive = _join([
    shared.qualityLead,
    shared.castHeadcount,
    shared.scenario && `PRIMARY SCENE ACTION — ${shared.scenario}`,
    subject.playPriority,
    subject.feetPriority,
    subject.subject,
    subject.outfit,
    subject.pose,
    shared.scene,
    shared.lighting,
    shared.camera,
    shared.style,
    subject.intimate,
    subject.fluids,
    shared.anatomy(subject.hasExplicit || shared.hasExplicit),
    shared.qualityTail,
  ]);
  const negative = _veniceNegative(shared.multiSubjectExpected);
  return { positive, negative };
}

// Multi-subject Venice prompt builder. Each subject contributes its own body/wardrobe/
// pose/intimate/feet/kink/watersports clause. Shared context (quality, scenario, scene,
// lighting, camera, style) is taken from the primary subject's DNA.
export function buildMultiVenicePrompts(subjects = [], opts = {}) {
  if (!Array.isArray(subjects) || subjects.length === 0) {
    return buildPrompts({}, opts);
  }
  if (subjects.length === 1) {
    return buildPrompts(subjects[0].dna || {}, opts);
  }
  const primary = subjects[0].dna || {};
  const shared = _veniceSharedBlock(primary, opts, subjects.length);
  const pairing = primary?.scenario?.cast_type || "none";
  const familyPairings = new Set(["twins", "identical twins", "sisters", "mother and daughter", "aunt and niece", "grandma and granddaughter"]);
  const familyScene = familyPairings.has(pairing);
  const clauses = subjects.map((s) => {
    const rawDna = s.dna || {};
    const subjectDna = familyScene && Number(rawDna?.identity?.age || 0) < 21
      ? { ...rawDna, identity: { ...(rawDna.identity || {}), age: 21 } }
      : rawDna;
    const clause = _veniceSubjectBlock(subjectDna, opts);
    const label = s.label || "A";
    return `Subject ${label} (${_subjectShortDescriptor(subjectDna)}): ${_join([
      clause.subject, clause.outfit, clause.pose,
      clause.intimate, clause.fluids,
    ])}`;
  });
  const priorityClauses = subjects.map((s) => {
    const clause = _veniceSubjectBlock(s.dna || {}, opts);
    const label = s.label || "A";
    return _join([
      clause.playPriority && `Subject ${label} ${clause.playPriority}`,
      clause.feetPriority && `Subject ${label} ${clause.feetPriority}`,
    ], "; ");
  }).filter(Boolean).join("; ");
  const anyExplicit = subjects.some((s) => _veniceSubjectBlock(s.dna || {}, opts).hasExplicit) || shared.hasExplicit;
  const positive = _join([
    shared.qualityLead,
    shared.castHeadcount,
    "clearly separated subjects, all subjects fully visible in the frame with distinct bodies and faces",
    familyScene && "all depicted people are adults age 21 or older, recognizable shared family resemblance in facial structure and heritage while preserving distinct adult identities",
    shared.scenario && `PRIMARY SCENE ACTION — ${shared.scenario}`,
    priorityClauses,
    clauses.join("; "),
    shared.scene,
    shared.lighting,
    shared.camera,
    shared.style,
    shared.anatomy(anyExplicit),
    shared.qualityTail,
  ]);
  const negative = _veniceNegative(true);
  return { positive, negative };
}

// Terse "Latina 34yo hourglass" descriptor for label parenthesis.
function _subjectShortDescriptor(dna = {}) {
  const id = dna.identity || {};
  const ph = dna.physique || {};
  const hair = dna.hair || {};
  return [
    id.age && `${id.age}yo`,
    id.ethnicity,
    ph.body_type,
    hair.color && hair.length && `${hair.color} ${hair.length} hair`,
  ].filter(Boolean).join(" ") || "adult woman";
}

const _join = (parts, sep = ", ") => parts.filter((p) => p && String(p).trim()).map(String).join(sep);

// -------- Shared shot-level block (quality, scenario, scene, lighting, camera, style) --------
function _veniceSharedBlock(dna = {}, opts = {}, subjectCount = 1) {
  const raunch = !!opts.raunch;
  const val = (section, field) => dna?.[section]?.[field] || "";
  const exp = (section, field) => {
    const v = val(section, field);
    return v ? expandPrompt(section, field, v, { raunch }) : "";
  };
  const join = _join;

  const st = dna.style || {};
  const genre = exp("style", "render") || "photorealistic photograph";
  const qualityLead = join(["photorealistic editorial photograph", "high detail", "natural color", "realistic texture"]);

  const sc0 = dna.scenario || {};
  const cs = sc0.cast_size || "solo";
  const ct = sc0.cast_type || "none";
  const isPairing = ct && ct !== "none";
  // Cast headcount — force multi-subject language when scenario says duo/threesome/pair
  // OR when we have >1 explicit subject fed in.
  const castHeadcount = (() => {
    const effectiveCount = Math.max(subjectCount, 1);
    if (effectiveCount >= 6 || cs === "gangbang" || cs === "orgy") return "multiple people in the frame, group scene, every subject clearly visible in the composition";
    if (effectiveCount >= 5 || cs === "group") return "five women in the frame, ensemble scene, every subject clearly visible";
    if (effectiveCount >= 4 || cs === "foursome") return "four women in the frame, all fully visible, full bodies of all four subjects shown";
    if (effectiveCount >= 3 || cs === "threesome") return "three women in the frame, all fully visible, full bodies of all three subjects shown";
    if (effectiveCount >= 2 || cs === "duo" || (isPairing && cs === "solo")) return "two women in the frame, both fully visible, full bodies of both subjects shown";
    return "";
  })();
  const multiSubjectExpected = !!castHeadcount;

  const scene = dna.scene || {};
  const sceneStr = join([
    scene.environment && `in a ${exp("scene", "environment")}`,
    scene.background,
    exp("scene", "era"),
    scene.props && `with ${scene.props}`,
  ]);
  const lg = dna.lighting || {};
  const lightingStr = join([
    lg.source && exp("lighting", "source"),
    lg.direction && `${lg.direction} lighting direction`,
    lg.color_temp && `${lg.color_temp} color temperature`,
    exp("lighting", "style"),
    exp("lighting", "mood"),
  ]);
  const cam = dna.camera || {};
  const camStr = join([
    cam.lens && `shot on ${exp("camera", "lens")}`,
    exp("camera", "aperture"),
    cam.angle && `${cam.angle} camera angle`,
    cam.aspect_ratio && `${cam.aspect_ratio} aspect ratio`,
  ]);
  const styleStr = join([
    genre,
    st.film_grain && st.film_grain !== "none" && `${st.film_grain} film grain`,
    exp("style", "artistic_tone"),
    st.extra,
  ]);

  const sc = dna.scenario || {};
  const explicitLevel = Number(sc.explicit_level ?? sc.intensity ?? 0);
  const kinkLevel = Number(sc.kink_level ?? 0);
  // Dials below 40 are treated as neutral defaults. Specific selected content
  // still appears through the intimate/kink/watersports blocks.
  const explicitTag = explicitLevel >= 85 ? "extreme depraved XXX hardcore, uncensored graphic pornographic scene"
                     : explicitLevel >= 65 ? "hardcore explicit adult scene, uncensored NSFW"
                     : explicitLevel > 40 ? "explicit adult content, NSFW" : "";
  const kinkTag = kinkLevel >= 85 ? "extreme hardcore BDSM, brutal kink, total power exchange, degradation and mind-break"
                 : kinkLevel >= 65 ? "hardcore kink scene, heavy BDSM, rough dominance and submission"
                 : kinkLevel > 40 ? "playful kink, light BDSM, teasing dominance" : "";

  const scenarioStr = join([
    sc.cast_size && sc.cast_size !== "solo" && exp("scenario", "cast_size"),
    sc.cast_type && sc.cast_type !== "none" && exp("scenario", "cast_type"),
    sc.roleplay && sc.roleplay !== "none" && exp("scenario", "roleplay"),
    Array.isArray(sc.acts)
      ? sc.acts.filter((a) => a && a !== "none").map((a) => expandPrompt("scenario", "acts", a, { raunch })).join(", ")
      : (sc.acts && sc.acts !== "none" && exp("scenario", "acts")),
    explicitTag,
    kinkTag,
    sc.extra_acts,
  ]);

  const qualityTail = "sharp focus, realistic skin texture with visible pores, physically accurate lighting";

  return {
    qualityLead,
    castHeadcount,
    multiSubjectExpected,
    scene: sceneStr,
    lighting: lightingStr,
    camera: camStr,
    style: styleStr,
    scenario: scenarioStr,
    qualityTail,
    hasExplicit: !!scenarioStr || explicitLevel > 0 || kinkLevel > 0,
    anatomy: (has) => has
      ? "detailed anatomy with natural proportions, anatomically correct body, realistic weight distribution, natural breast shape with realistic gravity, detailed vulva, visible labia, realistic skin flush, natural moisture"
      : "detailed anatomy with natural proportions, anatomically correct body, natural weight distribution",
  };
}

// -------- Per-subject Venice block (identity/body/face/hair/skin/wardrobe/pose/intimate/feet/kink/ws) --------
function _veniceSubjectBlock(dna = {}, opts = {}) {
  const raunch = !!opts.raunch;
  const val = (section, field) => dna?.[section]?.[field] || "";
  const exp = (section, field) => {
    const v = val(section, field);
    return v ? expandPrompt(section, field, v, { raunch }) : "";
  };
  const expArr = (section, field) => {
    const v = dna?.[section]?.[field];
    if (!Array.isArray(v)) return "";
    return v.filter(Boolean).map((x) => expandPrompt(section, field, x, { raunch })).join(", ");
  };
  const join = _join;

  const id = dna.identity || {};
  const ph = dna.physique || {};
  const face = dna.face || {};
  const hair = dna.hair || {};
  const skin = dna.skin || {};
  const im = dna.intimate || {};

  const ex = Number(ph.exaggeration || 0);

  const gender = id.gender === "male" ? "man"
    : id.gender === "non-binary" ? "non-binary adult"
    : id.gender === "androgynous" ? "androgynous adult"
    : "woman";
  const age = Number(id.age || 0);
  const ageBand = age >= 60 ? "older mature adult"
    : age >= 50 ? "early-to-late 50s"
    : age >= 45 ? "mid-to-late 40s"
    : age >= 40 ? "early 40s"
    : age >= 35 ? "mid-to-late 30s"
    : "";
  const ageStr = age >= 45
    ? `(${age}-year-old mature ${gender}:1.35), ${ageBand}, fine lines around the eyes and mouth, natural mature facial texture`
    : age >= 35
      ? `(${age}-year-old adult ${gender}:1.2), ${ageBand}, subtle expression lines`
      : age ? `${age}-year-old adult ${gender}` : `adult ${gender}`;
  const heritage = exp("identity", "ethnicity");
  const skinTone = exp("skin", "tone") || (skin.tone ? `${skin.tone} skin` : "");
  const bodyType = exp("physique", "body_type");
  const height = ph.height && ph.height !== "average" ? `${ph.height} height` : "";
  const musc = ph.muscularity > 85 ? "highly muscular fitness physique"
             : ph.muscularity > 60 ? "athletic toned build" : "";
  const curveBuiltIn = ["curvy", "voluptuous", "plus size", "hourglass", "bombshell"].includes(ph.body_type);
  const curveModifier = ph.curves > 85 && !curveBuiltIn ? "pronounced feminine curves"
                      : ph.curves > 60 && !curveBuiltIn ? "curved feminine silhouette" : "";
  const bodyProfileBase = join([bodyType, curveModifier]);
  const bodyProfile = ex >= 85 ? `hyper-exaggerated ${bodyProfileBase || "body proportions"}`
                    : ex >= 65 ? `dramatically exaggerated ${bodyProfileBase || "body proportions"}`
                    : ex >= 40 ? `enhanced ${bodyProfileBase || "body proportions"}`
                    : bodyProfileBase;

  const subjectHead = join([ageStr, heritage]);
  const subjectBody = join([
    skinTone,
    bodyProfile,
    height,
    musc,
    exp("physique", "bust") || (ph.bust && `${ph.bust} breasts`),
    exp("physique", "bust_shape"),
    exp("physique", "butt") || (ph.butt && `${ph.butt} butt`),
    exp("physique", "thighs") || (ph.thighs && `${ph.thighs} thighs`),
    exp("physique", "hips") || (ph.hips && `${ph.hips} hips`),
    exp("physique", "waist"),
    ph.shoulders && ph.shoulders !== "average" && exp("physique", "shoulders"),
    ph.legs && ph.legs !== "average" && exp("physique", "legs"),
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

  // -------- Wardrobe --------
  const wd = dna.wardrobe || {};
  const outfitPieces = [];
  if (wd.outfit_preset) outfitPieces.push(exp("wardrobe", "outfit_preset"));
  if (wd.top && wd.top !== "none") outfitPieces.push(exp("wardrobe", "top"));
  if (wd.bottom && wd.bottom !== "none") outfitPieces.push(exp("wardrobe", "bottom"));
  if (wd.underwear && wd.underwear !== "none") outfitPieces.push(exp("wardrobe", "underwear"));
  if (wd.footwear && wd.footwear !== "barefoot") outfitPieces.push(exp("wardrobe", "footwear"));
  if (wd.accessories) {
    const accs = Array.isArray(wd.accessories) ? wd.accessories : [wd.accessories];
    accs.filter((a) => a && a !== "none").forEach((a) => outfitPieces.push(exp("wardrobe", "accessories") ? expandPrompt("wardrobe", "accessories", a) : a));
  }
  const outfitCore = outfitPieces.length ? `wearing ${outfitPieces.join(", ")}` : "";
  const outfitTail = join([
    exp("wardrobe", "material"),
    wd.palette && `${wd.palette} color palette`,
    wd.fit && `${wd.fit} fit`,
    wd.state && wd.state !== "fully clothed" && exp("wardrobe", "state"),
  ]);
  const outfit = join([outfitCore, outfitTail]);

  // -------- Pose --------
  const pose = dna.pose || {};
  const poseCore = exp("pose", "action");
  const poseFraming = join([
    exp("pose", "angle"),
    exp("pose", "distance"),
    pose.focus && pose.focus !== "full frame" && exp("pose", "focus"),
  ]);
  const poseDetails = join([
    Array.isArray(pose.hands)
      ? pose.hands.filter(Boolean).map((h) => expandPrompt("pose", "hands", h)).join(", ")
      : (pose.hands && exp("pose", "hands")),
    exp("pose", "body_language"),
  ]);
  const poseStr = join([poseCore, poseFraming, poseDetails]);

  // -------- Intimate --------
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
  const fluidsStr = join([
    expArr("intimate", "cum_state"),
    expArr("intimate", "saliva"),
    im.squirt && im.squirt !== "none" && exp("intimate", "squirt"),
    im.lactation && im.lactation !== "none" && exp("intimate", "lactation"),
    im.sweat && im.sweat !== "none" && exp("intimate", "sweat"),
    im.lube && im.lube !== "none" && exp("intimate", "lube"),
    im.tears && im.tears !== "none" && exp("intimate", "tears"),
  ]);

  // -------- Feet --------
  const ft = dna.feet || {};
  const feetActive = !!(ft.sole_presentation || (Array.isArray(ft.toes) && ft.toes.length) || ft.arch || ft.pedicure ||
    (Array.isArray(ft.foot_state) && ft.foot_state.length) || ft.hosiery ||
    (Array.isArray(ft.foot_act) && ft.foot_act.length) || ft.framing);
  const feetStr = join([
    exp("feet", "sole_presentation"),
    expArr("feet", "toes"),
    ft.arch && exp("feet", "arch"),
    ft.pedicure && exp("feet", "pedicure"),
    ft.foot_size && ft.foot_size !== "average" && exp("feet", "foot_size"),
    expArr("feet", "foot_state"),
    ft.hosiery && ft.hosiery !== "bare" && exp("feet", "hosiery"),
    expArr("feet", "foot_act"),
    ft.framing && exp("feet", "framing"),
    feetActive && "clearly recognisable human feet with heel and arch and sole, exactly five distinct toes per foot with rounded toe pads, human foot anatomy not hand anatomy, ankle visible where foot meets calf, toenails not fingernails, well-defined big toe and pinky toe, toes shorter and thicker than fingers, foot shape wider at ball narrower at heel",
  ]);

  // -------- Kink --------
  const kk = dna.kink || {};
  const kinkStr = join([
    expArr("kink", "restraint"),
    expArr("kink", "gag"),
    expArr("kink", "marks"),
    expArr("kink", "sensation"),
    expArr("kink", "humiliation"),
    expArr("kink", "orgasm_control"),
    kk.power_dynamic && kk.power_dynamic !== "none" && exp("kink", "power_dynamic"),
    expArr("kink", "group_kink"),
  ]);

  // -------- Watersports --------
  const ws = dna.watersports || {};
  const wsStr = join([
    ws.source && ws.source !== "none" && exp("watersports", "source"),
    expArr("watersports", "direction"),
    ws.stream && exp("watersports", "stream"),
    ws.container && exp("watersports", "container"),
    expArr("watersports", "wetness"),
    ws.desperation && ws.desperation !== "none" && exp("watersports", "desperation"),
    expArr("watersports", "aftermath"),
  ]);

  // Selected Feet and Play controls are compositional requirements, not minor
  // styling hints. Promote them ahead of appearance details so long prompts do
  // not cause the text encoder/model to ignore the requested action or framing.
  const feetPriority = feetStr ? `PRIMARY FEET COMPOSITION — visibly and unambiguously show ${feetStr}` : "";
  const playCore = join([kinkStr, wsStr]);
  const playPriority = playCore ? `PRIMARY PLAY DETAILS — visibly depict ${playCore}` : "";

  return {
    subject,
    outfit,
    pose: poseStr,
    feet: feetStr,
    intimate: intimateStr,
    fluids: fluidsStr,
    kink: kinkStr,
    watersports: wsStr,
    feetPriority,
    playPriority,
    hasExplicit: !!(intimateStr || fluidsStr || kinkStr || wsStr),
  };
}

function _veniceNegative(multiSubjectExpected) {
  return [
    "low quality, worst quality, blurry, out of focus, jpeg artifacts, compression artifacts, noisy, oversharpened",
    "deformed, disfigured, mutated, extra fingers, missing fingers, fused fingers, extra limbs, missing limbs, mutated hands, poorly drawn hands, bad anatomy, bad proportions, unnatural body, floating limbs, disconnected limbs",
    "extra toes, missing toes, fused toes, four toes, three toes, six toes, seven toes, deformed toes, malformed feet, mutated feet, extra feet, missing feet, wrong toe count",
    "hands instead of feet, fingers instead of toes, palm instead of sole, knuckles on feet, hand-like feet, finger-like toes, wrist instead of ankle, fingernails on toes, foot with fingers, foot that looks like a hand, floating hand in frame, extra hand in frame",
    "poorly drawn face, asymmetric face, cross-eyed, poorly drawn eyes, dead eyes",
    "cartoon, anime, 3d render, cgi, painting, illustration, drawing, sketch, doll-like, plastic skin, airbrushed, wax figure, uncanny valley, overly smooth skin, plastic appearance",
    "watermark, signature, text, username, logo, artist name, cropped, frame, border, censored, mosaic, black bar",
    "underage, child, teen, teenager, young girl, minor, kid, loli, shota",
    multiSubjectExpected && "solo shot, single person in frame, only one woman in the frame, missing second person, cropped-out partner",
    "overexposed, blown highlights",
  ].filter(Boolean).join(", ");
}



// GoldenChroma uses a T5 encoder with a practical 512-token ceiling. The
// general Venice compiler is intentionally exhaustive, so this model-specific
// compiler removes repeated quality language and preserves the actual subject,
// pose, wardrobe, setting, camera, and adult details first.
function _compactChromaText(text, maxWords = 390) {
  const redundant = new Set([
    "photorealistic", "hyperrealistic", "editorial photograph", "8K UHD",
    "highly detailed", "masterpiece", "best quality", "ultra-detailed",
    "8k resolution", "sharp focus", "professional photography",
    "award-winning composition",
  ]);
  const seen = new Set();
  const segments = String(text || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => {
      const key = part.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
      if (!key || redundant.has(part) || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  const lead = "Natural high-end editorial photograph with realistic human anatomy and believable physical detail";
  const words = `${lead}. ${segments.join(", ")}`.split(/\s+/);
  return words.slice(0, maxWords).join(" ").replace(/[, ]+$/, "") + ".";
}

const CHROMA_NEGATIVE = [
  "low quality, blurry, out of focus, jpeg artifacts, watermark, signature, text, logo",
  "deformed anatomy, impossible joints, extra limbs, missing limbs, duplicate body parts",
  "malformed hands, fused fingers, extra fingers, missing fingers, malformed feet, fused toes, extra toes, missing toes",
  "distorted face, asymmetrical eyes, crossed eyes, malformed pupils",
  "cartoon, anime, illustration, painting, CGI, 3D render, mannequin, plastic skin, waxy skin, excessive smoothing",
  "underage, child, teenager, minor, youthful appearance",
].join(", ");

export function buildChromaPrompts(dna = {}, opts = {}) {
  const base = buildPrompts(dna, opts);
  return {
    positive: _compactChromaText(base.positive),
    negative: CHROMA_NEGATIVE,
  };
}

export function buildMultiChromaPrompts(subjects = [], opts = {}) {
  const base = buildMultiVenicePrompts(subjects, opts);
  return {
    positive: _compactChromaText(base.positive),
    negative: CHROMA_NEGATIVE + ", missing subject, merged bodies, fused people, duplicate face",
  };
}

// ============================================================
// Star / celebrity presets — one-tap DNA fills
// Trait descriptions only; if you have a LoRA for a star,
// add the trigger token in Style → Extra style tokens.
// ============================================================
// Editable heritage starters deliberately keep skin tone as a separate, editable
// choice. They are starting compositions, not claims that a heritage has one look.
const HERITAGE_EDITORIAL_PRESETS = [
  {
    name: "South Asian Editorial",
    tags: ["heritage", "Indian", "editable"],
    dna: {
      identity: { gender: "female", age: 32, ethnicity: "indian", archetype: "queen", name: "" },
      face: { eye_shape: "almond", eye_color: "deep brown", jawline: "soft", nose: "straight", lips: "full", expression: "confident" },
      hair: { style: "wavy", length: "long", color: "jet black", texture: "thick", bangs: "none" },
      skin: { tone: "tan", texture: "natural pores", glow: 45 },
      physique: { body_type: "hourglass", curves: 65, exaggeration: 20 },
    },
  },
  {
    name: "East Asian Editorial",
    tags: ["heritage", "East Asian", "editable"],
    dna: {
      identity: { gender: "female", age: 30, ethnicity: "east asian", archetype: "femme fatale", name: "" },
      face: { eye_shape: "almond", eye_color: "deep brown", jawline: "soft", nose: "button", lips: "medium", expression: "confident" },
      hair: { style: "straight", length: "long", color: "jet black", texture: "medium", bangs: "curtain" },
      skin: { tone: "fair", texture: "natural pores", glow: 40 },
      physique: { body_type: "slim", curves: 45, exaggeration: 10 },
    },
  },
  {
    name: "Southeast Asian Editorial",
    tags: ["heritage", "Filipina", "editable"],
    dna: {
      identity: { gender: "female", age: 31, ethnicity: "filipina", archetype: "bombshell", name: "" },
      face: { eye_shape: "almond", eye_color: "deep brown", jawline: "soft", nose: "button", lips: "full", expression: "warm smile" },
      hair: { style: "wavy", length: "long", color: "jet black", texture: "thick", bangs: "none" },
      skin: { tone: "tan", texture: "natural pores", glow: 55 },
      physique: { body_type: "hourglass", curves: 60, exaggeration: 20 },
    },
  },
  {
    name: "African Diaspora Editorial",
    tags: ["heritage", "Black", "editable"],
    dna: {
      identity: { gender: "female", age: 34, ethnicity: "african american", archetype: "queen", name: "" },
      face: { eye_shape: "almond", eye_color: "deep brown", jawline: "defined", nose: "broad", lips: "full", expression: "confident" },
      hair: { style: "coily", length: "shoulder", color: "jet black", texture: "coarse", bangs: "none" },
      skin: { tone: "dark brown", texture: "natural pores", glow: 55 },
      physique: { body_type: "curvy", curves: 75, exaggeration: 25 },
    },
  },
  {
    name: "Latina Editorial",
    tags: ["heritage", "Latina", "editable"],
    dna: {
      identity: { gender: "female", age: 33, ethnicity: "latina", archetype: "bombshell", name: "" },
      face: { eye_shape: "almond", eye_color: "deep brown", jawline: "defined", nose: "straight", lips: "full", expression: "confident" },
      hair: { style: "wavy", length: "long", color: "chestnut", texture: "thick", bangs: "curtain" },
      skin: { tone: "tan", texture: "natural pores", glow: 55 },
      physique: { body_type: "hourglass", curves: 75, exaggeration: 30 },
    },
  },
  {
    name: "Middle Eastern Editorial",
    tags: ["heritage", "Middle Eastern", "editable"],
    dna: {
      identity: { gender: "female", age: 35, ethnicity: "middle eastern", archetype: "femme fatale", name: "" },
      face: { eye_shape: "almond", eye_color: "deep brown", jawline: "defined", nose: "aquiline", lips: "full", expression: "intense" },
      hair: { style: "wavy", length: "long", color: "jet black", texture: "thick", bangs: "none" },
      skin: { tone: "olive", texture: "natural pores", glow: 50 },
      physique: { body_type: "hourglass", curves: 65, exaggeration: 20 },
    },
  },
  {
    name: "Mediterranean Editorial",
    tags: ["heritage", "Mediterranean", "editable"],
    dna: {
      identity: { gender: "female", age: 36, ethnicity: "mediterranean", archetype: "queen", name: "" },
      face: { eye_shape: "almond", eye_color: "hazel", jawline: "defined", nose: "straight", lips: "full", expression: "confident" },
      hair: { style: "wavy", length: "long", color: "chestnut", texture: "thick", bangs: "curtain" },
      skin: { tone: "olive", texture: "natural pores", glow: 50 },
      physique: { body_type: "hourglass", curves: 70, exaggeration: 25 },
    },
  },
  {
    name: "Nordic Editorial",
    tags: ["heritage", "Nordic", "editable"],
    dna: {
      identity: { gender: "female", age: 33, ethnicity: "nordic", archetype: "athlete", name: "" },
      face: { eye_shape: "almond", eye_color: "blue", jawline: "defined", nose: "straight", lips: "medium", expression: "serene" },
      hair: { style: "wavy", length: "long", color: "platinum blonde", texture: "medium", bangs: "none" },
      skin: { tone: "fair", texture: "natural pores", glow: 35 },
      physique: { height: "tall", body_type: "athletic", muscularity: 45, curves: 50, exaggeration: 10 },
    },
  },
];

const identitySection = SECTIONS.find((section) => section.key === "identity");
const ethnicityField = identitySection?.fields.find((field) => field.key === "ethnicity");
const titleCase = (value) => String(value || "").replace(/\b\w/g, (letter) => letter.toUpperCase());

// Every ethnicity supported by the Identity section gets a searchable one-tap
// selector. These intentionally change only heritage and preserve the rest of
// the current character; the editorial cards below offer fuller looks.
const ALL_HERITAGE_PRESETS = (ethnicityField?.groups || []).flatMap((group) =>
  group.options.map((ethnicity) => ({
    name: `${titleCase(ethnicity)} Heritage`,
    tags: ["heritage", group.name, ethnicity, "preserves current DNA"],
    dna: { identity: { ethnicity } },
  }))
);

export const HERITAGE_PRESETS = [
  ...ALL_HERITAGE_PRESETS,
  ...HERITAGE_EDITORIAL_PRESETS,
];

// Original 21+ fairy-tale archetypes: recognizable moods without using child-coded
// characters or claiming to reproduce a copyrighted animated likeness.
export const STORYBOOK_PRESETS = [
  {
    name: "Adult Ice Queen",
    tags: ["21+", "ice", "royal", "storybook"],
    dna: {
      identity: { gender: "female", age: 29, ethnicity: "nordic", archetype: "queen", name: "" },
      hair: { style: "braids", length: "long", color: "platinum blonde", texture: "medium", bangs: "side-swept" },
      face: { eye_shape: "almond", eye_color: "blue", jawline: "defined", nose: "straight", lips: "medium", expression: "serene" },
      wardrobe: { outfit_preset: "evening gown slit", palette: "silver", material: "silk" },
      scene: { environment: "castle", background: "glittering ice palace and falling snow", era: "medieval" },
    },
  },
  {
    name: "Adult Desert Princess",
    tags: ["21+", "desert", "royal", "storybook"],
    dna: {
      identity: { gender: "female", age: 27, ethnicity: "middle eastern", archetype: "queen", name: "" },
      hair: { style: "wavy", length: "long", color: "jet black", texture: "thick", bangs: "none" },
      face: { eye_shape: "almond", eye_color: "deep brown", jawline: "soft", nose: "straight", lips: "full", expression: "confident" },
      wardrobe: { outfit_preset: "evening gown slit", palette: "gold and black", material: "silk" },
      scene: { environment: "desert", background: "ornate palace balcony beneath a starry night", era: "medieval" },
    },
  },
  {
    name: "Adult Bayou Princess",
    tags: ["21+", "bayou", "elegant", "storybook"],
    dna: {
      identity: { gender: "female", age: 28, ethnicity: "african american", archetype: "queen", name: "" },
      hair: { style: "coily", length: "shoulder", color: "jet black", texture: "coarse", bangs: "none" },
      wardrobe: { outfit_preset: "evening gown slit", palette: "gold and black", material: "satin" },
      scene: { environment: "forest", background: "enchanted bayou garden terrace at dusk", era: "vintage" },
    },
  },
  {
    name: "Adult Warrior Princess",
    tags: ["21+", "warrior", "athletic", "storybook"],
    dna: {
      identity: { gender: "female", age: 30, ethnicity: "east asian", archetype: "warrior", name: "" },
      physique: { body_type: "athletic", muscularity: 65, curves: 45, exaggeration: 10 },
      hair: { style: "ponytail", length: "long", color: "jet black", texture: "silky", bangs: "none" },
      wardrobe: { outfit_preset: "leather mistress", palette: "blood red", material: "leather" },
      scene: { environment: "forest", background: "misty mountain temple", era: "medieval" },
    },
  },
  {
    name: "Adult Enchanted Rose Princess",
    tags: ["21+", "rose", "royal", "storybook"],
    dna: {
      identity: { gender: "female", age: 31, ethnicity: "french", archetype: "queen", name: "" },
      hair: { style: "updo", length: "long", color: "chestnut", texture: "wavy", bangs: "curtain" },
      wardrobe: { outfit_preset: "evening gown slit", palette: "gold and black", material: "satin" },
      scene: { environment: "castle", background: "candlelit grand ballroom filled with roses", era: "victorian" },
    },
  },
  {
    name: "Adult Ocean Wayfinder",
    tags: ["21+", "ocean", "adventurer", "storybook"],
    dna: {
      identity: { gender: "female", age: 26, ethnicity: "polynesian", archetype: "warrior", name: "" },
      physique: { body_type: "athletic", muscularity: 55, curves: 55, exaggeration: 10 },
      hair: { style: "wavy", length: "long", color: "dark brown", texture: "thick", bangs: "none" },
      wardrobe: { outfit_preset: "streetwear", palette: "blood red", material: "linen" },
      scene: { environment: "beach", background: "tropical shoreline and ocean sunset", era: "contemporary" },
    },
  },
];

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


// ============================================================
// Kink Presets — one-tap fetish stacks applied over the current DNA.
// Only the sections/fields listed will be patched — everything else is preserved.
// ============================================================
export const KINK_PRESETS = [
  {
    name: "Foot Goddess",
    tags: ["feet", "worship", "POV"],
    dna: {
      feet: { sole_presentation: "sole showcase", toes: ["toe curl", "toe spread"], arch: "high arch", pedicure: "painted red", foot_state: ["oiled"], hosiery: "bare", foot_act: ["foot worship", "sole licking"], framing: "POV under foot" },
      pose: { angle: "from below", distance: "detail shot", focus: "feet", body_language: "dominant" },
      lighting: { source: "softbox", style: "cinematic", mood: "sensual" },
      scenario: { kink_level: 55, explicit_level: 40 },
    },
  },
  {
    name: "Piss Slut",
    tags: ["watersports", "humiliation", "wet"],
    dna: {
      watersports: { source: "partner", direction: ["on face", "in mouth", "on tits"], stream: "gush", container: "on bed", wetness: ["soaked panties", "dripping thighs"], desperation: "losing control", aftermath: ["smeared mascara", "wet hair"] },
      kink: { humiliation: ["degradation stare", "spit on face", "drooling", "mascara tears"] },
      face: { expression: "sultry" },
      wardrobe: { state: "coming off" },
      scenario: { explicit_level: 80, kink_level: 70 },
    },
  },
  {
    name: "Bound & Wrecked",
    tags: ["shibari", "gag", "impact"],
    dna: {
      kink: { restraint: ["rope shibari", "wrists overhead"], gag: ["ball gag", "drool bib"], marks: ["red handprint", "rope marks", "welts"], humiliation: ["ahegao expression", "mind-break", "drooling", "mascara tears"], orgasm_control: ["forced orgasm", "overstimulation"], power_dynamic: "master and slave" },
      face: { expression: "sultry" },
      intimate: { tears: "mascara tears", saliva: ["drool from mouth", "drool from chin"] },
      scenario: { kink_level: 90, explicit_level: 70 },
    },
  },
  {
    name: "Bukkake Queen",
    tags: ["cum", "group", "facial"],
    dna: {
      scenario: { cast_size: "group", acts: ["bukkake", "facial", "cum on tits", "cum on face"], explicit_level: 95, kink_level: 40 },
      intimate: { cum_state: ["cum on face", "cum in mouth open display", "cum on tits", "cum in hair", "cum-covered whole body"], saliva: ["drool from mouth"] },
      pose: { angle: "front", distance: "portrait", focus: "face", body_language: "submissive" },
    },
  },
  {
    name: "Puppy Pet",
    tags: ["pet play", "collar", "kneeling"],
    dna: {
      kink: { restraint: ["collar and leash"], humiliation: ["puppy hood", "on all fours pet", "leash walk", "ahegao expression", "drooling"], power_dynamic: "owner and pet" },
      pose: { action: "all fours", body_language: "submissive", hands: ["at sides"] },
      face: { expression: "sultry" },
      wardrobe: { accessories: ["leather collar", "leash"] },
      scenario: { kink_level: 75, explicit_level: 50 },
    },
  },
  {
    name: "Lactation Mommy",
    tags: ["lactation", "milk", "MILF"],
    dna: {
      intimate: { nipples: "erect", areolas: "puffy dome", lactation: "milk drip", cum_state: [] },
      physique: { bust: "huge", bust_shape: "natural" },
      pose: { focus: "breasts", body_language: "sensual" },
      wardrobe: { outfit_preset: "topless" },
      scenario: { roleplay: "milf", explicit_level: 60, kink_level: 30 },
    },
  },
  {
    name: "Toilet Toy",
    tags: ["watersports", "humiliation", "degradation"],
    dna: {
      watersports: { source: "group", direction: ["in mouth", "on face", "held in"], stream: "steady stream", container: "toilet", desperation: "humiliated", aftermath: ["smeared mascara", "wet hair", "wet clothes"] },
      kink: { restraint: ["collar and leash"], humiliation: ["degradation stare", "spit on face", "used", "wrecked", "drooling"], power_dynamic: "owner and pet" },
      scenario: { explicit_level: 90, kink_level: 85 },
    },
  },
];
