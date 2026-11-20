// Creator-reported SNOFS MOSS v1 SFT concepts. These are prompt references, not verified trigger tokens.
// SNOFS is a full fine-tune; this catalog does not load a LoRA.
export const SNOFS_MOSS_CONCEPTS = [
  {group:'Photography and style', concepts:['boudoir','ipcam / nightvision ipcam','snapchat (caption/text)','selfie','mirror selfie']},
  {group:'Clothing and presentation', concepts:['braless','sheer','undressing','wet clothes','naked / nude','hand in panties']},
  {group:'Anatomy and circumstances', concepts:['anus','penis','vagina','pregnant (specify trimester)','condoms']},
  {group:'Adult intimacy and actions', concepts:['anal sex','anilingus','blowjob','deepthroat','cowgirl position','cum','cunnilingus','dildo','doggystyle position','fingering (anal and vaginal)','handjob','hitachi magic wand','implied blowjob','masturbating','massage','missionary position','prone position','reverse cowgirl position','sex / vaginal sex','spooning position','strap-on dildo','tentacles','licking testicles']}
];
export const SNOFS_MOSS_PROMPT_GUIDANCE = 'Use ordinary descriptive sentences rather than short keyword tags. The creator specifically recommends natural language and precise descriptions. For cunnilingus, the creator suggests being specific and optionally adding kissing to the negative prompt if the output confuses the actions.';
