Warning: truncated output (original token count: 34580)
Total output lines: 2024

import { INTIMATE_EXTRA_FIELDS, intimateAppearancePrompt } from './intimateAppearance';
import { physiqueDetailPrompt, PHYSIQUE_DETAIL_KEYS } from './physiqueDetails';
import { physiqueScalePrompt } from './physiqueScalePrompts';
import {EXTRA_CAMERA_ANGLES,EXTRA_SUBJECT_VIEWS,SPHERICAL_SUBJECT_VIEWS,subjectOrientationDirective} from './cameraViewChoices';
import {layerVisible} from './wardrobeLayerOverrides';
import characterVibeOptions from './characterVibeOptions.json';
import { expandEverydayWardrobe } from './everydayWardrobe';
import { HERITAGE_OUTFIT_GROUP, heritagePhotoOutfit } from './heritageStyling';
import { NATURAL_POOLS, NATURAL_RANGES, enforcePhotoConsistency, preserveSubjectLocks } from './photoConsistency';
import {SIMPLE_COVERAGE_OPTIONS} from './simpleCoverage';
import { catalogSelection } from './promptCatalog';
import { ageAppearancePrompt, resolveAgeSkin } from './ageAppearance';
import { HERITAGE_GROUPS, HERITAGE_LABELS, HERITAGE_PROFILES, heritageLabel } from "./heritageProfiles";
import { ADDITIONAL_OUTFIT_GROUPS, OUTFIT_SET_LABELS, LAYERED_OUTFIT_GROUP, SET_LINGERIE_GROUPS } from "./completeOutfitSets";
import { WARDROBE_CATEGORY_GROUPS, WARDROBE_ITEM_LABELS } from "./wardrobeCatalog";
import { resolveWardrobeMode } from "./wardrobeMode";
import { bustShapePrompt, regionalPhysiquePrompt } from "./physiqueControls";
import { PHOTOGRAPHY_POSE_GROUPS } from "@/lib/photographyPoses";
import { GLUTE_SIZE_MAX, gluteSizePrompt } from "@/lib/gluteControls";
// DNA schema + prompt builder + randomizer
import { expandPrompt } from "@/lib/promptMap";
import { implantVisualPrompt } from "@/lib/implantVisualScale";
import { wardrobeNudity } from "@/lib/wardrobeNudity";

