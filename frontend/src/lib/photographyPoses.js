// User-supplied pose wording. Keep these phrases verbatim.
export const POSE_ACTION_PROMPTS = {
  "standing quarter turn": "standing quarter turn pose, body angled 45 degrees, three-quarter view, dynamic stance, engaging angle",
  "standing weight on back leg": "standing with weight on back leg, relaxed contrapposto, hip shifted, casual elegant stance",
  "standing thumbs in pockets": "standing with thumbs hooked in pockets, casual confident pose, relaxed shoulders, approachable stance",
  "standing arms loosely crossed": "standing with arms loosely crossed, open body language, relaxed posture, comfortable stance",
  "standing one hand on waist": "standing with one hand on waist, confident pose, accentuated hip, powerful stance",
  "standing ankles crossed": "standing with ankles crossed, elegant posture, refined stance, model-like poise",
  "seated sideways on chair": "seated sideways on chair, legs draped over side, relaxed elegant pose, casual sophistication",
  "seated hands folded in lap": "seated with hands folded in lap, demure posture, elegant composure, refined grace",
  "seated leaning on chair arm": "seated leaning on chair arm, relaxed upper body, casual lounge pose, intimate atmosphere",
  "seated on steps": "seated on steps, casual ground-level pose, relaxed positioning, accessible warmth",
  "leaning shoulder against wall": "leaning shoulder against wall, casual support pose, relaxed stance, effortless cool",
  "leaning forearms on railing": "leaning forearms on railing, looking out, contemplative pose, relaxed upper body",
  "leaning back against wall": "leaning back against wall, full back support, casual spread, relaxed confidence",
  "walking mid stride": "walking mid-stride pose, captured movement, dynamic leg position, natural gait frozen",
  "turning toward camera": "turning toward camera, mid-pivot motion, dynamic twist, engaging eye contact",
  "adjusting jacket lapel": "adjusting jacket lapel, hand at chest, grooming gesture, sophisticated moment",
  "standing": "standing pose, neutral upright stance, basic position, centered composition",
  "standing hip out": "standing with hip pushed out, accentuated curve, playful stance, feminine silhouette",
  "standing hands on hips": "standing with hands on hips, power pose, confident stance, accentuated waist",
  "standing arms up": "standing with arms raised above head, elongated torso, stretched pose, open vulnerable stance",
  "standing back arched": "standing with back arched, accentuated curves, dramatic posture, sensual spine curve",
  "standing legs apart": "standing with legs apart, grounded stance, powerful base, confident spread",
  "standing splits": "standing splits pose, extreme flexibility, vertical leg extension, impressive height",
  "walking": "walking pose, dynamic movement, mid-stride capture, forward momentum",
  "leaning wall": "leaning against wall, casual support, relaxed posture, street-style pose",
  "leaning forward": "leaning forward at waist, engaged posture, toward camera, inviting proximity",
  "bending over": "bending over pose, forward fold, curved spine, lowered perspective",
  "sitting legs crossed": "sitting with legs crossed, elegant closed posture, refined seated pose, ladylike position",
  "sitting legs open": "sitting with legs apart, open relaxed posture, grounded stance, casual confidence",
  "sitting reverse chair": "sitting reverse on chair, straddling backwards, casual rebel pose, unique angle",
  "sitting on edge": "sitting on edge of surface, forward-leaning tension, ready-to-stand energy, perched pose",
  "kneeling upright": "kneeling upright pose, tall on knees, elevated position, subservient yet proud stance",
  "kneeling back arched": "kneeling with back arched, accentuated curves, dramatic spine curve, sensual submission",
  "kneeling hands floor": "kneeling with hands on floor, all-fours preparation, grounded pose, forward lean",
  "lying back": "lying on back pose, supine position, vulnerable openness, face-up perspective",
  "lying side": "lying on side pose, lateral recline, curved body line, relaxed侧卧",
  "lying stomach": "lying on stomach pose, prone position, relaxed flat, back-exposed perspective",
  "lying legs spread": "lying with legs spread, open relaxed posture, exposed vulnerability, inviting pose",
  "lying legs up": "lying with legs raised up, elevated lower body, playful pose, dynamic angle",
  "on back legs up": "on back with legs up in air, vertical leg extension, full exposure, dramatic presentation",
  "all fours": "on all fours pose, hands and knees, quadruped stance, grounded position",
  "doggy arched": "doggy style with arched back, dramatic curve, presented posture, accentuated silhouette",
  "doggy low": "doggy style low to ground, submissive depth, flattened posture, grounded submission",
  "squatting": "squatting pose, low crouch, grounded strength, athletic stance",
  "squatting spread": "squatting with knees apart, open crouch, exposed posture, grounded spread",
  "squatting deep": "deep squat pose, full crouch, low center of gravity, intense grounded position",
  "over shoulder look": "looking back over shoulder, turned gaze, engaging eye contact, flirtatious glance",
  "arched on knees": "arched pose on knees, dramatic backbend, elevated chest, extreme curve",
  "hands on knees": "hands planted on knees, forward lean, grounded preparation, athletic stance",
  "hair flip": "hair flip motion, dynamic hair movement, frozen action, energetic moment",
  "dancing": "dancing pose, captured movement, rhythmic stance, expressive body language",
  "reverse view": "reverse view from behind, back-facing perspective, posterior focus, turned away stance"
};

export const PHOTOGRAPHY_POSE_PROMPTS = Object.fromEntries(Object.entries(POSE_ACTION_PROMPTS).slice(0,16));

export const PHOTOGRAPHY_POSE_GROUPS = [
  {name:'Portrait standing', options:Object.keys(PHOTOGRAPHY_POSE_PROMPTS).slice(0,6)},
  {name:'Portrait seated', options:Object.keys(PHOTOGRAPHY_POSE_PROMPTS).slice(6,10)},
  {name:'Relaxed leaning', options:Object.keys(PHOTOGRAPHY_POSE_PROMPTS).slice(10,13)},
  {name:'Natural movement', options:Object.keys(PHOTOGRAPHY_POSE_PROMPTS).slice(13)},
];

export function photographyPosePrompt(value) {
  return POSE_ACTION_PROMPTS[value] || value;
}
