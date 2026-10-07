import { catalogSelection } from './promptCatalog';
import { ageAppearancePrompt, resolveAgeSkin } from './ageAppearance';
import { HERITAGE_GROUPS, HERITAGE_LABELS, HERITAGE_PROFILES, heritageLabel } from "./heritageProfiles";
import { ADDITIONAL_OUTFIT_GROUPS, OUTFIT_SET_LABELS, LAYERED_OUTFIT_GROUP, SET_LINGERIE_GROUPS } from "./completeOutfitSets";
import { resolveWardrobeMode } from "./wardrobeMode";
import { bustShapePrompt } from "./physiqueControls";
import { PHOTOGRAPHY_POSE_GROUPS } from "@/lib/photographyPoses";
import { GLUTE_SIZE_MAX, gluteSizePrompt } from "@/lib/gluteControls";
// DNA schema + prompt builder + randomizer
import { expandPrompt } from "@/lib/promptMap";
import { implantVisualPrompt } from "@/lib/implantVisualScale";
import { wardrobeNudity, EXPOSURE_CHOICES } from "@/lib/wardrobeNudity";

export const SECTIONS = [
  {
    key: "identity",
    title: "Identity",
    fields: [
      { key: "gender", type: "chips", label: "Gender", options: ["female", "male"] },
      { key: "age", type: "slider", label: "Age (adult)", min: 18, max: 80, step: 1, defaultValue: 30, help: "Changing age updates skin texture automatically. New images use age-specific facial detail; hair color and cosmetic finishes stay separate." },
      { key: "ethnicity", type: "chips", label: "Ethnicity", groups: HERITAGE_GROUPS, optionLabels: HERITAGE_LABELS },
      { key: "archetype", type: "chips", label: "Archetype (character theme)", groups: [
        { name: "Everyday", options: ["girl next door", "athlete", "artist", "socialite", "scholar"] },
        { name: "Royal & cinematic", options: ["queen", "Bollywood princess", "Indian royal", "Arabian princess", "desert queen", "regal heroine"] },
        { name: "Fantasy & action", options: ["warrior", "pirate", "superheroine", "sorceress", "space explorer"] },
        { name: "Style", options: ["femme fatale", "cyberpunk", "goth", "cottagecore", "vintage starlet"] },
      ] },
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
      { key: "bust", type: "chips", label: "Bust size", options: ["flat", "small", "medium", "large", "very large", "huge", "enormous", "hyper"] },
      { key: "bust_scale", type: "slider", label: "Bust size", min: 0, max: 100, step: 1, defaultValue: 0 },
      { key: "bust_shape", type: "chips", label: "Bust shape", options: ["natural", "perky", "round", "teardrop", "athletic", "augmented", "gravity-defying"] },
      { key: "implant_volume", type: "slider", label: "Implant visual size (cc reference; 0 = none)", min: 0, max: 5000, step: 50, defaultValue: 0, help: "Prompts include the selected visual-size value and projection description. This is a visual reference, not a medical measurement." },
      { key: "butt", type: "chips", label: "Butt", options: ["flat", "small", "toned", "round", "bubble", "large", "very large", "huge", "hyper"] },
      { key: "butt_scale", type: "slider", label: "Glute size", min: 0, max: GLUTE_SIZE_MAX, step: 1, defaultValue: 0, help: "0 keeps the Butt preset. 1–100 sets size; 101–300 adds progressively larger fantasy volume. Shape is controlled separately. A rear or three-quarter view makes the silhouette easier to see." },
      { key: "glute_shape", type: "chips", label: "Glute shape / augmentation look", groups: [
        { name: "Natural", options: ["natural rounded", "athletic lifted", "soft pear-shaped", "heart-shaped"] },
        { name: "Enhanced", options: ["BBL-style fuller glutes", "high round projection", "pronounced upper shelf", "dramatic side projection"] },
        { name: "Fantasy", options: ["fantasy oversized glutes", "extreme round projection"] },
      ] },
      { key: "thighs", type: "chips", label: "Thighs", options: ["slim", "toned", "athletic", "thick", "very thick", "massive"] },
      { key: "thigh_scale", type: "slider", label: "Thigh size", min: 0, max: 100, step: 1, defaultValue: 0 },
      { key: "hips", type: "chips", label: "Hips", options: ["narrow", "average", "wide", "very wide", "extreme"] },
      { key: "hip_scale", type: "slider", label: "Hip width", min: 0, max: 100, step: 1, defaultValue: 0 },
      { key: "waist", type: "chips", label: "Waist", options: ["thick", "average", "slim", "cinched", "tiny", "wasp-thin"] },
      { key: "waist_scale", type: "slider", label: "Waist width", min: 0, max: 100, step: 1, defaultValue: 0 },
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
      { key: "style", type: "chips", label: "Style", groups: [
        { name: "Loose", options: ["straight", "wavy", "curly", "coily", "messy", "beach waves", "blowout", "ringlets", "afro"] },
        { name: "Short", options: ["pixie cut", "buzz cut", "asymmetric bob", "blunt bob", "shag", "wolf cut", "undercut"] },
        { name: "Up", options: ["updo", "ponytail", "high ponytail", "low ponytail", "messy bun", "sleek bun", "chignon", "half-up"] },
        { name: "Braids", options: ["braids", "box braids", "cornrows", "French braid", "Dutch braids", "fishtail braid", "locs", "twists"] },
      ] },
      { key: "length", type: "chips", label: "Length", options: ["pixie", "short bob", "shoulder", "long", "waist-length"] },
      { key: "color", type: "chips", label: "Color", groups: [
        { name: "Dark", options: ["jet black", "raven", "espresso brown", "dark chocolate", "chestnut", "soft black"] },
        { name: "Blonde", options: ["platinum blonde", "ash blonde", "honey blonde", "strawberry blonde", "sandy blonde", "golden blonde"] },
        { name: "Red", options: ["auburn", "fiery red", "copper", "burgundy", "mahogany", "rose gold"] },
        { name: "Gray", options: ["silver", "salt and pepper", "steel gray", "white", "pearl gray"] },
        { name: "Creative", options: ["ombre", "balayage", "pink", "lavender", "purple", "blue", "teal", "emerald green"] },
      ] },
      { key: "texture", type: "chips", label: "Texture", options: ["fine", "medium", "thick", "coarse"] },
      { key: "bangs", type: "chips", label: "Bangs", options: ["none", "curtain", "blunt", "side-swept", "wispy"] },
    ],
  },
  {
    key: "skin",
    title: "Skin",
    fields: [
      { key: "tone", type: "chips", label: "Tone", groups: [
        { name: "Light", options: ["porcelain", "fair", "light beige", "peach", "light olive"] },
        { name: "Medium", options: ["olive", "tan", "warm tan", "golden", "caramel", "bronze"] },
        { name: "Deep", options: ["deep bronze", "dark brown", "rich brown", "mahogany", "ebony"] },
      ] },
      { key: "texture", type: "chips", label: "Texture", help: "Age changes select an appropriate skin texture automatically. Cosmetic finishes such as Matte or Dewy stay selected while facial detail follows the age.", groups: [
        { name: "Natural", options: ["natural pores", "fine lines", "visible skin texture", "freckled", "subtle acne marks", "mature skin texture"] },
        { name: "Finish", options: ["smooth", "textured", "matte", "dewy", "oiled", "sweat-glistening", "satin skin finish"] },
      ] },
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
      { key: "nipple_size", type: "chips", label: "Nipple size", groups: [
        { name: "Natural", options: ["very small nipple tips", "small nipple tips", "medium nipple tips", "large nipple tips"] },
        { name: "Stylized", options: ["extra large nipple tips", "oversized nipple tips"] },
      ] },
      { key: "nipple_shape", type: "chips", label: "Nipple shape / projection", groups: [
        { name: "Projection", options: ["flat nipples", "subtly raised nipples", "protruding nipples", "prominently projecting nipples"] },
        { name: "Shape", options: ["rounded nipple tips", "conical nipple tips", "inverted nipples", "one inverted nipple"] },
      ] },
      { key: "areola_size", type: "chips", label: "Areola size", groups: [
        { name: "Natural", options: ["small areolas", "medium areolas", "wide areolas"] },
        { name: "Stylized", options: ["very wide areolas", "oversized areolas"] },
      ] },
      { key: "areola_shape", type: "chips", label: "Areola shape / contour", groups: [
        { name: "Outline", options: ["round areolas", "oval areolas", "soft irregular areola edges"] },
        { name: "Contour", options: ["flat areolas", "slightly raised areolas", "puffy raised areolas"] },
      ] },
      { key: "areola_color", type: "chips", label: "Areola color", groups: [
        { name: "Light", options: ["pale pink areolas", "rose pink areolas", "peach areolas"] },
        { name: "Medium", options: ["tan areolas", "warm brown areolas", "copper brown areolas"] },
        { name: "Deep", options: ["deep brown areolas", "dark brown areolas"] },
      ] },
      { key: "areola_detail", type: "chips", label: "Areola detail", options: ["smooth areola texture", "subtle natural texture", "visible Montgomery glands", "soft color gradient", "defined areola border"] },
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
    title: "Feet & styling",
    fields: [
      { key: "composition_mode", type: "chips", label: "Role in the photograph", options: ["supporting detail", "feet focus"], help: "Supporting detail keeps the crop and pose selected in Pose. Feet focus controls the crop, while the main Pose controls body stance. Wardrobe controls coverage and Scene controls the setting. Conflicting foot details stay saved but are omitted from the prompt with an explanation. Unset follows Pose focus." },
      { key: "sole_presentation", type: "pose_chips", label: "Sole presentation", groups: [
        { name: "Presentation", options: ["soles up", "soles together", "sole showcase", "sole toward camera", "one sole raised", "both soles toward camera", "crossed ankles soles visible", "heel lifted toward camera"] },
        { name: "Detail", options: ["wrinkled soles", "smooth soles", "oiled soles", "dirty soles", "muddy soles", "freshly washed", "arched soles", "detailed toe pads"] },
      ]},
      { key: "toes", type: "chips_multi", label: "Toe details (pick many)", options: ["toe curl", "toe spread", "toe point", "toe suck", "toe ring", "toe scrunch", "big toe out", "toes in mouth", "wiggling toes", "toes flexed", "toes gripping fabric"], exclusiveGroups: [["toe curl", "toe spread", "toe point", "toe scrunch", "big toe out", "wiggling toes", "toes flexed", "toes gripping fabric"], ["toe suck", "toes in mouth"]] },
      { key: "arch", type: "chips", label: "Arch style", options: ["high arch", "medium arch", "flat arch", "defined arch", "banana arch"] },
      { key: "pedicure", type: "chips", label: "Pedicure", options: ["natural nails", "painted red", "painted black", "painted french", "painted pink", "chipped polish", "long nails", "sharp claws", "glitter polish"] },
      { key: "foot_size", type: "chips", label: "Foot size", options: ["petite", "average", "large", "size queen"] },
      { key: "foot_state", type: "chips_multi", label: "Foot state (pick many)", options: ["bare", "sweaty", "oiled", "dirty", "muddy", "freshly washed", "in nylons", "in socks", "stinky", "cum on feet", "cum on soles"], exclusiveGroups: [["bare", "in nylons", "in socks"], ["dirty", "muddy", "freshly washed"]] },
      { key: "hosiery", type: "chips", label: "Hosiery", groups: [
        { name: "Bare / sheer", options: ["bare", "sheer stockings", "toeless stockings", "footed stockings", "pantyhose", "ripped pantyhose"] },
        { name: "Fishnet", options: ["fishnet stockings", "toeless fishnets", "ripped fishnets"] },
        { name: "Socks", options: ["ankle socks", "gym socks", "knee-high socks", "thigh-high socks", "over-the-knee socks", "dirty socks", "sweaty socks"] },
      ]},
      { key: "foot_act", type: "chips_multi", label: "Foot act (pick many)", groups: [
        { name: "Solo", options: ["foot showcase", "foot posing", "foot tease", "arched foot", "toe suck self", "self foot massage", "self foot kiss", "self sole lick", "self toe lick", "self foot worship pose"] },
        { name: "Worship", options: ["foot worship", "sole licking", "toe sucking", "foot kissing", "foot massage", "arch kissing", "heel kissing", "toe worship", "barefoot worship"] },
        { name: "Sex", options: ["footjob", "double footjob", "foot on cock", "foot in mouth POV"] },
        { name: "Dominance", options: ["foot on face", "foot smothering", "trampling", "standing on someone", "foot gag"] },
        { name: "Mess", options: ["cum on feet", "cum on soles", "cum between toes"] },
      ]},
      { key: "framing", type: "chips", label: "Framing", options: ["full body", "waist-down", "knees-down", "feet close-up", "sole close-up", "POV under foot", "low angle sole", "ankle and arch close-up", "pedicure close-up", "both soles in foreground"] },
      { key: "foot_pose", type: "chips", label: "Foot pose", groups: [
        { name: "Relaxed", options: ["feet side by side", "ankles crossed", "feet resting on a cushion", "one foot over the other", "toes resting on floor"] },
        { name: "Active", options: ["heels raised", "one foot lifted", "toes pointed", "toes flexed", "feet dangling", "walking barefoot", "standing on tiptoe"] },
        { name: "Detail", options: ["soles facing lens", "one sole toward lens", "arches visible in profile", "heels together", "toes toward lens"] },
      ] },
      { key: "toe_length", type: "chips", label: "Toe shape", options: ["even toe line", "long second toe", "tapered toe line", "short rounded toes", "long slender toes"] },
      { key: "sole_texture", type: "chips", label: "Sole texture", options: ["smooth soles", "natural sole creases", "pronounced arch creases", "slightly calloused heels", "soft heel pads", "light dust on soles", "water droplets on soles"] },
      { key: "pedicure_art", type: "chips", label: "Pedicure finish / art", groups: [
        { name: "Finish", options: ["glossy polish", "matte polish", "pearl finish", "chrome finish", "glitter finish", "sheer jelly polish"] },
        { name: "Design", options: ["French tips", "micro-French tips", "ombré nails", "accent toenail", "floral nail art", "geometric nail art", "rhinestone accent"] },
      ] },
      { key: "toenail_shape", type: "chips", label: "Toenail shape", options: ["short rounded", "short square", "squoval", "neatly oval", "long square"] },
      { key: "foot_accessories", type: "chips_multi", label: "Foot accessories (pick many)", options: ["anklet", "double anklet", "toe ring", "multiple toe rings", "foot chain", "beaded anklet", "barefoot sandal jewelry", "henna on feet"] },
      { key: "ground_surface", type: "chips", label: "Surface under feet", groups: [
        { name: "Indoor", options: ["polished wood floor", "tile floor", "soft carpet", "silk sheets", "velvet cushion", "marble floor"] },
        { name: "Outdoor", options: ["warm sand", "wet sand", "grass", "smooth stone", "shallow water", "wooden deck"] },
      ] },
    ],
  },
  {
    key: "wardrobe",
    title: "Wardrobe",
    fields: [
      { key: "outfit_mode", type: "chips", label: "Outfit mode", options: ["full", "custom"], optionLabels: { full: "Full set", custom: "Custom" }, help: "Full set uses one coordinated outfit. Custom enables separate clothing, hosiery, shoes and accessories." },
      { key: "exposure_mode", type: "chips", label: "Clothing coverage", options: EXPOSURE_CHOICES,
        help: "Progress from your selected outfit to lingerie showing underneath, lingerie only, open or shifted clothing, partial nudity, and nudity. Lingerie only replaces outer clothing. Partial nudity keeps some selected clothing on (plain briefs if none is selected); Nude removes garments. Accessories and hosiery remain available." },
      { key: "outfit_preset", type: "chips", label: "Outfit preset", groups: [
        { name: "Bare", options: ["nude", "topless", "bottomless", "just panties", "just a shirt", "boyfriend's shirt"] },
        { name: "Lingerie", options: ["boudoir lingerie", "sheer negligee", "silk robe open", "lace lingerie set", "satin slip", "corset and garters", "sheer bodysuit"] },
        { name: "Bikini", options: ["bikini", "micro bikini", "string bikini", "wet t-shirt"] },
        { name: "Roleplay", options: ["sexy schoolgirl", "naughty nurse", "french maid", "playboy bunny", "showgirl", "cheerleader", "secretary unbuttoned", "librarian undone", "biker chick", "cowgirl chaps", "cop uniform undone", "flight attendant undone"] },
        { name: "Fetish/Kink", options: ["dominatrix", "leather mistress", "latex catsuit", "kinky harness", "shibari rope", "fetish gimp"] },
        { name: "Adult Perf.", options: ["pole dancer", "gogo dancer", "stripper"] },
        { name: "Formal", options: ["cocktail dress", "evening gown slit", "backless red carpet", "club outfit", "tailored pantsuit", "velvet gown", "sequined mini dress"] },
        { name: "Athletic", options: ["yoga wear", "gym set", "sports bra and shorts", "cheerleader off-duty"] },
        { name: "Casual", options: ["streetwear", "casual home", "oversized sweater", "denim jacket and skirt", "off-shoulder blouse", "summer romper", "cardigan and slip dress"] },
        { name: "Indian & Bollywood", options: ["embroidered lehenga choli with dupatta", "silk sari with fitted blouse", "ornate anarkali suit", "sharara set with dupatta", "gharara set with embroidered kurta", "Bollywood princess gown with jewelry"] },
        { name: "Arabian inspired", options: ["embroidered kaftan", "formal abaya with matching headscarf", "ornate jalabiya", "beaded evening kaftan"] },
      ]},
      { key: "outfit_set", type: "chips", label: "Complete outfit set", optionLabels: OUTFIT_SET_LABELS, groups: [
        { name: "Lingerie sets", options: ["lace balconette set with matching panties, garter belt, stockings and heels", "satin push-up bra set with matching briefs, sheer thigh-highs and stilettos", "embroidered bralette and high-waist panties with seamed stockings and pumps", "sheer mesh bra and thong with fishnet stockings and platform heels", "silk corset and matching panties with garters, lace stockings and heels"] },
        { name: "Costume sets", options: ["French maid dress with apron, matching lingerie, stockings and heels", "classic maid dress with lace headpiece, stockings and pumps", "superheroine bodysuit with matching cape, gloves and boots", "armored heroine suit with matching cape, belt and boots", "royal princess gown with matching jewelry, veil and heels"] },
        { name: "Cultural fashion sets", options: ["Bollywood royal lehenga choli with dupatta, jewelry and embroidered heels", "Indian silk sari with matching blouse, bangles and sandals", "embroidered anarkali with dupatta, earrings and embellished flats", "formal embroidered kaftan with matching jewelry and sandals", "ornate abaya with matching scarf, jewelry and shoes"] },
        ...ADDITIONAL_OUTFIT_GROUPS, LAYERED_OUTFIT_GROUP,
      ] },
      { key: "set_lingerie_mode", type: "chips", label: "Underneath layer", options: ["matching", "none"], defaultValue: "matching",
        optionLabels: { matching: "Include lingerie", none: "No lingerie underneath" }, help: "Optional for complete sets. No lingerie underneath keeps the selected outer outfit and disables lingerie-only coverage. A lingerie set selected as the main outfit stays on." },
      { key: "set_lingerie", type: "chips", label: "Lingerie underneath", optionLabels: OUTFIT_SET_LABELS, groups: SET_LINGERIE_GROUPS, help: "Available when Include lingerie is selected. Leave unset to use the full set’s matching lingerie; clothing coverage reveals this layer or shows it alone." },
      { key: "outfit_set_color", type: "chips", label: "Set color", groups: [
        { name: "Classic", options: ["black", "white", "ivory", "red", "burgundy", "navy", "gold", "silver"] },
        { name: "Bright", options: ["emerald", "royal blue", "hot pink", "saffron", "turquoise", "purple"] },
        { name: "Soft", options: ["blush", "champagne", "lavender", "sage", "peach"] },
      ] },
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
      { key: "hosiery_type", type: "chips", label: "Pantyhose & stockings", options: [
        "sheer pantyhose", "opaque tights", "fishnet tights", "patterned tights", "seamed stockings", "lace-top thigh-high stockings", "stay-up stockings", "garter stockings", "ultra-sheer tights", "semi-opaque tights", "toeless tights", "footless tights", "hold-up stockings", "back-seam stockings", "knee-high nylons", "ankle socks", "over-the-knee socks"
      ]},
      { key: "hosiery_color", type: "chips", label: "Pantyhose / stocking color", groups: [
        { name: "Neutral", options: ["nude", "tan", "espresso", "black", "white", "gray", "brown"] },
        { name: "Color", options: ["red", "burgundy", "navy", "royal blue", "emerald", "pink", "purple", "silver", "gold"] },
      ] },
      { key: "heel_type", type: "chips", label: "Heel type", groups: [
        { name: "Pumps", options: ["pointed-toe stilettos", "round-toe pumps", "platform pumps", "slingback heels", "kitten heels", "block heels", "d'Orsay pumps", "Mary Jane heels", "T-strap heels", "square-toe pumps"] },
        { name: "Sandals", options: ["strappy sandals", "ankle-strap heels", "open-toe heels", "peep-toe heels", "wedge sandals", "mule heels", "gladiator heels", "slide heels", "wraparound lace-up sandals"] },
        { name: "Statement", options: ["sculptural heels", "clear platform heels", "lace-up heels", "thigh-high heeled boots", "cone heels", "cork wedges", "chunky platform boots", "metallic heeled boots"] },
      ] },
      { key: "heel_color", type: "chips", label: "Heel color", groups: [
        { name: "Neutral", options: ["black", "white", "ivory", "nude", "tan", "brown", "clear"] },
        { name: "Color", options: ["red", "burgundy", "pink", "blue", "teal", "emerald", "purple"] },
        { name: "Metallic", options: ["silver", "gold", "rose gold", "bronze", "chrome"] },
      ] },
      { key: "heel_height", type: "chips", label: "Heel height", groups: [
        { name: "Low", options: ["flat", "kitten-height", "low 2-inch"] },
        { name: "High", options: ["mid 3-inch", "high 4-inch", "very high 5-inch", "platform 6-inch"] },
      ] },
      { key: "heel_finish", type: "chips", label: "Heel finish / pattern", groups: [
        { name: "Solid", options: ["matte", "patent leather", "suede", "satin", "metallic", "glitter"] },
        { name: "Pattern", options: ["leopard print", "snakeskin print", "floral", "color-blocked", "rhinestone embellished"] },
      ] },
      { key: "hosiery_pattern", type: "chips", label: "Stocking design", groups: [
        { name: "Classic", options: ["plain", "back seam", "cuban heel", "contrast welt", "lace top", "dotted"] },
        { name: "Pattern", options: ["diamond fishnet", "fine fishnet", "floral lace", "polka dot", "geometric", "chevron", "striped", "argyle"] },
        { name: "Finish", options: ["sheer 10 denier", "semi-sheer 30 denier", "opaque 80 denier", "shimmer", "ripped"] },
      ] },
      { key: "hosiery_denier", type: "chips", label: "Hosiery sheerness", options: ["ultra-sheer 5 denier", "sheer 10 denier", "sheer 15 denier", "light 20 denier", "semi-sheer 30 denier", "semi-opaque 40 denier", "opaque 60 denier", "opaque 80 denier", "heavy 100 denier"] },
      { key: "garment_color", type: "chips", label: "Outfit color", groups: [
        { name: "Neutral", options: ["black", "white", "ivory", "cream", "beige", "taupe", "gray", "charcoal", "chocolate brown"] },
        { name: "Warm", options: ["red", "burgundy", "coral", "orange", "mustard", "gold", "blush pink", "hot pink"] },
        { name: "Cool", options: ["navy", "royal blue", "sky blue", "teal", "emerald", "sage green", "lavender", "purple", "silver"] },
      ] },
      { key: "dress_style", type: "chips", label: "Dress style", groups: [
        { name: "Casual", options: ["sundress", "shirt dress", "wrap dress", "slip dress", "sweater dress", "denim dress"] },
        { name: "Fitted", options: ["bodycon dress", "sheath dress", "bandage dress", "corset dress", "halter dress", "off-shoulder dress"] },
        { name: "Formal", options: ["cocktail dress", "mermaid gown", "A-line gown", "ball gown", "column gown", "high-slit evening gown", "empire-waist gown", "one-shoulder gown", "backless gown"] },
      ] },
      { key: "skirt_style", type: "chips", label: "Skirt style", groups: [
        { name: "Short", options: ["micro-mini skirt", "mini skirt", "pleated mini skirt", "wrap mini skirt", "skater skirt"] },
        { name: "Medium", options: ["pencil skirt", "A-line skirt", "circle skirt", "slip skirt", "tiered midi skirt"] },
        { name: "Long", options: ["maxi skirt", "high-slit skirt", "mermaid skirt", "pleated maxi skirt", "satin maxi skirt", "wrap maxi skirt"] },
      ] },
      { key: "garment_pattern", type: "chips", label: "Fabric design", groups: [
        { name: "Classic", options: ["solid", "pinstripe", "plaid", "gingham", "polka dot", "color-blocked"] },
        { name: "Decorative", options: ["floral", "paisley", "lace overlay", "embroidered", "sequined", "animal print", "geometric print"] },
      ] },
      { key: "nail_color", type: "chips", label: "Fingernail color", options: ["natural", "clear gloss", "French manicure", "nude", "white", "black", "red", "burgundy", "pink", "purple", "silver", "gold"] },
      { key: "nail_shape", type: "chips", label: "Fingernail shape", options: ["short natural", "almond", "oval", "square", "coffin", "stiletto"] },
      { key: "glasses_style", type: "chips", label: "Glasses", options: ["thin metal frames", "black rectangular frames", "round frames", "cat-eye frames", "oversized glasses", "clear frames", "sunglasses"] },
      { key: "glasses_color", type: "chips", label: "Glasses color", options: ["black", "silver", "gold", "tortoiseshell", "clear", "red", "pink"] },
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
        ...PHOTOGRAPHY_POSE_GROUPS,
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
      { key: "distance", type: "chips", label: "Framing", options: ["close-up", "portrait", "waist-up", "thigh-up", "knees-up", "full body", "wide shot", "detail shot"] },
      { key: "focus", type: "chips", label: "Composition priority", options: ["face", "body", "breasts", "butt", "hips", "legs", "feet", "hands", "full frame"] },
      { key: "hands", type: "chips", label: "Hand position (choose one)", options: ["at sides", "on hips", "in hair", "touching body", "on breasts", "between legs", "gripping something", "over head", "behind back", "behind head"] },
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
      { key: "gag", type: "chips_multi", label: "Gag (one type, optional bib)", exclusiveGroups: [["ball gag", "ring gag", "bit gag", "cleave gag", "tape gag", "panty gag", "dildo gag", "muzzle", "spider gag"]], options: [
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
      { key: "cast_size", type: "chips", label: "Cast size", options: ["solo", "duo", "trio", "threesome", "foursome", "group", "gangbang", "orgy"] },
      { key: "cast_age_mode", type: "chips", label: "Cast ages", options: ["individual ages", "same age", "age contrast"] },
      { key: "cast_age_gap", type: "slider", label: "Age gap from Subject A", min: 1, max: 50, step: 1, defaultValue: 20 },
      { key: "cast_resemblance", type: "chips", label: "Facial resemblance", options: ["from cast pairing", "individual faces", "similar facial features", "matching faces"] },
      { key: "cast_type", type: "chips", label: "Cast pairing", options: [
        "none", "twins", "identical twins", "triplets", "sisters", "best friends", "roommates",
        "mother and daughter", "stepmom and stepdaughter", "aunt and niece",
        "grandma and granddaughter", "grandmother, mother and daughter", "milf granny", "mature and young",
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
      { key: "explicit_level", type: "slider", label: "Explicit level (off → depraved)", min: 0, max: 100, step: 1, defaultValue: 0 },
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
      { key: "phase", type: "chips", label: "Moment in scene", options: ["before", "starting", "in progress", "ending", "afterward"] },
      { key: "stance", type: "chips", label: "Body position", groups: [
        { name: "Standing", options: ["standing upright", "leaning against wall", "slight forward lean", "one leg raised", "walking away"] },
        { name: "Other", options: ["seated", "crouching", "kneeling", "reclining"] },
      ] },
      { key: "surface", type: "chips", label: "Surface / surroundings", options: ["white tile", "dark tile", "concrete", "wood floor", "grass", "sand", "shower drain", "bathtub edge", "bed sheets"] },
      { key: "garment_detail", type: "chips", label: "Clothing detail", options: ["dry clothing", "damp fabric", "wet hem", "wet jeans", "wet dress", "wet stockings", "water droplets on fabric"] },
      { key: "liquid_visibility", type: "chips", label: "Visible effect", options: ["subtle dampness", "visible droplets", "small puddle", "spreading puddle", "reflective wet floor", "running droplets", "splash marks"] },
      { key: "camera_view", type: "chips", label: "Scene camera view", options: ["full figure", "three-quarter figure", "waist-down", "floor-level detail", "side profile", "rear three-quarter", "wide environmental view"] },
      { key: "scene_props", type: "chips_multi", label: "Scene props (pick many)", options: ["towel", "bath mat", "mirror", "sink", "shower curtain", "bathtub", "floor drain", "laundry basket", "wet footprints"] },
      { key: "scene_notes", type: "text", label: "Additional scene details" },
      { key: "urine_color", type: "chips", label: "Fluid color", options: ["nearly colorless transparent", "clear with a faint straw tint", "very pale yellow", "light straw yellow", "warm yellow", "deep amber"] },
      { key: "self_action", type: "chips", label: "Self-directed action", options: ["self urination", "looking down at stream", "holding clothing clear", "seated on toilet", "squatting outdoors", "checking wet clothing", "washing afterward"] },
      { key: "self_aim", type: "chips", label: "Where the stream lands", options: ["into toilet bowl", "into shower drain", "onto floor near feet", "onto grass", "onto sand", "onto clothing", "into bathtub"] },
      { key: "flow_appearance", type: "chips", label: "Fluid behavior", options: ["single continuous gravity-driven stream", "thin gentle stream", "natural irregular stream", "light broken droplets", "subtle splashing at landing point"] },
      { key: "highlight", type: "chips", label: "Visibility in photograph", options: ["soft side-lit highlights", "small specular highlights", "visible against darker background", "subtle reflection on tile", "backlit transparent stream"] },
    ],
  },
  {
    key: "scene",
    title: "Scene",
    fields: [
      { key: "environment", type: "chips", label: "Environment", options: ["studio", "beach", "forest", "urban street", "rooftop", "bedroom", "living room", "bathroom", "warehouse", "desert", "neon alley", "castle"] },
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
      { key: "anatomy_mode", type: "chips", label: "Human anatomy guard", options: ["natural", "enhanced", "extreme"], defaultValue: "natural" },
      { key: "render", type: "chips", label: "Render", defaultValue: "photorealistic", options: ["photorealistic", "cinematic", "analog film", "studio photography", "editorial", "documentary", "35mm film"] },
      { key: "film_grain", type: "chips", label: "Film grain", options: ["none", "subtle", "medium", "heavy"] },
      { key: "artistic_tone", type: "chips", label: "Tone", options: ["natural", "moody", "vibrant", "desaturated", "high-contrast", "faded"] },
      { key: "extra", type: "text", label: "Extra style tokens" },
    ],
  },
];

export const DEFAULT_DNA = SECTIONS.reduce((acc, s) => {
  acc[s.key] = {};
  s.fields.forEach((f) => {
    if (f.type === "slider") acc[s.key][f.key] = f.defaultValue ?? Math.round((f.min + f.max) / 2);
    else if (f.type === "chips_multi") acc[s.key][f.key] = [];
    else acc[s.key][f.key] = f.defaultValue ?? "";
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
  scenario: new Set(["explicit_level"]),
  wardrobe: new Set(["exposure_mode", "nudity_level", "hosiery_type", "hosiery_color", "hosiery_pattern", "heel_type", "heel_color", "heel_height", "heel_finish", "garment_color", "dress_style", "skirt_style", "garment_pattern", "nail_color", "nail_shape", "glasses_style", "glasses_color"]),
};

// A field may allow several details while still having mutually exclusive choices.
export function normalizeMultiSelection(field, selected = [], previous = []) {
  const added = selected.find((option) => !previous.includes(option));
  if (!added) return selected;
  const conflicting = (field.exclusiveGroups || []).find((group) => group.includes(added));
  return conflicting ? selected.filter((option) => option === added || !conflicting.includes(option)) : selected;
}

export function randomizeSection(sectionKey, current = {}, fieldLocks = {}, options = {}) {
  const section = SECTIONS.find((s) => s.key === sectionKey);
  const out = { ...current };
  const preserveProtected = options.preserveProtected !== false;
  const conservative = options.profile !== "adventurous";
  const basicPools = {
    'pose.action': ['standing', 'standing hip out', 'standing hands on hips', 'sitting on edge', 'kneeling upright'],
    'pose.angle': ['front', '3/4', 'profile'],
    'pose.distance': ['full body', 'wide shot', 'thigh-up'],
    'pose.focus': ['full frame', 'body', 'face'],
    'pose.hands': ['at sides', 'on hips'],
    'camera.angle': ['eye-level'],
    'style.render': ['photorealistic'],
    'style.anatomy_mode': ['natural', 'enhanced'],
    'physique.bust': ['small', 'medium', 'large'],
    'physique.butt': ['toned', 'round', 'large'],
    'physique.thighs': ['slim', 'toned', 'athletic', 'thick'],
    'physique.hips': ['narrow', 'average', 'wide'],
    'physique.waist': ['average', 'slim', 'cinched'],
    'physique.glute_shape': ['natural rounded', 'athletic lifted', 'soft pear-shaped', 'heart-shaped'],
  };
  const sliderRanges = {
    'physique.muscularity': [0, 55], 'physique.implant_volume': [0, 1200],
    'physique.bust_scale': [20, 60], 'physique.butt_scale': [25, 100],
    'physique.thigh_scale': [20, 60], 'physique.hip_scale': [25, 65],
    'physique.waist_scale': [25, 65], 'skin.glow': [0, 50],
  };
  section.fields.forEach((f) => {
    if (sectionKey === "wardrobe" && f.key === "outfit_mode") return; // keep the chosen outfit workflow
    if (fieldLocks?.[f.key]) return; // per-field lock — keep current value
    if (preserveProtected && RANDOMIZE_PROTECTED_FIELDS[sectionKey]?.has(f.key)) return;
    if (f.type === "chips" || f.type === "pose_chips") {
      const pool = conservative && basicPools[`${sectionKey}.${f.key}`] || (f.groups ? f.groups.flatMap((g) => g.options) : (f.options || []));
      const alternatives = options.avoidCurrent ? pool.filter(value => value !== current[f.key]) : pool;
      if (pool.length) out[f.key] = pick(alternatives.length ? alternatives : pool);
    }
    else if (f.type === "chips_multi") {
      const pool = f.groups ? f.groups.flatMap((g) => g.options) : (f.options || []);
      const n = conservative ? 1 : 1 + Math.floor(Math.random() * 3);
      const shuffled = [...pool].sort(() => Math.random() - 0.5);
      out[f.key] = shuffled.slice(0, n).reduce((picked, option) => normalizeMultiSelection(f, [...picked, option], picked), []);
    }
    else if (f.type === "slider") {
      const [low, high] = conservative && sliderRanges[`${sectionKey}.${f.key}`] || [f.min, f.max];
      const min = Math.max(f.min, low), max = Math.min(f.max, high), step = f.step || 1;
      out[f.key] = min + Math.floor(Math.random() * (Math.floor((max - min) / step) + 1)) * step;
    }
    else if (f.type === "text") out[f.key] = out[f.key] || "";
  });
  if (preserveProtected && sectionKey === 'hair' && !fieldLocks.length) {
    if (/bun|chignon|ponytail|updo|braid|locs|twists/i.test(out.style) && ['pixie', 'short bob'].includes(out.length)) out.length = pick(['shoulder', 'long', 'waist-length']);
    if (/pixie|buzz|bob/i.test(out.style)) out.length = /bob/i.test(out.style) ? 'short bob' : 'pixie';
  }
  if (preserveProtected && sectionKey === 'pose' && !fieldLocks.hands && out.action === 'standing hands on hips') out.hands = 'on hips';
  return out;
}

export const HERITAGE_VARIATION_FIELDS = {
  physique: null,
  face: null,
  hair: null,
  skin: null,
  intimate: ["pubic_hair", "pussy", "nipples", "areolas"],
  wardrobe: ["outfit_preset"],
  pose: null,
};

export const HERITAGE_DENSITIES = {
  simple: { label: "Simple", optionalChance: 0.18, multiMax: 1, feetChance: 0.02 },
  balanced: { label: "Balanced", optionalChance: 0.42, multiMax: 1, feetChance: 0.07 },
  detailed: { label: "Detailed", optionalChance: 0.68, multiMax: 2, feetChance: 0.14 },
  surprise: { label: "Surprise me", optionalChance: 0.82, multiMax: 2, feetChance: 0.22 },
};

export const HERITAGE_CASTS = {
  solo: { label: "Solo", castSize: "solo", castType: "none" },
  twins: { label: "Twins", castSize: "duo", castType: "identical twins" },
  sisters: { label: "Sisters", castSize: "duo", castType: "sisters" },
  mother_daughter: { label: "Mother / Daughter", castSize: "duo", castType: "mother and daughter" },
};

const HERITAGE_CORE_FIELDS = {
  physique: new Set(["height", "body_type", "bust", "butt"]),
  face: new Set(["eye_shape", "eye_color", "jaw", "nose", "lips"]),
  hair: new Set(["length", "style", "color", "texture"]),
  skin: new Set(["tone", "texture"]),
  wardrobe: new Set(["outfit_preset"]),
  pose: new Set(["action", "angle", "distance", "expression"]),
};

function randomizeHeritageSection(sectionKey, current, fieldLocks, density) {
  const section = SECTIONS.find((item) => item.key === sectionKey);
  const out = { ...current };
  if (!section) return out;
  const allowed = HERITAGE_VARIATION_FIELDS[sectionKey];
  const allowedSet = allowed ? new Set(allowed) : null;
  const core = HERITAGE_CORE_FIELDS[sectionKey] || new Set();
  section.fields.forEach((field) => {
    if (fieldLocks?.[field.key] || (allowedSet && !allowedSet.has(field.key))) return;
    if (RANDOMIZE_PROTECTED_FIELDS[sectionKey]?.has(field.key)) return;
    const shouldFill = core.has(field.key) || Math.random() < density.optionalChance;
    if (!shouldFill) {
      if (field.type === "chips_multi") out[field.key] = [];
      else if (["chips", "pose_chips", "text"].includes(field.type)) out[field.key] = "";
      return;
    }
    const pool = field.groups ? field.groups.flatMap((group) => group.options) : (field.options || []);
    if (["chips", "pose_chips"].includes(field.type) && pool.length) out[field.key] = pick(pool);
    else if (field.type === "chips_multi" && pool.length) {
      const count = 1 + Math.floor(Math.random() * Math.max(1, density.multiMax));
      out[field.key] = [...pool].sort(() => Math.random() - 0.5).slice(0, count);
    } else if (field.type === "slider") {
      out[field.key] = Math.floor(Math.random() * (field.max - field.min + 1)) + field.min;
    }
  });
  return out;
}

// Builds a complete character around a selected heritage without touching Play,
// fluids, selected acts, or the Explicit/Kink dials. null means every selectable
// field in that section; an array limits the roll to the named fields.
export function createHeritageCharacterVariation(
  currentDna = DEFAULT_DNA,
  presetDna = {},
  sectionLocks = {},
  fieldLocks = {},
  options = {}
) {
  const density = HERITAGE_DENSITIES[options.density] || HERITAGE_DENSITIES.balanced;
  const next = {};
  Object.keys(DEFAULT_DNA).forEach((sectionKey) => {
    next[sectionKey] = {
      ...DEFAULT_DNA[sectionKey],
      ...(currentDna?.[sectionKey] || {}),
      ...(presetDna?.[sectionKey] || {}),
    };
  });

  Object.entries(HERITAGE_VARIATION_FIELDS).forEach(([sectionKey, allowedFields]) => {
    if (sectionLocks?.[sectionKey]) return;
    const section = SECTIONS.find((item) => item.key === sectionKey);
    if (!section) return;

    const allowed = allowedFields ? new Set(allowedFields) : null;
    const locksForSection = { ...(fieldLocks?.[sectionKey] || {}) };
    section.fields.forEach((field) => {
      if (allowed && !allowed.has(field.key)) locksForSection[field.key] = true;
    });
    next[sectionKey] = randomizeHeritageSection(sectionKey, next[sectionKey], locksForSection, density);
  });

  // Feet are supporting detail in a heritage preset, never the default subject.
  // They are only rolled occasionally and Play/fluids/acts remain untouched.
  if (!sectionLocks?.feet && Math.random() < density.feetChance) {
    const feetFields = new Set(["sole_presentation", "pedicure", "foot_size"]);
    const feetLocks = { ...(fieldLocks?.feet || {}) };
    const section = SECTIONS.find((item) => item.key === "feet");
    section?.fields.forEach((field) => { if (!feetFields.has(field.key)) feetLocks[field.key] = true; });
    next.feet = randomizeHeritageSection("feet", next.feet, feetLocks, density);
  } else if (!sectionLocks?.feet) {
    ["sole_presentation", "pedicure", "foot_size", "arch", "framing"].forEach((key) => {
      if (!fieldLocks?.feet?.[key]) next.feet[key] = "";
    });
    if (!fieldLocks?.feet?.toes) next.feet.toes = [];
  }

  if (!sectionLocks?.pose && !fieldLocks?.pose?.focus) {
    next.pose.focus = pick(["full frame", "full frame", "body", "body", "face"]);
  }

  // Apply heritage, then restore every locked value. Locks always win over
  // presets and randomization, including locks on non-randomized preset fields.
  next.identity = { ...next.identity, ...(presetDna?.identity || {}) };
  Object.entries(sectionLocks || {}).forEach(([sectionKey, locked]) => {
    if (locked && currentDna?.[sectionKey]) next[sectionKey] = { ...currentDna[sectionKey] };
  });
  Object.entries(fieldLocks || {}).forEach(([sectionKey, lockedFields]) => {
    Object.entries(lockedFields || {}).forEach(([fieldKey, locked]) => {
      if (locked && currentDna?.[sectionKey]) {
        next[sectionKey] = {
          ...next[sectionKey],
          [fieldKey]: currentDna[sectionKey][fieldKey],
        };
      }
    });
  });

  // Clamp defensively so a saved/imported character can never be rolled below 21.
  next.identity = {
    ...next.identity,
    age: Math.max(21, Number(next.identity?.age) || 21),
  };
  return next;
}

export function randomizeDna(current = {}, locks = {}, fieldLocks = {}, options = {}) {
  const out = { ...current };
  SECTIONS.forEach((s) => {
    if (locks[s.key]) return;
    // Keep optional foot styling opt-in during whole-character randomization.
    if (s.key === "feet") { out.feet = { ...(current.feet || {}) }; return; }
    out[s.key] = randomizeSection(s.key, current[s.key] || {}, fieldLocks?.[s.key] || {}, options);
  });
  return out;
}

export function resetSection(sectionKey) {
  return { ...DEFAULT_DNA[sectionKey] };
}

// Phase groupings for the wizard rail — clusters 16 sections into 4 collapsible bands.
export const PHASES = [
  { key: "body",     label: "Body",     hint: "Who she is", sections: ["identity", "physique", "face", "hair", "skin", "feet"] },
  { key: "intimate", label: "Intimate", hint: "Anatomy & fluids", sections: ["intimate"] },
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
  const cs = dna._catalogSelections?.scenario?.cast_size || sc.cast_size || "solo";
  const ct = dna._catalogSelections?.scenario?.cast_type || sc.cast_type || "none";
  const isPairing = ct && ct !== "none";
  if (ct === "triplets" || ct === "grandmother, mother and daughter") return 3;
  if (cs === "orgy" || cs === "gangbang") return Math.min(MAX_SUBJECTS, 4);
  if (cs === "group") return Math.min(MAX_SUBJECTS, 4);
  if (cs === "foursome") return 4;
  if (cs === "trio") return 3;
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

  if (pairing === "twins" || pairing === "identical twins" || pairing === "triplets") {
    // Clone A verbatim (twins should look alike)
    return JSON.parse(JSON.stringify(primaryDna || DEFAULT_DNA));
  }
  if (pairing === "grandmother, mother and daughter") {
    const relative = JSON.parse(JSON.stringify(primaryDna || DEFAULT_DNA));
    relative.identity = {
      ...relative.identity,
      age: subjectIndex === 1 ? Math.max(44, Math.min(56, (primaryAge || 74) - 24)) : Math.max(21, Math.min(32, (primaryAge || 74) - 48)),
      name: "",
    };
    relative.face = { ...relative.face, expression: DEFAULT_DNA.face.expression };
    return relative;
  }
  if (pairing === "sisters") {
    const clone = JSON.parse(JSON.stringify(primaryDna || DEFAULT_DNA));
    const ageOffset = subjectIndex % 2 ? -3 : 3;
    clone.identity = { ...clone.identity, age: Math.max(21, (primaryAge || 27) + ageOffset), name: "" };
    // Preserve the recognizable family traits while allowing the user to edit either sister.
    clone.face = { ...clone.face, expression: DEFAULT_DNA.face.expression };
    clone.hair = { ...clone.hair, style: clone.hair?.style === "wavy" ? "half-up" : "wavy" };
    return clone;
  }
  if (pairing === "best friends" || pairing === "roommates") {
    setAge(Math.max(21, primaryAge || 25));
  } else if (pairing === "mother and daughter") {
    // Clone inherited appearance, then create an unmistakable adult generation gap.
    const relative = JSON.parse(JSON.stringify(primaryDna || DEFAULT_DNA));
    relative.identity = {
      ...relative.identity,
      age: Math.max(21, (primaryAge || 44) - 23),
      archetype: "girl next door",
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

export function selfStreamContinuityCue(watersports = {}) {
  if (watersports.source !== "self" || watersports.phase !== "in progress") return "";
  return `one continuous stream from the same adult subject to ${watersports.self_aim || "a visible landing point"}, following gravity, with a subtle highlight at the landing point; no detached or duplicate stream`;
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
  const pairing = primary?._catalogSelections?.scenario?.cast_type || primary?.scenario?.cast_type || "none";
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
    "clearly separated subjects, each person has an independent complete body, distinct face, torso, pelvis, arms and legs, no merged bodies or shared limbs",
    familyScene && "all depicted people are adults age 21 or older, recognizable shared family resemblance in facial structure and heritage while preserving distinct adult identities",
    shared.scenario && `PRIMARY SCENE ACTION — ${shared.scenario}`,
    clauses.join("; "),
    priorityClauses,
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
    return v ? expandPrompt(section, field, v, { raunch, dna }) : "";
  };
  const join = _join;

  const st = dna.style || {};
  const genre = exp("style", "render") || "photorealistic photograph";
  const qualityLead = join(["photorealistic editorial photograph", "high detail", "natural color", "realistic texture"]);

  // Cast headcount — force multi-subject language when scenario says duo/threesome/pair
  // OR when we have >1 explicit subject fed in.
  const castHeadcount = (() => {
    // Explicit subject records are authoritative. A generic "group" must not
    // introduce a fifth person or turn a mixed cast into women only.
    if (subjectCount > 1) return `exactly ${subjectCount} adult people in the frame, every selected subject visible`;
    const inferred = expectedSubjectCount(dna);
    if (inferred > 1) return `exactly ${inferred} adult people in the frame, every selected subject visible`;
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
  // Dials below 40 are treated as neutral defaults. Specific selected content
  // still appears through the intimate/kink/watersports blocks.
  const explicitTag = explicitLevel >= 85 ? "extreme depraved XXX hardcore, uncensored graphic pornographic scene"
                     : explicitLevel >= 65 ? "hardcore explicit adult scene, uncensored NSFW"
                     : explicitLevel > 40 ? "explicit adult content, NSFW" : "";

  const scenarioStr = join([
    sc.cast_size && sc.cast_size !== "solo" && exp("scenario", "cast_size"),
    sc.cast_type && sc.cast_type !== "none" && exp("scenario", "cast_type"),
    sc.roleplay && sc.roleplay !== "none" && exp("scenario", "roleplay"),
    Array.isArray(sc.acts)
      ? sc.acts.filter((a) => a && a !== "none").map((a) => expandPrompt("scenario", "acts", a, { raunch })).join(", ")
      : (sc.acts && sc.acts !== "none" && exp("scenario", "acts")),
    explicitTag,
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
    hasExplicit: !!scenarioStr || explicitLevel > 0,
    anatomy: (has) => has
      ? "detailed anatomy with natural proportions, anatomically correct body, realistic weight distribution, natural breast shape with realistic gravity, detailed vulva, visible labia, realistic skin flush, natural moisture"
      : "detailed anatomy with natural proportions, anatomically correct body, natural weight distribution",
  };
}

// -------- Per-subject Venice block (identity/body/face/hair/skin/wardrobe/pose/intimate/feet/kink/ws) --------
// Empty (zero) dials leave saved presets untouched. Numeric values are visual
// direction, never a promise that the image model can measure anatomy exactly.
function visualScale(value, noun, labels) {
  const n = Number(value) || 0;
  if (!n) return "";
  const tier = n < 20 ? 0 : n < 40 ? 1 : n < 60 ? 2 : n < 80 ? 3 : 4;
  return `${labels[tier]} ${noun}${n >= 80 ? " (stylized fantasy proportions)" : ""}`;
}

function _veniceSubjectBlock(dna = {}, opts = {}) {
  dna = resolveAgeSkin(dna);
  dna = { ...dna, wardrobe: resolveWardrobeMode(dna.wardrobe || {}) };
  const raunch = !!opts.raunch;
  const val = (section, field) => dna?.[section]?.[field] || "";
  const exp = (section, field) => {
    const v = val(section, field);
    return v ? expandPrompt(section, field, v, { raunch, dna }) : "";
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

  const selectedGender = catalogSelection(dna, "identity", "gender");
  const gender = selectedGender === "male" ? "man"
    : selectedGender === "non-binary" ? "non-binary adult"
    : selectedGender === "androgynous" ? "androgynous adult"
    : "woman";
  const age = Number(id.age || 0);
  const ageHead = age ? `${age}-year-old ${age >= 45 ? 'mature' : 'adult'} ${gender}` : `adult ${gender}`;
  const ageStr = join([age >= 45 ? `(${ageHead}:1.35)` : ageHead, ageAppearancePrompt(age)]);
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
    ph.implant_volume > 0 ? "" : ph.bust_scale ? visualScale(ph.bust_scale, "bust", ["small", "moderate", "full", "very large", "extremely oversized"]) : exp("physique", "bust") || (ph.bust && `${ph.bust} breasts`),
    ph.implant_volume > 0 ? "round augmented breast shape" : bustShapePrompt(ph.bust_shape),
    implantVisualPrompt(ph.implant_volume),
    ph.butt_scale > 100 ? gluteSizePrompt(ph.butt_scale) : ph.butt_scale ? visualScale(ph.butt_scale, "glutes", ["small", "moderate", "full rounded", "very large projected", "extremely oversized projected"]) : exp("physique", "butt") || (ph.butt && `${ph.butt} butt`),
    ph.glute_shape,
    ph.thigh_scale ? visualScale(ph.thigh_scale, "thighs", ["slim", "moderate", "full", "very thick", "extremely thick"]) : exp("physique", "thighs") || (ph.thighs && `${ph.thighs} thighs`),
    ph.hip_scale ? visualScale(ph.hip_scale, "hips", ["narrow", "moderate width", "wide", "very wide", "extremely wide"]) : exp("physique", "hips") || (ph.hips && `${ph.hips} hips`),
    ph.waist_scale ? visualScale(ph.waist_scale, "waist", ["very narrow", "narrow", "average width", "wide", "very wide"]) : exp("physique", "waist"),
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
    skin.glow > 85 ? "high-gloss skin finish with strong reflected highlights"
      : skin.glow > 60 ? "dewy glowing luminous skin, healthy sheen" : "",
  ]);
  const nameTag = id.name ? `portrait of ${id.name}` : "";
  const subject = join([nameTag, subjectHead, subjectBody, subjectFace, hairStr, hairExtras, skinDetails]);

  // -------- Wardrobe --------
  const wd = resolveWardrobeMode(dna.wardrobe || {});
  const nudity = wardrobeNudity(wd);
  const outfitPieces = [];
  if (!nudity.suppressClothing && wd.outfit_set) outfitPieces.push(`${wd.outfit_set_color ? `${wd.outfit_set_color} ` : ""}${wd.outfit_set}`);
  if (!nudity.suppressClothing && !wd.outfit_set) {
  if (!wd.outfit_set && wd.outfit_preset && !wd.dress_style && !wd.skirt_style) outfitPieces.push(exp("wardrobe", "outfit_preset"));
  if (wd.dress_style) outfitPieces.push(wd.dress_style);
  if (wd.skirt_style) outfitPieces.push(wd.skirt_style);
  if (!wd.dress_style && wd.top && wd.top !== "none") outfitPieces.push(exp("wardrobe", "top"));
  if (!wd.dress_style && !wd.skirt_style && wd.bottom && wd.bottom !== "none") outfitPieces.push(exp("wardrobe", "bottom"));
  if (wd.underwear && wd.underwear !== "none") outfitPieces.push(exp("wardrobe", "underwear"));
  if (!wd.heel_type && wd.footwear && wd.footwear !== "barefoot") outfitPieces.push(exp("wardrobe", "footwear"));
  if (wd.hosiery_type) outfitPieces.push(`${wd.hosiery_color ? `${wd.hosiery_color} ` : ""}${wd.hosiery_denier ? `${wd.hosiery_denier} ` : ""}${wd.hosiery_pattern && wd.hosiery_pattern !== "plain" ? `${wd.hosiery_pattern} ` : ""}${wd.hosiery_type}`);
  if (wd.heel_type) outfitPieces.push(`${wd.heel_color ? `${wd.heel_color} ` : ""}${wd.heel_finish ? `${wd.heel_finish} ` : ""}${wd.heel_type}${wd.heel_height ? `, ${wd.heel_height} heel` : ""}`);
  if (wd.glasses_style) outfitPieces.push(`${wd.glasses_color ? `${wd.glasses_color} ` : ""}${wd.glasses_style}`);
  if (wd.accessories) {
    const accs = Array.isArray(wd.accessories) ? wd.accessories : [wd.accessories];
    accs.filter((a) => a && a !== "none").forEach((a) => outfitPieces.push(exp("wardrobe", "accessories") ? expandPrompt("wardrobe", "accessories", a) : a));
  }
  }
  const outfitCore = outfitPieces.length ? `wearing ${outfitPieces.join(", ")}` : "";
  const outfitTail = join([
    !nudity.suppressClothing && exp("wardrobe", "material"),
    !nudity.suppressClothing && wd.garment_color && `${wd.garment_color} outfit color`,
    !nudity.suppressClothing && wd.garment_pattern && wd.garment_pattern !== "solid" && `${wd.garment_pattern} fabric pattern`,
    !nudity.suppressClothing && wd.palette && `${wd.palette} color palette`,
    !nudity.suppressClothing && wd.fit && `${wd.fit} fit`,
    !nudity.suppressClothing && wd.state && wd.state !== "fully clothed" && exp("wardrobe", "state"),
    wd.nail_color && `${wd.nail_color} fingernails`,
    wd.nail_shape && `${wd.nail_shape} nail shape`,
  ]);
  const outfit = join([
    nudity.direction, outfitCore,
    nudity.suppressClothing && wd.hosiery_type && `${wd.hosiery_color ? `${wd.hosiery_color} ` : ""}${wd.hosiery_type}`,
    outfitTail,
  ]);

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
      ? pose.hands.filter(Boolean).slice(-1).map((h) => expandPrompt("pose", "hands", h)).join(", ")
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
    !(im.nipple_size || im.nipple_shape) && exp("intimate", "nipples"),
    !(im.areola_size || im.areola_shape || im.areola_color || im.areola_detail) && exp("intimate", "areolas"),
    exp("intimate", "nipple_size"),
    exp("intimate", "nipple_shape"),
    exp("intimate", "areola_size"),
    exp("intimate", "areola_shape"),
    exp("intimate", "areola_color"),
    exp("intimate", "areola_detail"),
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
  const feetActive = !!(ft.foot_size || ft.sole_presentation || (Array.isArray(ft.toes) && ft.toes.length) || ft.arch || ft.pedicure ||
    (Array.isArray(ft.foot_state) && ft.foot_state.length) || ft.hosiery ||
    (Array.isArray(ft.foot_act) && ft.foot_act.length) || ft.framing || ft.foot_pose ||
    ft.toe_length || ft.sole_texture || ft.pedicure_art || ft.toenail_shape ||
    (Array.isArray(ft.foot_accessories) && ft.foot_accessories.length) || ft.ground_surface);
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
    ft.foot_pose && exp("feet", "foot_pose"),
    ft.toe_length && exp("feet", "toe_length"),
    ft.sole_texture && exp("feet", "sole_texture"),
    ft.pedicure_art && exp("feet", "pedicure_art"),
    ft.toenail_shape && exp("feet", "toenail_shape"),
    expArr("feet", "foot_accessories"),
    ft.ground_surface && exp("feet", "ground_surface"),
    feetActive && "human feet with coherent ankles, heel and arch, exactly five distinct toes per foot",
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
    ws.phase && exp("watersports", "phase"),
    ws.stance && exp("watersports", "stance"),
    ws.surface && exp("watersports", "surface"),
    ws.garment_detail && exp("watersports", "garment_detail"),
    ws.liquid_visibility && exp("watersports", "liquid_visibility"),
    ws.camera_view && exp("watersports", "camera_view"),
    expArr("watersports", "scene_props"),
    ws.scene_notes && exp("watersports", "scene_notes"),
    ws.urine_color && exp("watersports", "urine_color"),
    ws.self_action && exp("watersports", "self_action"),
    ws.self_aim && exp("watersports", "self_aim"),
    ws.flow_appearance && exp("watersports", "flow_appearance"),
    ws.highlight && exp("watersports", "highlight"),
    selfStreamContinuityCue(ws),
  ]);

  // Selected Feet and Play controls are compositional requirements, not minor
  // styling hints. Promote them ahead of appearance details so long prompts do
  // not cause the text encoder/model to ignore the requested action or framing.
  const feetPriority = feetStr ? `${dna.pose?.focus === "feet" ? "PRIMARY FEET COMPOSITION" : "Supporting foot details"} — ${feetStr}` : "";
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

function _takeWords(text, maxWords) {
  return String(text || "").split(/\s+/).filter(Boolean).slice(0, maxWords).join(" ").replace(/[,; ]+$/, "");
}

function _compactChromaSubject(subject, opts, maxWords) {
  const dna = subject?.dna || {};
  const label = subject?.label || "A";
  const block = _veniceSubjectBlock(dna, opts);
  const required = [
    `Subject ${label}`,
    block.pose && `pose: ${block.pose}`,
    block.outfit && `wardrobe: ${block.outfit}`,
  ].filter(Boolean).join(", ");
  const supporting = [
    block.subject,
    block.intimate,
    block.fluids,
    block.playPriority,
    block.feetPriority,
  ].filter(Boolean).join(", ");

  const requiredWords = required.split(/\s+/).filter(Boolean).length;
  const remaining = Math.max(24, maxWords - requiredWords);
  return [required, _takeWords(supporting, remaining)].filter(Boolean).join(", ");
}

export function buildMultiChromaPrompts(subjects = [], opts = {}) {
  if (!Array.isArray(subjects) || subjects.length <= 1) {
    return buildChromaPrompts(subjects?.[0]?.dna || {}, opts);
  }

  const primary = subjects[0]?.dna || {};
  const shared = _veniceSharedBlock(primary, opts, subjects.length);
  const subjectBudget = subjects.length <= 2 ? 105 : subjects.length === 3 ? 72 : 56;
  const subjectClauses = subjects.map((subject) => _compactChromaSubject(subject, opts, subjectBudget));
  const scenario = _takeWords(shared.scenario, subjects.length <= 2 ? 42 : 28);
  const scene = _takeWords(shared.scene, 28);
  const lighting = _takeWords(shared.lighting, 22);
  const camera = _takeWords(shared.camera, 18);
  const style = _takeWords(shared.style, 16);

  const positive = [
    "Natural high-end editorial photograph with realistic human anatomy and believable physical detail",
    shared.castHeadcount,
    "each adult is a separate complete person with one head, one torso and pelvis, two arms and two legs",
    "keep visible separation between bodies; no merged torsos, shared limbs, stacked pelvises, duplicate legs or extra feet",
    scenario && `scene action: ${scenario}`,
    ...subjectClauses,
    scene,
    lighting,
    camera,
    style,
    "anatomically coherent adults, natural joint placement, realistic limb count and perspective",
  ].filter(Boolean).join("; ");

  return {
    positive: _takeWords(positive, 345) + ".",
    negative: CHROMA_NEGATIVE + ", missing subject, extra person, extra torso, extra pelvis, extra arm, extra leg, extra foot, duplicated anatomy, merged bodies, fused people, shared limbs, conjoined bodies, interpenetrating bodies, duplicate face",
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

// Every ethnicity supported by the Identity section gets a searchable one-tap
// selector. These intentionally change only heritage and preserve the rest of
// the current character; the editorial cards below offer fuller looks.
const ALL_HERITAGE_PRESETS = (ethnicityField?.groups || []).flatMap((group) =>
  group.options.map((ethnicity) => ({
    name: `${heritageLabel(ethnicity)} Heritage`,
    description: HERITAGE_PROFILES[ethnicity]?.description,
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
      scenario: { explicit_level: 40 },
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
      scenario: { explicit_level: 80 },
    },
  },
  {
    name: "Bound & Wrecked",
    tags: ["shibari", "gag", "impact"],
    dna: {
      kink: { restraint: ["rope shibari", "wrists overhead"], gag: ["ball gag", "drool bib"], marks: ["red handprint", "rope marks", "welts"], humiliation: ["ahegao expression", "mind-break", "drooling", "mascara tears"], orgasm_control: ["forced orgasm", "overstimulation"], power_dynamic: "master and slave" },
      face: { expression: "sultry" },
      intimate: { tears: "mascara tears", saliva: ["drool from mouth", "drool from chin"] },
      scenario: { explicit_level: 70 },
    },
  },
  {
    name: "Bukkake Queen",
    tags: ["cum", "group", "facial"],
    dna: {
      scenario: { cast_size: "group", acts: ["bukkake", "facial", "cum on tits", "cum on face"], explicit_level: 95 },
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
      scenario: { explicit_level: 50 },
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
      scenario: { roleplay: "milf", explicit_level: 60 },
    },
  },
  {
    name: "Toilet Toy",
    tags: ["watersports", "humiliation", "degradation"],
    dna: {
      watersports: { source: "group", direction: ["in mouth", "on face", "held in"], stream: "steady stream", container: "toilet", desperation: "humiliated", aftermath: ["smeared mascara", "wet hair", "wet clothes"] },
      kink: { restraint: ["collar and leash"], humiliation: ["degradation stare", "spit on face", "used", "wrecked", "drooling"], power_dynamic: "owner and pet" },
      scenario: { explicit_level: 90 },
    },
  },
];
