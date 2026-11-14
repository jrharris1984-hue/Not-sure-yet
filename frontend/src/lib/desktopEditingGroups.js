import { wardrobeGroups } from './wardrobeLayout';
import { SIZE_CONTROL_PAIRS } from './physiqueControlPriority';

const groups = {
  intimate: [
    ['areola', 'Areola details', ['areola_size','areola_shape','areola_color','areola_detail']],
    ['chest', 'Other chest details', ['nipple_size','nipple_shape']],
    ['presets', 'Combined presets', ['nipples','areolas']],
  ],
  physique: [
    ['frame', 'Frame & build', ['height','body_type','muscularity','shoulders','legs']],
    ['upper', 'Upper body', ['bust','bust_scale','bust_shape','implant_volume']],
    ['middle', 'Waist & hips', ['waist','waist_scale','hips','hip_scale']],
    ['lower', 'Lower body', ['butt','butt_scale','glute_shape','thighs','thigh_scale']],
    ['notes', 'Extra details', ['proportions']],
  ],
  face: [['eyes','Eyes',['eye_shape','eye_color']], ['features','Features',['jawline','nose','lips']], ['expression','Expression',['expression']]],
  hair: [['cut','Cut & style',['style','length','texture','bangs']], ['color','Color',['color']]],
  skin: [['base','Tone & texture',['tone','texture']], ['details','Markings & details',['freckles','tattoos','scars','body_oil']]],
};
export function desktopEditingGroups(section) {
  if (section.key === 'wardrobe') return wardrobeGroups(section.fields);
  if (section.key === 'feet') {
    const definitions=[
      ['appearance','Foot appearance',/foot|toe|arch|sole|heel|shape|size/i],
      ['pedicure','Pedicure & grooming',/pedicure|nail|polish|groom|skin|color/i],
      ['presentation','Pose & presentation',/pose|angle|focus|camera|framing|presentation|position/i],
      ['styling','Foot styling',/shoe|sock|stocking|hosiery|footwear|accessor/i],
    ];
    const remaining=[...section.fields];
    const result=definitions.map(([key,label,pattern])=>{
      const fields=remaining.filter(field=>pattern.test(`${field.key} ${field.label}`));
      fields.forEach(field=>remaining.splice(remaining.indexOf(field),1));
      return {key,label,fields};
    }).filter(group=>group.fields.length);
    if(remaining.length)result.push({key:'other',label:'Other foot details',fields:remaining});
    return result;
  }
  const definitions = groups[section.key];
  if (!definitions) return [];
  const known = new Set(definitions.flatMap(([, , fields]) => fields));
  return [...definitions, ['other','Other details',section.fields.filter(field => !known.has(field.key)).map(field => field.key)]]
    .map(([key,label,keys]) => ({ key,label,fields:section.fields.filter(field => keys.includes(field.key)) }))
    .filter(group => group.fields.length);
}
export function desktopFieldTarget(section, key) {
  if (section !== 'physique') return key;
  return Object.entries(SIZE_CONTROL_PAIRS).find(([preset,[slider]]) => [preset,slider,...(preset === 'bust' ? ['implant_volume','bust_shape'] : [])].includes(key))?.[0] || key;
}

export function desktopNavigationSections(stages, sections, activeKey) {
  const required = new Set(stages.flatMap(stage => stage.simpleSections || stage.sections));
  required.add(activeKey); // Optional details stay reachable when explicitly opened.
  const ordered = [...new Set([...stages.flatMap(stage => stage.sections), activeKey])];
  return ordered.filter(key => required.has(key)).map(key => sections.find(section => section.key === key)).filter(Boolean);
}
