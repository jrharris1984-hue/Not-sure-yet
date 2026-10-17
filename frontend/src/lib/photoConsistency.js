// Structured photo rules only: never rewrite locked choices or free-form notes.
export const NATURAL_POOLS = {
  'identity.archetype': ['athlete', 'artist', 'scholar', 'girl next door'],
  'physique.height': ['petite', 'short', 'average', 'tall'],
  'physique.body_type': ['slim', 'athletic', 'curvy', 'plus size', 'pear', 'apple'],
  'physique.bust': ['small', 'medium', 'large'], 'physique.bust_shape': ['natural', 'teardrop', 'athletic'],
  'physique.butt': ['small', 'toned', 'round', 'large'],
  'physique.glute_shape': ['natural rounded', 'athletic lifted', 'soft pear-shaped'],
  'physique.waist': ['average', 'slim', 'thick'], 'physique.hips': ['narrow', 'average', 'wide'],
  'physique.thighs': ['slim', 'toned', 'athletic', 'thick'],
  'face.eye_shape': ['almond','round','hooded','monolid','upturned','downturned'],
  'face.eye_color': ['deep brown','hazel','green','blue','grey','amber'],
  'face.jawline': ['soft','defined','angular','square','heart-shaped'],
  'face.nose': ['button','straight','roman','aquiline','upturned'],
  'face.lips': ['thin','medium','full','bow-shaped'], 'face.expression': ['neutral','smile','serious','laughing'],
  'skin.texture': ['natural pores','visible skin texture'], 'skin.freckles': ['none','light','scattered'],
  'hair.style': ['straight', 'wavy', 'ponytail', 'pixie cut', 'blunt bob', 'curly', 'coily', 'afro'],
  'hair.length': ['pixie', 'short bob', 'shoulder', 'long'],
  'hair.color': ['jet black', 'espresso brown', 'chestnut', 'golden blonde'],
  'pose.action': ['standing', 'standing hip out', 'standing hands on hips', 'sitting on edge'],
  'pose.angle': ['front', '3/4', 'profile'], 'pose.distance': ['full body', 'thigh-up', 'waist-up'],
  'pose.focus': ['full frame', 'face', 'body'], 'pose.hands': ['at sides', 'on hips'],
  'pose.body_language': ['relaxed', 'confident', 'playful'],
  'scene.environment': ['studio', 'living room', 'urban street', 'beach', 'forest'],
  'scene.era': ['contemporary'],
  'lighting.source': ['natural', 'window', 'softbox'], 'lighting.color_temp': ['neutral', 'warm'],
  'lighting.direction': ['front', 'side'], 'lighting.style': ['high-key', 'cinematic'], 'lighting.mood': ['soft'],
  'camera.lens': ['35mm', '50mm', '85mm'], 'camera.aperture': ['f/2.8', 'f/4', 'f/8'],
  'camera.angle': ['eye-level'], 'camera.aspect_ratio': ['4:5', '3:2', '1:1'],
  'style.render': ['photorealistic'], 'style.anatomy_mode': ['natural'],
  'style.film_grain': ['none', 'subtle'], 'style.artistic_tone': ['natural'],
};
export const NATURAL_RANGES = { 'identity.age': [21, 75], 'physique.muscularity': [0, 50],
  'physique.implant_volume': [0, 0], 'physique.bust_scale': [0, 0], 'physique.butt_scale': [0, 0],
  'physique.thigh_scale': [0, 0], 'physique.hip_scale': [0, 0], 'physique.waist_scale': [0, 0] };
const outdoors = new Set(['beach','forest','urban street','rooftop','desert','neon alley']);
const indoors = new Set(['studio','bedroom','living room','bathroom','warehouse']);
const clone = value => value === undefined ? undefined : JSON.parse(JSON.stringify(value));

export function photoIssues(dna = {}) {
  const issues = [];
  const { scene = {}, lighting = {}, pose = {}, hair = {}, camera = {} } = dna;
  if ((outdoors.has(scene.environment) && scene.indoor_outdoor === 'indoor') ||
      (indoors.has(scene.environment) && scene.indoor_outdoor === 'outdoor')) issues.push('Location and indoor/outdoor setting conflict.');
  if (outdoors.has(scene.environment) && lighting.source === 'window') issues.push('Window lighting needs an indoor setting.');
  if (pose.action === 'standing hands on hips' && pose.hands && pose.hands !== 'on hips') issues.push('Pose and hand position conflict.');
  if (/bun|chignon|ponytail|updo|braid|locs|twists/i.test(hair.style || '') && ['pixie','short bob'].includes(hair.length)) issues.push('Hair length is too short for the selected hairstyle.');
  if (/pixie|buzz/i.test(hair.style || '') && hair.length && hair.length !== 'pixie') issues.push('Short haircut and hair length conflict.');
  if (/bob/i.test(hair.style || '') && hair.length && hair.length !== 'short bob') issues.push('Bob haircut and hair length conflict.');
  if (pose.distance === 'full body' && camera.lens === 'macro') issues.push('Macro lens conflicts with full-body framing.');
  if (['feet','legs'].includes(pose.focus) && ['portrait','close-up','waist-up'].includes(pose.distance)) issues.push('Framing crops out the selected feet or legs focus.');
  return issues;
}