export const SECTIONS = [
  {
    key: "identity",
    title: "Identity",
    fields: [
      { key: "gender", type: "chips", label: "Gender", options: ["female", "male", "non-binary", "androgynous"] },
      { key: "presentation", type: "chips", label: "Presentation", help: "Optional visual presentation cue. This does not change the selected gender.", options: ["feminine-presenting", "masculine-presenting", "androgynous-presenting", "softly feminine", "boldly feminine", "softly masculine", "gender-neutral styling"] },
      { key: "age", type: "slider", label: "Age (adult)", min: 18, max: 80, step: 1, defaultValue: 30, help: "Changing age updates skin texture automatically. New images use age-specific facial detail; hair color and cosmetic finishes stay separate." },
      { key: "ethnicity", type: "chips", label: "Ethnicity", groups: HERITAGE_GROUPS, optionLabels: HERITAGE_LABELS },
      { key: "archetype", type: "chips", label: "Character vibe (optional)", help: "Choose a personality or mood, or leave this blank. Boudoir & portrait choices describe presence only. Older themed presets may also suggest styling.", optionLabels: Object.fromEntries(characterVibeOptions.map(option=>[option.value,option.label])), groups: [
        { name: "Boudoir & portrait", options: characterVibeOptions.map(option=>option.value) },
        { name: "Everyday", options: ["girl next door", "athlete", "artist", "socialite", "scholar"] },
        { name: "Professional & leadership", options: ["creative director", "entrepreneur", "executive", "diplomat", "researcher", "educator", "physician", "architect", "attorney", "journalist", "mentor"] },
        { name: "Creative & cultural", options: ["photographer", "fashion designer", "dancer", "musician", "painter", "novelist", "filmmaker", "chef", "stylist", "curator", "ceramic artist"] },
        { name: "Adventure & athletics", options: ["endurance athlete", "climber", "martial artist", "equestrian", "surfer", "mountaineer", "explorer", "outdoor guide", "runner", "swimmer"] },
        { name: "Personality & presence", options: ["warm and approachable", "witty and observant", "analytical and composed", "quietly confident", "charismatic and expressive", "optimistic and energetic", "rebellious and independent", "thoughtful and reserved", "curious and adventurous", "calm and grounded"] },
        { name: "Royal & cinematic", options: ["queen", "Bollywood princess", "Indian royal", "Arabian princess", "desert queen", "regal heroine"] },
        { name: "Fantasy & action", options: ["warrior", "pirate", "superheroine", "sorceress", "space explorer"] },
        { name: "Style", options: ["femme fatale", "cyberpunk", "goth", "cottagecore", "vintage starlet"] },
      ] },
      { key: "name", type: "text", label: "Name" },
      { key: "identity_details", type: "text", label: "Distinctive identity details", help: "Optional short cues such as profession, signature style, or recognizable personal details." },
    ],
  },
  {
    key: "physique",
    title: "Physique",
    fields: [
      { key: "height", type: "chips", label: "Height", options: ["very petite", "petite", "short", "slightly short", "average", "above average", "tall", "very tall", "statuesque", "towering"] },
      { key: "body_type", type: "chips", label: "Body type", groups: [
        { name: "Build", options: ["slim", "lean", "wiry", "lithe", "athletic", "soft athletic", "muscular", "stocky", "compact", "long-limbed", "powerlifter build", "bodybuilder build"] },
        { name: "Silhouette", options: ["curvy", "voluptuous", "plus size", "rounded plus-size", "hourglass", "petite hourglass", "athletic hourglass", "pear", "pear-shaped", "apple", "apple-shaped", "rectangle", "inverted triangle", "broad-shouldered", "bombshell", "amazonian"] },
      ] },
      { key: "muscularity", type: "slider", label: "Muscularity", min: 0, max: 100, step: 1 },
      { key: "bust", type: "chips", label: "Bust size", options: ["flat", "small", "medium", "large", "very large", "huge", "enormous", "hyper"] },
      { key: "bust_scale", type: "slider", label: "Bust size", min: 0, max: 2000, step: 1, defaultValue: 0 },
      { key: "bust_shape", type: "chips", label: "Bust shape", options: ["natural", "soft natural", "full lower pole", "rounded upper fullness", "wide-set", "close-set", "asymmetric", "perky", "round", "teardrop", "athletic", "augmented", "gravity-defying"] },
      { key: "implant_volume", type: "slider", label: "Implant visual size (cc reference; 0 = none)", min: 0, max: 5000, step: 50, defaultValue: 0, help: "Prompts include the selected visual-size value and projection description. This is a visual reference, not a medical measurement." },
      { key: "butt", type: "chips", label: "Butt", options: ["flat", "small", "toned", "compact rounded", "heart-shaped", "wide and soft", "low-set full", "high-set lifted", "shelf-shaped", "projected", "round", "bubble", "large", "very large", "huge", "hyper"] },
      { key: "butt_scale", type: "slider", label: "Glute size", min: 0, max: 2000, step: 1, defaultValue: 0, help: "0 keeps the Butt preset. 1–100 sets size; 101–300 retains the original fantasy scale; 301–500 adds surreal fantasy volume; 501–1000 moves into Beyond Extreme; 1001–2000 reaches the upper fantasy range. Shape is controlled separately. A rear or three-quarter view makes the silhouette easier to see." },
      { key: "glute_shape", type: "chips", label: "Glute shape / augmentation look", groups: [
        { name: "Natural contours", options: ["natural rounded", "athletic lifted", "soft pear-shaped", "heart-shaped", "gentle teardrop glutes", "soft lower fullness", "natural low-set fullness", "compact rounded glutes", "wide natural glute contour", "subtle side curvature"] },
        { name: "Round & sculpted", options: ["bubble-round glutes", "spherical rounded glutes", "high and tight rounded glutes", "full upper and lower roundness", "deep rounded lower curve", "smooth dome-like projection", "firm athletic roundness", "pronounced upper shelf", "defined glute separation"] },
        { name: "Enhanced / augmentation-inspired", options: ["BBL-style fuller glutes", "high round projection", "dramatic side projection", "subtle augmentation-inspired fullness", "balanced BBL-style contour", "high-profile augmented roundness", "dramatic upper-pole fullness", "wide augmented lower silhouette", "projected shelf-style contour", "lifted teardrop augmentation look", "extreme BBL-inspired silhouette"] },
        { name: "Width & distribution", options: ["broad lateral glute flare", "narrow high-projection glutes", "wide heart-shaped silhouette", "bottom-heavy glute fullness", "upper-heavy glute fullness", "evenly distributed rounded fullness", "strong outer glute curve", "full side-to-rear transition"] },
        { name: "Fantasy & stylized", options: ["fantasy oversized glutes", "extreme round projection", "hyper-round fantasy glutes", "monumental rearward projection", "impossibly broad rounded silhouette", "fantasy bubble shape", "extreme shelf-like upper fullness", "colossal heart-shaped lower silhouette", "surreal spherical projection"] },
      ] },
      { key: "thighs", type: "chips", label: "Thighs", options: ["slim", "lean", "toned", "athletic", "muscular", "full", "thick", "very thick", "massive"] },
      { key: "thigh_scale", type: "slider", label: "Thigh size", min: 0, max: 750, step: 1, defaultValue: 0 },
      { key: "hips", type: "chips", label: "Hips", options: ["narrow", "slightly narrow", "average", "rounded", "wide", "very wide", "pear-shaped", "broad pelvic frame", "extreme"] },
      { key: "hip_scale", type: "slider", label: "Hip width", min: 0, max: 2000, step: 1, defaultValue: 0 },
      { key: "waist", type: "chips", label: "Waist", options: ["thick", "soft full", "average", "straight", "slim", "defined", "cinched", "tiny", "wasp-thin"] },
      { key: "waist_scale", type: "slider", label: "Waist width", min: 0, max: 500, step: 1, defaultValue: 0 },
      { key: "bust_projection", type: "slider", label: "Bust forward projection", min: 0, max: 100, step: 1, defaultValue: 0, help: "Independent of bust volume. Zero leaves projection unspecified." },
      { key: "glute_projection", type: "slider", label: "Glute rear projection", min: 0, max: 100, step: 1, defaultValue: 0, help: "Independent of glute volume. Zero leaves projection unspecified." },
      { key: "hip_flare", type: "slider", label: "Outer hip flare", min: 0, max: 100, step: 1, defaultValue: 0 },
      { key: "thigh_fullness", type: "slider", label: "Thigh lateral fullness", min: 0, max: 100, step: 1, defaultValue: 0 },
      { key: "waist_narrowness", type: "slider", label: "Waist narrowness", min: 0, max: 100, step: 1, defaultValue: 0, help: "Narrowness is independent of the waist width control; avoid setting both to maximum." },
      ...PHYSIQUE_DETAIL_KEYS.map(key=>({key,type:"slider",label:key.replace(/_/g," "),min:0,max:100,step:1,defaultValue:0})),
      { key: "shoulders", type: "chips", label: "Shoulders", options: ["very narrow", "narrow", "sloped", "average", "gently squared", "broad", "broad athletic", "strongly squared", "athletic"] },
      { key: "legs", type: "chips", label: "Legs", options: ["short", "compact", "average", "long", "long-limbed", "slender", "full", "muscular", "endless"] },
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
      { key: "expression", type: "chips", label: "Expression", options: ["neutral", "smirk", "smile", "serious", "sultry", "laughing", "smoldering", "playful"] },
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
      ...INTIMATE_EXTRA_FIELDS.map(field=>({...field,type:"chips"})),
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
      { key: "skin_finish", type: "chips", label: "Foot skin finish", options: ["natural matte", "soft lotion sheen", "light massage oil sheen", "glossy body oil finish"], help: "Cosmetic skin-finish wording for adult editorial beauty photography." },
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
        { name: "Active", options: ["heels raised", "one foot lifted", "toes pointed", "toes flexed", "feet dangling", "walking barefoot", "standing on tiptoe", "one heel resting on a low riser"] },
        { name: "Detail", options: ["soles facing lens", "one sole toward lens", "arches visible in profile", "heels together", "toes toward lens", "pedicure detail with relaxed toes"] },
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
      { key: "exposure_mode", type: "chips", label: "Clothing coverage", options: SIMPLE_COVERAGE_OPTIONS.map(option=>option.value), optionLabels: Object.fromEntries(SIMPLE_COVERAGE_OPTIONS.map(option=>[option.value,option.label])), groups: [...new Set(SIMPLE_COVERAGE_OPTIONS.map(option=>option.group))].map(name=>({name,options:SIMPLE_COVERAGE_OPTIONS.filter(option=>option.group===name).map(option=>option.value)})),
        help: "Choose how clothing is worn or removed. Topless and bottomless keep the opposite garments; barefoot and only choices remove conflicting footwear, hosiery or accessories. Clear the choice to follow your selected outfit." },
      { key: "outfit_preset", type: "chips", label: "Outfit preset", groups: [
        { name: "Bare", options: ["nude", "topless", "bottomless", "just panties", "just a shirt", "boyfriend's shirt"] },
        { name: "Lingerie", options: ["boudoir lingerie", "sheer negligee", "silk robe open", "lace lingerie set", "satin slip", "corset and garters", "sheer bodysuit"] },
        { name: "Bikini", options: ["bikini", "micro bikini", "string bikini", "wet t-shirt"] },
        { name: "Roleplay", options: ["sexy schoolgirl", "naughty nurse", "french maid", "playboy bunny", "showgirl", "cheerleader", "secretary unbuttoned", "librarian undone", "biker chick", "cowgirl chaps", "cop uniform undone", "flight attendant undone"] },
        { name: "Fetish/Kink", options: ["dominatrix", "leather mistress", "latex catsuit", "kinky harness", "shibari rope", "fetish gimp"] },
        { name: "Adult Perf.", options: ["pole dancer", "gogo dancer", "stripper"] },
        { name: "Period fashion", options: ["1920s flapper dress", "1940s tailored suit", "1950s swing dress", "1960s mod shift dress", "1970s disco jumpsuit", "1980s power suit", "1990s minimalist slip dress", "victorian-inspired evening gown"] },
        { name: "Editorial couture", options: ["sculptural couture gown", "avant-garde runway ensemble", "metallic pleated dress", "dramatic cape dress", "architectural blazer dress", "feather-trim evening gown", "asymmetric silk dress", "high-fashion monochrome ensemble"] },
        { name: "Vacation resort", options: ["linen resort co-ord", "flowing beach kaftan", "halter maxi dress", "tropical print wrap dress", "poolside sarong ensemble", "safari chic linen outfit", "Mediterranean sundress", "wide-leg resort trousers"] },
        { name: "Formal", options: ["cocktail dress", "evening gown slit", "backless red carpet", "club outfit", "tailored pantsuit", "velvet gown", "sequined mini dress"] },
        { name: "Athletic", options: ["yoga wear", "gym set", "sports bra and shorts", "cheerleader off-duty"] },
        { name: "Casual", options: ["streetwear", "casual home", "oversized sweater", "denim jacket and skirt", "off-shoulder blouse", "summer romper", "cardigan and slip dress"] },
        { name: "Indian & Bollywood", options: ["embroidered lehenga choli with dupatta", "silk sari with fitted blouse", "ornate anarkali suit", "sharara set with dupatta", "gharara set with embroidered kurta", "Bollywood princess gown with jewelry"] },
        { name: "Arabian inspired", options: ["embroidered kaftan", "formal abaya with matching headscarf", "ornate jalabiya", "beaded evening kaftan"] },
      ]},
      { key: "outfit_set", type: "chips", label: "Complete outfit set", optionLabels: { ...OUTFIT_SET_LABELS, ...WARDROBE_ITEM_LABELS }, groups: [
        ...WARDROBE_CATEGORY_GROUPS,
        { name: "Lingerie sets", options: ["lace balconette set with matching panties, garter belt, stockings and heels", "satin push-up bra set with matching briefs, sheer thigh-highs and stilettos", "embroidered bralette and high-waist panties with seamed stockings and pumps", "sheer mesh bra and thong with fishnet stockings and platform heels", "silk corset and matching panties with garters, lace stockings and heels"] },
        { name: "Costume sets", options: ["French maid dress with apron, matching lingerie, stockings and heels", "classic maid dress with lace headpiece, stockings and pumps", "superheroine bodysuit with matching cape, gloves and boots", "armored heroine suit with matching cape, belt and boots", "royal princess gown with matching jewelry, veil and heels"] },
        { name: "Cultural fashion sets", options: ["Bollywood royal lehenga choli with dupatta, jewelry and embroidered heels", "Indian silk sari with matching blouse, bangles and sandals", "embroidered anarkali with dupatta, earrings and embellished flats", "formal embroidered kaftan with matching jewelry and sandals", "ornate abaya with matching scarf, jewelry and shoes"] },
        HERITAGE_OUTFIT_GROUP, ...ADDITIONAL_OUTFIT_GROUPS, LAYERED_OUTFIT_GROUP,
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
        "teddy", "babydoll", "chemise", "bodysuit", "mesh bodysuit", "corset with garters", "harness lingerie", "leather harness", "bikini set",
        "lace longline bra and high-waist briefs", "plunge balconette bra and matching briefs", "embroidered corset and garter set",
        "silk bralette and French knickers", "velvet bustier and high-waist panties", "bridal lace corset and briefs",
        "sheer babydoll and matching briefs", "rhinestone stage bra and matching briefs"
      ]},
      { key: "footwear", type: "chips", label: "Footwear", options: [
        "barefoot", "stiletto heels", "stripper heels", "thigh-high boots", "over-the-knee boots", "ankle boots", "combat boots", "sneakers", "platform heels", "sandals", "kitten heels", "cowgirl boots"
      ]},
      { key: "hosiery_type", type: "chips", label: "Pantyhose & stockings", options: [
        "sheer pantyhose", "opaque tights", "fishnet tights", "patterned tights", "seamed stockings", "lace-top thigh-high stockings", "stay-up stockings", "garter stockings", "ultra-sheer tights", "semi-opaque tights", "toeless tights", "footless tights", "hold-up stockings", "back-seam stockings", "knee-high nylons", "ankle socks", "over-the-knee socks",
        "sheer black back-seam stockings", "polka-dot sheer tights", "diamond fishnet tights", "wide-net fishnet stockings",
        "lace-top thigh-highs", "opaque ribbed tights", "seamed hold-up stockings", "shimmer pantyhose"
      ]},
      { key: "hosiery_color", type: "chips", label: "Pantyhose / stocking color", groups: [
        { name: "Neutral", options: ["nude", "tan", "espresso", "black", "white", "gray", "brown"] },
        { name: "Color", options: ["red", "burgundy", "navy", "royal blue", "emerald", "pink", "purple", "silver", "gold"] },
      ] },
      { key: "heel_type", type: "chips", label: "Heel type", groups: [
        { name: "Pumps", options: ["pointed-toe stilettos", "round-toe pumps", "platform pumps", "slingback heels", "kitten heels", "block heels", "d'Orsay pumps", "Mary Jane heels", "T-strap heels", "square-toe pumps"] },
        { name: "Sandals", options: ["strappy sandals", "ankle-strap heels", "open-toe heels", "peep-toe heels", "wedge sandals", "mule heels", "gladiator heels", "slide heels", "wraparound lace-up sandals"] },
        { name: "Statement", options: ["sculptural heels", "clear platform heels", "lace-up heels", "thigh-high heeled boots", "cone heels", "cork wedges", "chunky platform boots", "metallic heeled boots"] },
        { name: "Stage & Pole Heels", options: ["7-inch clear platform stripper heels", "ankle-strap platform stripper heels", "rhinestone platform stripper heels", "lace-up knee-high platform boots", "open-toe clear platform heels", "glitter platform dance heels", "over-the-knee stiletto boots", "pole-dance platform boots"] },
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
      { key: "nail_shape", type: "chips", label: "Fingernail shape", options: ["short natural", "almond", "oval", "square", "coffin", "stilet…14580 tokens truncated…tapered waist'} (narrowness intensity ${ph.waist_narrowness}/100)`,
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
  const subject = join([nameTag, subjectHead, id.presentation, id.archetype && id.archetype !== "none" ? `${id.archetype} character presence` : "", id.identity_details, subjectBody, subjectFace, hairStr, hairExtras, skinDetails]);

  // -------- Wardrobe --------
  const wd = resolveWardrobeMode(dna.wardrobe || {});
  const nudity = wardrobeNudity(wd);
  const outfitPieces = [];
  if (!nudity.suppressClothing && wd.outfit_set) outfitPieces.push(`${wd.outfit_set_color ? `${wd.outfit_set_color} ` : ""}${wd.outfit_set}`);
  if (!nudity.suppressClothing && !wd.outfit_set) {
  if (!wd.outfit_set && wd.outfit_preset && !wd.dress_style && !wd.skirt_style && !Object.values(wd._layerVisibility || {}).some(visible=>visible===false)) outfitPieces.push(exp("wardrobe", "outfit_preset"));
  if (layerVisible(wd,"dress") && wd.dress_style) outfitPieces.push(wd.dress_style);
  if (layerVisible(wd,"lower") && wd.skirt_style) outfitPieces.push(wd.skirt_style);
  if (layerVisible(wd,"upper") && (!layerVisible(wd,"dress") || !wd.dress_style) && wd.top && wd.top !== "none") outfitPieces.push(exp("wardrobe", "top"));
  if (layerVisible(wd,"lower") && (!layerVisible(wd,"dress") || !wd.dress_style) && !wd.skirt_style && wd.bottom && wd.bottom !== "none") outfitPieces.push(exp("wardrobe", "bottom"));
  if (layerVisible(wd,"underwear") && wd.underwear && wd.underwear !== "none") outfitPieces.push(exp("wardrobe", "underwear"));
  if (layerVisible(wd,"shoes") && !wd.heel_type && wd.footwear && wd.footwear !== "barefoot") outfitPieces.push(exp("wardrobe", "footwear"));
  if (layerVisible(wd,"hosiery") && wd.hosiery_type) outfitPieces.push(`${wd.hosiery_color ? `${wd.hosiery_color} ` : ""}${wd.hosiery_denier ? `${wd.hosiery_denier} ` : ""}${wd.hosiery_pattern && wd.hosiery_pattern !== "plain" ? `${wd.hosiery_pattern} ` : ""}${wd.hosiery_type}`);
  if (layerVisible(wd,"shoes") && wd.heel_type) outfitPieces.push(`${wd.heel_color ? `${wd.heel_color} ` : ""}${wd.heel_finish ? `${wd.heel_finish} ` : ""}${wd.heel_type}${wd.heel_height ? `, ${wd.heel_height} heel` : ""}`);
  if (layerVisible(wd,"accessories") && wd.glasses_style) outfitPieces.push(`${wd.glasses_color ? `${wd.glasses_color} ` : ""}${wd.glasses_style}`);
  if (layerVisible(wd,"accessories") && wd.accessories) {
    const accs = Array.isArray(wd.accessories) ? wd.accessories : [wd.accessories];
    accs.filter((a) => a && a !== "none").forEach((a) => outfitPieces.push(exp("wardrobe", "accessories") ? expandPrompt("wardrobe", "accessories", a) : a));
  }
  }
  if (!nudity.suppressClothing && wd.layering_piece) outfitPieces.push(exp("wardrobe", "layering_piece"));
  const outfitCore = outfitPieces.length ? `wearing ${outfitPieces.join(", ")}` : "";
  const outfitTail = join([
    !nudity.suppressClothing && exp("wardrobe", "material"),
    !nudity.suppressClothing && wd.garment_color && `${wd.garment_color} outfit color`,
    !nudity.suppressClothing && wd.garment_pattern && wd.garment_pattern !== "solid" && `${wd.garment_pattern} fabric pattern`,
    !nudity.suppressClothing && wd.palette && `${wd.palette} color palette`,
    !nudity.suppressClothing && wd.fit && `${wd.fit} fit`,
    !nudity.suppressClothing && wd.lingerie_cut && exp("wardrobe", "lingerie_cut"),
    !nudity.suppressClothing && wd.trim_detail && exp("wardrobe", "trim_detail"),
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
    subjectOrientationDirective(pose.angle),
    SPHERICAL_SUBJECT_VIEWS[pose.angle] || exp("pose", "angle"),
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
    intimateAppearancePrompt(im),
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
    (Array.isArray(ft.foot_state) && ft.foot_state.length) || ft.hosiery || ft.skin_finish ||
    (Array.isArray(ft.foot_act) && ft.foot_act.length) || ft.framing || ft.foot_pose ||
    ft.toe_length || ft.sole_texture || ft.pedicure_art || ft.toenail_shape ||
    (Array.isArray(ft.foot_accessories) && ft.foot_accessories.length) || ft.ground_surface);
  const feetStr = join([
    exp("feet", "sole_presentation"),
    expArr("feet", "toes"),
    ft.arch && exp("feet", "arch"),
    ft.pedicure && exp("feet", "pedicure"),
    ft.skin_finish && exp("feet", "skin_finish"),
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

  const kinkStr = "";

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
    selfStreamContinuityCue({...ws,source:catalogSelection(dna,"watersports","source"),phase:catalogSelection(dna,"watersports","phase")}),
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
