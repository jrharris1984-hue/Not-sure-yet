// Built-in video choices. Saved user choices in settings.prompt_catalog override these by stable key.
export const VIDEO_LIBRARY = {
  motion:{title:'Body movement',choices:[['shift','Shift weight','shifts weight naturally from one leg to the other'],['walk','Walk forward','walks forward naturally'],['walkaway','Walk away','walks away from the camera'],['turn','Turn toward camera','slowly turns toward the camera'],['turnaround','Turn around','makes a smooth full-body turn'],['sit','Sit down','sits down naturally'],['stand','Stand up','rises smoothly to a standing position'],['lean','Lean','leans casually and adjusts posture'],['stretch','Stretch','stretches gently'],['dance','Dance','dances with coordinated natural movement'],['kneel','Kneel','lowers into a kneeling pose'],['pose','Change pose','transitions into another relaxed pose']]},
  expression:{title:'Facial movement',choices:[['relaxed','Relaxed','maintains a relaxed expression'],['smile','Smile','gradually smiles'],['blink','Blink','blinks naturally'],['laugh','Laugh','laughs softly'],['glance','Look aside','briefly glances to the side'],['lookback','Look back','looks back toward the camera'],['headtilt','Head tilt','tilts the head slightly'],['serious','Serious expression','adopts a thoughtful serious expression']]},
  gestures:{title:'Hands and gestures',choices:[['none','None',''],['wave','Wave','waves gently with one hand'],['hair','Touch hair','gently brushes hair away from the face'],['reach','Reach forward','reaches forward naturally'],['point','Point','points toward an object'],['hold','Hold object','holds the object steadily'],['hands','Hands on hips','places hands on hips'],['arms','Cross arms','crosses arms naturally']]},
  camera:{title:'Camera movement',choices:[['still','Stationary','The camera remains stationary'],['track','Tracking','The camera tracks the subject smoothly'],['orbit','Orbit','The camera slowly orbits the subject'],['dollyin','Dolly in','The camera slowly moves closer'],['dollyout','Dolly out','The camera slowly moves away'],['pan','Pan','The camera pans gently'],['tilt','Tilt','The camera tilts smoothly'],['zoom','Zoom','The camera slowly zooms in'],['handheld','Handheld','The camera has restrained handheld motion']]},
  framing:{title:'Camera framing',choices:[['full','Full body','Keep the full body visible'],['medium','Medium shot','Frame the subject from the waist up'],['close','Close-up','Frame a close-up of the face'],['wide','Wide shot','Keep the subject and environment in a wide shot'],['over','Over shoulder','Use an over-the-shoulder composition'],['profile','Profile','Maintain a side profile composition']]},
  interaction:{title:'Character interaction',choices:[['none','None',''],['talk','Conversation','The subjects converse with subtle natural gestures'],['walk','Walk together','The subjects walk together'],['hug','Embrace','The subjects embrace naturally'],['dance','Dance together','The subjects dance together'],['look','Exchange glances','The subjects exchange glances']]},
  physics:{title:'Hair and clothing physics',choices:[['none','None',''],['hair','Natural hair movement','Hair moves naturally with the subject'],['fabric','Flowing fabric','Loose fabric follows body motion'],['wind','Gentle wind','A gentle breeze moves hair and clothing'],['strongwind','Windy','Wind visibly moves loose clothing and hair']]},
  environment:{title:'Environmental movement',choices:[['none','None',''],['rain','Rain','Rain falls naturally in the scene'],['fog','Fog','Fog drifts slowly in the background'],['water','Water','Water ripples and flows naturally'],['sun','Shifting sunlight','Sunlight changes subtly'],['crowd','Background activity','Background figures move naturally'],['leaves','Moving leaves','Leaves move in a gentle breeze']]},
  style:{title:'Video style',choices:[['natural','Natural cinematic','Photorealistic cinematic motion'],['fashion','Fashion film','Editorial fashion-film movement'],['portrait','Portrait film','Intimate portrait-film pacing'],['vintage','Vintage film','Subtle vintage film aesthetic'],['slow','Slow motion','Graceful slow-motion pacing'],['documentary','Documentary','Natural documentary-style camera and motion']]},
  consistency:{title:'Consistency',choices:[['strict','Strict preservation','Preserve subject identity, appearance, clothing, proportions, and setting'],['subject','Subject preservation','Preserve the subject identity and appearance'],['scene','Scene preservation','Keep the setting and lighting consistent']]},
};
export const VIDEO_PRESETS = [
  {id:'standing',label:'Natural standing',choices:{motion:'shift',expression:'blink',gestures:'none',camera:'still',framing:'full',physics:'hair',environment:'none',style:'natural'}},
  {id:'fashion',label:'Fashion walk',choices:{motion:'walk',expression:'relaxed',gestures:'none',camera:'track',framing:'full',physics:'fabric',environment:'none',style:'fashion'}},
  {id:'portrait',label:'Portrait animation',choices:{motion:'lean',expression:'smile',gestures:'hair',camera:'dollyin',framing:'close',physics:'hair',environment:'none',style:'portrait'}},
  {id:'reveal',label:'Cinematic reveal',choices:{motion:'turn',expression:'lookback',gestures:'none',camera:'orbit',framing:'medium',physics:'wind',environment:'fog',style:'natural'}},
  {id:'pinup',label:'Retro pin-up pose',choices:{motion:'pose',expression:'smile',gestures:'hands',camera:'still',framing:'full',physics:'fabric',environment:'none',style:'vintage'}},
  {id:'slow',label:'Slow-motion fashion',choices:{motion:'walk',expression:'relaxed',gestures:'hair',camera:'track',framing:'full',physics:'wind',environment:'none',style:'slow'}},
  {id:'conversation',label:'Conversation',choices:{motion:'shift',expression:'smile',gestures:'hands',camera:'still',framing:'medium',physics:'none',environment:'none',style:'documentary',interaction:'talk'}},
];
export const videoDefaults = () => Object.fromEntries(Object.entries(VIDEO_LIBRARY).map(([key,section])=>[key,section.choices[0][0]]));
export const videoOptions = (catalog,key) => {
  const saved = catalog?.sections?.find(section=>section.key==='video_'+key)?.fields?.find(field=>field.key==='choices')?.options;
  const base = VIDEO_LIBRARY[key].choices.map(([value,label,keywords])=>({value,label,keywords}));
  if (!Array.isArray(saved)) return base;
  const merged = new Map(base.map(item=>[item.value,item]));
  saved.forEach(item=>{if(item?.value && item?.label)merged.set(item.value,{...merged.get(item.value),...item});});
  return [...merged.values()];
};
export const composeVideoPrompt = ({mode,scene='',selected={},catalog,steps=[],intensity='subtle',custom='',shared=''}) => {
  const sentences=[];
  if(mode==='text_video' && scene.trim())sentences.push(scene.trim());
  if(mode==='text_video' && shared.trim())sentences.push(shared.trim());
  sentences.push(mode==='video'?'Animate the provided image with continuous realistic motion':'Create a continuous cinematic video');
  const text = key => videoOptions(catalog,key).find(item=>item.value===selected[key])?.keywords?.trim() || '';
  const sequence=steps.map(value=>value.trim()).filter(Boolean);
  if(sequence.length)sentences.push('Action sequence: '+sequence.map((s,i)=>`${i+1}. ${s}`).join('; '));
  else if(text('motion'))sentences.push('The subject '+text('motion'));
  for(const key of ['expression','gestures','interaction','camera','framing','physics','environment','style','consistency'])if(text(key))sentences.push(text(key));
  sentences.push('Motion intensity: '+intensity+'. Smooth, physically plausible transitions');
  if(custom.trim())sentences.push(custom.trim());
  if(mode==='video')sentences.push('Keep the starting image subject and scene recognizable throughout');
  sentences.push('No abrupt cuts or unexplained changes');
  return sentences.map(value=>/[.!?]$/.test(value)?value:value+'.').join(' ');
};
