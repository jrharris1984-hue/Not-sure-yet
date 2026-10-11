import { sharedPoseGroups } from './promptCatalog';

const clean = value => String(value || '').replace(/\s+/g, ' ').trim();
const cameraFields = ['distance', 'angle', 'focus'];
export function sharedCastPose(subjects, catalog) {
  if (subjects.length < 2) return '';
  const primary = subjects[0].dna || {};
  if (Object.prototype.hasOwnProperty.call(primary.pose || {}, '_sharedPose')) {
    const selected = clean(primary.pose._sharedPose);
    const action = clean(primary.pose?.action);
    return selected && action && subjects.every(subject => clean(subject.dna?.pose?.action) === action) ? action : '';
  }
  const action = clean(primary.pose?.action);
  return sharedPoseGroups(subjects.length, catalog).some(group => group.poses.some(pose => [pose.value, pose.prompt].includes(action))) ? action : '';
}

export function selectSharedCastPose(subjects, prompt) {
  if (subjects.length < 2 || !clean(prompt)) return subjects;
  return subjects.map(subject => ({...subject, dna:{...subject.dna,
    pose:{...subject.dna?.pose, _sharedPose:clean(prompt), action:clean(prompt), distance:'wide shot'}}}));
}

export function editCastPose(subjects, activeId, pose, catalog) {
  const current = subjects.find(subject => subject.id === activeId);
  if (!current) return subjects;
  const replacesShared = (!!sharedCastPose(subjects, catalog) || !!current.dna?.pose?._sharedPose) && pose.action !== current.dna?.pose?.action;
  const changedCamera = cameraFields.filter(field => pose[field] !== current.dna?.pose?.[field]);
  return subjects.map(subject => {
    const nextPose = {...subject.dna?.pose};
    if (replacesShared) { nextPose.action = ''; nextPose._sharedPose = ''; }
    if (subject.id === activeId) Object.assign(nextPose, pose);
    if (replacesShared) nextPose._sharedPose = '';
    // Framing belongs to the photograph, including when Subject B is active.
    for (const field of changedCamera) nextPose[field] = pose[field];
    return {...subject, dna:{...subject.dna, pose:nextPose}};
  });
}

export function resolveCastPoses(subjects = [], catalog) {
  if (subjects.length < 2) {
    const notes = [];
    const single = subjects.map(subject => {
      const pose = {...subject.dna?.pose};
      if (pose._sharedPose && pose.action === pose._sharedPose) {
        pose.action = '';
        notes.push({section:'pose',field:'action',text:'A shared cast pose is inactive when only one person remains.'});
      }
      delete pose._sharedPose;
      return {...subject,dna:{...subject.dna,pose}};
    });
    return {subjects:single,sharedPose:'',notes};
  }
  const sharedPose = sharedCastPose(subjects, catalog);
  const primary = subjects[0].dna || {};
  const primaryPose = primary.pose || {};
  const groups = sharedPoseGroups(subjects.length, catalog);
  const known = groups.flatMap(group => group.poses.map(pose => ({...pose,group:group.label}))).find(pose => [pose.value,pose.prompt].includes(sharedPose));
  const fullFigure = sharedPose && (/Movement|Seated|mixed levels/i.test(known?.group || '') || /\b(walking|dancing|seated|sitting|kneeling|standing|running)\b/i.test(known?.value || sharedPose));
  const crop = primaryPose.distance;
  const footCrop = primaryPose.focus === 'feet' || primary.feet?.composition_mode === 'feet focus';
  const widen = sharedPose && (footCrop || fullFigure && ['portrait','close-up','waist-up','thigh-up','knees-up','detail shot'].includes(crop));
  const notes = [];
  if (sharedPose) notes.push({section:'pose',field:'action',text:'The shared cast pose controls body and hand placement; individual pose instructions are inactive.'});
  if (widen) notes.push({section:'pose',field:'distance',text:'The shared pose needs full figures, so a wide shot replaces the tight crop for this render.'});
  const resolved = subjects.map(subject => {
    const dna = subject.dna || {};
    const pose = {...dna.pose};
    delete pose._sharedPose;
    for (const field of cameraFields) pose[field] = field === 'distance' && widen ? 'wide shot' : primaryPose[field] || '';
    if (sharedPose) { pose.action=''; pose.hands=[]; pose.body_language=''; pose.focus='full frame'; }
    const feet = {...dna.feet};
    if (sharedPose) { feet.foot_pose=''; feet.foot_act=[]; feet.composition_mode='supporting detail'; feet.framing=''; feet.sole_presentation=''; }
    const subjectNotes = notes.map(note => ({...note, overridesSelection:note.field === 'action' || note.field === 'distance' && dna.pose?.distance !== pose.distance}));
    for (const field of cameraFields) if (dna.pose?.[field] && dna.pose[field] !== pose[field] && !subjectNotes.some(note => note.field === field)) {
      subjectNotes.push({section:'pose',field,overridesSelection:true,text:'Camera framing is shared; the primary subject controls the photograph.'});
    }
    return {...subject,dna:{...dna,pose,feet,camera:{...primary.camera}},castPoseNotes:subjectNotes};
  });
  return {subjects:resolved,sharedPose,notes};
}