export function enforcePhotoConsistency(dna, locks = {}, fieldLocks = {}, sections = Object.keys(dna)) {
  const out = clone(dna);
  const can = (section, field) => sections.includes(section) && !locks[section] && !fieldLocks[section]?.[field];
  const set = (section, field, value) => { if (can(section, field)) out[section] = { ...out[section], [field]:value }; };
  let scene = out.scene || {};
  const pose = out.pose || {}, hair = out.hair || {};
  if (scene.indoor_outdoor === 'indoor' && outdoors.has(scene.environment) && !can('scene','indoor_outdoor')) set('scene','environment','living room');
  if (scene.indoor_outdoor === 'outdoor' && indoors.has(scene.environment) && !can('scene','indoor_outdoor')) set('scene','environment','urban street');
  scene = out.scene || {};
  if (outdoors.has(scene.environment) && out.lighting?.source === 'window' && !can('lighting','source')) {
    if (can('scene','environment') && (can('scene','indoor_outdoor') || scene.indoor_outdoor !== 'outdoor')) {
      set('scene','environment','living room'); set('scene','indoor_outdoor','indoor'); scene = out.scene;
    }
  }
  if (outdoors.has(scene.environment)) {
    set('scene','indoor_outdoor','outdoor');
    if (out.lighting?.source === 'window') set('lighting','source','natural');
  } else if (indoors.has(scene.environment)) set('scene','indoor_outdoor','indoor');
  if (pose.action === 'standing hands on hips' && pose.hands !== 'on hips') {
    if (can('pose','hands')) set('pose','hands','on hips');
    else set('pose','action','standing');
  }
  if (/bun|chignon|ponytail|updo|braid|locs|twists/i.test(hair.style || '') && ['pixie','short bob'].includes(hair.length)) {
    if (can('hair','length')) set('hair','length','long');
    else set('hair','style',hair.length === 'pixie' ? 'pixie cut' : 'blunt bob');
  }
  if (/pixie|buzz|bob/i.test(out.hair?.style || '')) {
    const length = /bob/i.test(out.hair.style) ? 'short bob' : 'pixie';
    if (can('hair','length')) set('hair','length',length);
    else if (out.hair.length !== length) set('hair','style','straight');
  }
  if (pose.distance === 'full body' && out.camera?.lens === 'macro') set('camera','lens','50mm');
  if (['feet','legs'].includes(pose.focus) && ['portrait','close-up','waist-up'].includes(pose.distance)) {
    if (can('pose','distance')) set('pose','distance','full body');
    else set('pose','focus','face');
  }
  return out;
}

export function preserveSubjectLocks(before, after, locks = {}) {
  return after.map(subject => {
    const original = before.find(item => item.id === subject.id);
    if (!original) return subject;
    const dna = clone(subject.dna);
    for (const section of Object.keys(original.dna)) {
      if (locks[section]) { dna[section] = clone(original.dna[section]); continue; }
      for (const [field, locked] of Object.entries(original.field_locks?.[section] || {})) {
        if (!locked) continue;
        dna[section] = {...dna[section]};
        if (Object.prototype.hasOwnProperty.call(original.dna[section], field)) dna[section][field] = clone(original.dna[section][field]);
        else delete dna[section][field];
      }
    }
    return {...subject,dna};
  });
}

export function coherePhotoCast(subjects, locks = {}) {
  if (!subjects.length) return subjects;
  const sections = ['scene','lighting','camera','style'];
  return subjects.map((subject, index) => {
    let dna = clone(subject.dna);
    if (index) for (const section of sections) if (!locks[section]) {
      dna[section] = {...dna[section]};
      for (const [field,value] of Object.entries(subjects[0].dna[section] || {}))
        if (!['background','props','extra'].includes(field) && !subject.field_locks?.[section]?.[field]) dna[section][field] = clone(value);
    }
    dna = enforcePhotoConsistency(dna, locks, subject.field_locks, sections);
    return {...subject,dna};
  });
}
export function photoCastIssues(subjects) {
  return [...new Set(subjects.flatMap((subject,index) => [
    ...photoIssues(subject.dna).map(issue => `${subject.label}: ${issue}`),
    ...(index ? ['scene','lighting','camera','style'].filter(section =>
      Object.keys(subjects[0].dna[section] || {}).filter(field => !['background','props','extra'].includes(field)).some(field => JSON.stringify(subject.dna[section]?.[field]) !== JSON.stringify(subjects[0].dna[section]?.[field])))
      .map(section => `${subject.label}: ${section} differs from the shared photo setup; check locked choices.`) : [])
  ]))];
}
