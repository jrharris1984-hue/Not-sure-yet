import { DEFAULT_DNA, SECTIONS, randomizeDna, randomizeSection } from './dna';
import { photoIssues, enforcePhotoConsistency, preserveSubjectLocks } from './photoConsistency';
import { PHOTO_RANDOM_SCOPES, randomizePhotoSubjects } from './photoRandomizer';
const copy = value => JSON.parse(JSON.stringify(value));
const person = () => ({id:'a', label:'A', dna:copy(DEFAULT_DNA),field_locks:{}});

test('natural generations repeatedly satisfy structured photo rules and schema values', () => {
  for (let i=0;i<250;i++) {
    const dna = randomizeDna(DEFAULT_DNA,{}, {},{profile:'natural',avoidCurrent:true});
    expect(photoIssues(dna)).toEqual([]);
    expect(dna.style.anatomy_mode).toBe('natural');
    expect(dna.physique.implant_volume).toBe(0);
    expect(dna.physique.butt_scale).toBe(0);
    expect(dna.wardrobe).toEqual(DEFAULT_DNA.wardrobe);
    for (const section of SECTIONS) for (const field of section.fields) {
      if (!['chips','pose_chips'].includes(field.type) || !dna[section.key]?.[field.key]) continue;
      const allowed=field.groups ? field.groups.flatMap(g=>g.options) : field.options || [];
      expect(allowed).toContain(dna[section.key][field.key]);
    }
  }
});
test('locked contradictions are reported without overwriting either choice', () => {
  const dna={scene:{environment:'beach',indoor_outdoor:'indoor'},hair:{style:'ponytail',length:'pixie'},pose:{action:'standing hands on hips',hands:'at sides'}};
  const locks={scene:true,hair:true,pose:true};
  expect(enforcePhotoConsistency(dna,locks)).toEqual(dna);
  expect(photoIssues(dna)).toHaveLength(3);
});
test('compatible alternatives respect locked hand position and indoor setting', () => {
  const dna={scene:{environment:'beach',indoor_outdoor:'indoor'},pose:{action:'standing hands on hips',hands:'at sides'}};
  const fixed=enforcePhotoConsistency(dna,{}, {scene:{indoor_outdoor:true},pose:{hands:true}});
  expect(fixed.pose.hands).toBe('at sides'); expect(fixed.pose.action).toBe('standing');
  expect(fixed.scene.environment).toBe('living room'); expect(photoIssues(fixed)).toEqual([]);
});
test.each(PHOTO_RANDOM_SCOPES)('$id changes only its documented sections and keeps locks', scope => {
  const source=person();source.dna.identity.name='Keep me'; source.field_locks={pose:{hands:true},scene:{environment:true}};
  const before=copy(source);
  const {subjects}=randomizePhotoSubjects([source],scope.id);
  expect(source).toEqual(before);
  expect(subjects[0].id).toBe(source.id);
  expect(subjects[0].dna.identity).toEqual(source.dna.identity);
  for (const section of Object.keys(source.dna)) if (!scope.sections.includes(section)) expect(subjects[0].dna[section]).toEqual(source.dna[section]);
  expect(subjects[0].dna.pose.hands).toBe(source.dna.pose.hands);
  expect(subjects[0].dna.scene.environment).toBe(source.dna.scene.environment);
});
test('shared setting respects individual locks and array references are independent', () => {
  const a=person(), b={...person(),id:'b',label:'B',field_locks:{scene:{environment:true}}};
  b.dna.scene.environment='beach';
  const result=randomizePhotoSubjects([a,b],'scene');
  expect(result.subjects[1].dna.scene.environment).toBe('beach');
  expect(result.subjects[0].dna.scene).not.toBe(result.subjects[1].dna.scene);
});
test('cast reconciliation cannot override section or field locks', () => {
  const a=person();a.dna.identity.gender='male';a.field_locks={identity:{gender:true}};
  const changed=copy(a);changed.dna.identity.gender='female';changed.dna.hair.color='red';
  const result=preserveSubjectLocks([a],[changed],{hair:true});
  expect(result[0].dna.identity.gender).toBe('male');expect(result[0].dna.hair).toEqual(a.dna.hair);
});
test('section natural randomizer retains custom text and unknown catalogs safely', () => {
  const scene=randomizeSection('scene',{background:'my backdrop',props:'my chair'},{},{profile:'natural'});
  expect(scene.background).toBe('my backdrop'); expect(scene.props).toBe('my chair');
  expect(randomizeSection('unknown',{custom:'keep'})).toEqual({custom:'keep'});
});
test('natural pose sampling excludes extreme actions and returns the requested count', () => {
  const {samplePoses} = require('./posePacks');
  const poses=samplePoses({mode:'natural',count:12,allPoses:['standing splits','all fours']});
  expect(poses).toHaveLength(12);
  expect(poses.every(p=>['standing','standing hip out','standing hands on hips','sitting on edge'].includes(p))).toBe(true);
});
test('locked short hair length selects a schema-valid compatible haircut', () => {
  const result=enforcePhotoConsistency({hair:{style:'ponytail',length:'short bob'}},{},{hair:{length:true}});
  expect(result.hair.style).toBe('blunt bob');expect(photoIssues(result)).toEqual([]);
});
test('natural shared scenes preserve individual free-form notes', () => {
  const a=person(), b={...person(),id:'b',label:'B'};
  b.dna.scene.background='Keep this backdrop';b.dna.style.extra='Keep this instruction';
  const result=randomizePhotoSubjects([a,b],'scene');
  expect(result.subjects[1].dna.scene.background).toBe('Keep this backdrop');
  expect(result.subjects[1].dna.style.extra).toBe('Keep this instruction');
});
test('footwear photos keep shoes and do not invent a visible pedicure through closed footwear', () => {
  const a=person();a.dna.wardrobe.footwear='sneakers';
  const result=randomizePhotoSubjects([a],'footwear');
  expect(result.subjects[0].dna.wardrobe.footwear).toBe('sneakers');
  expect(result.subjects[0].dna.feet.pedicure).toBe('');
  expect(result.subjects[0].dna.feet.framing).toBe('knees-down');
  expect(result.subjects[0].dna.feet.foot_pose).toBe('feet side by side');
});
