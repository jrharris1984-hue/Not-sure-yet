// Original pose directions informed by Canon's portrait posing guidance:
// https://www.usa.canon.com/learning/training-articles/training-articles-list/posing-tips-for-successful-portraits
export const PHOTOGRAPHY_POSE_PROMPTS = {
  'standing quarter turn': 'standing with the torso turned forty-five degrees, shoulders relaxed and arms slightly away from the body',
  'standing weight on back leg': 'standing with weight settled onto the back leg, front knee relaxed, level head and relaxed shoulders',
  'standing thumbs in pockets': 'standing with thumbs resting loosely in pockets, fingers relaxed and elbows comfortably bent',
  'standing arms loosely crossed': 'standing with arms loosely crossed, relaxed shoulders and a slight torso turn',
  'standing one hand on waist': 'standing with one hand resting lightly at the waist, other arm relaxed and one knee softly bent',
  'standing ankles crossed': 'standing with ankles lightly crossed, balanced posture and relaxed arms',
  'seated sideways on chair': 'seated sideways on a chair, torso gently turned toward the camera and hands resting naturally',
  'seated hands folded in lap': 'seated upright with relaxed shoulders and hands loosely folded in the lap',
  'seated leaning on chair arm': 'seated with one forearm resting on the chair arm, relaxed fingers and a slight head turn',
  'seated on steps': 'seated comfortably on steps with knees bent and hands resting naturally beside the legs',
  'leaning shoulder against wall': 'standing with one shoulder lightly resting against a wall, relaxed posture and arms at ease',
  'leaning forearms on railing': 'standing with forearms resting lightly on a railing, relaxed fingers and torso turned slightly toward the camera',
  'leaning back against wall': 'standing with back resting lightly against a wall, knees relaxed and shoulders level',
  'walking mid stride': 'walking naturally in mid-stride with alternating arm swing and a relaxed expression',
  'turning toward camera': 'captured during a gentle turn toward the camera, shoulders moving naturally and arms relaxed',
  'adjusting jacket lapel': 'standing while lightly adjusting a jacket lapel, elbows bent naturally and shoulders relaxed',
};

export const PHOTOGRAPHY_POSE_GROUPS = [
  {name:'Portrait standing', options:Object.keys(PHOTOGRAPHY_POSE_PROMPTS).slice(0,6)},
  {name:'Portrait seated', options:Object.keys(PHOTOGRAPHY_POSE_PROMPTS).slice(6,10)},
  {name:'Relaxed leaning', options:Object.keys(PHOTOGRAPHY_POSE_PROMPTS).slice(10,13)},
  {name:'Natural movement', options:Object.keys(PHOTOGRAPHY_POSE_PROMPTS).slice(13)},
];

export function photographyPosePrompt(value) {
  return PHOTOGRAPHY_POSE_PROMPTS[value] || value;
}
