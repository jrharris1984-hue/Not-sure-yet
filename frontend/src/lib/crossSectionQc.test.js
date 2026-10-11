import {catalogDna} from './promptCatalog';
import {resolveBuilderControls} from './builderControlResolution';
import {compileModelPrompts} from './modelPromptCompilers';
import {SECTIONS} from './dna';

const library = (entries) => ({sections:Object.entries(entries).map(([key,fields])=>({key,title:key,fields:Object.entries(fields).map(([field,options])=>({key:field,label:field,type:'chips',options:Object.entries(options).map(([value,keywords])=>({value,label:value,keywords,group:''}))}))}))});
const sample = () => ({identity:{age:35,gender:'female'},physique:{},hair:{},skin:{},wardrobe:{},pose:{distance:'full body'},feet:{},scene:{},camera:{}});

test('edited hair wording preserves haircut compatibility without erasing the saved choice', () => {
  const dna=sample();dna.hair={style:'pixie cut',length:'waist-length'};
  const config=library({hair:{style:{'pixie cut':'SHORT_STYLE_MARKER'},length:{'waist-length':'LONG_LENGTH_MARKER'}}});
  const result=resolveBuilderControls(catalogDna(dna,config,true));
  expect(result.dna.hair.length).toBe('');
  expect(result.dna.hair.style).toBe('SHORT_STYLE_MARKER');
  expect(dna.hair.length).toBe('waist-length');
});
test('edited crop still excludes supporting foot details', () => {
  const dna=sample();dna.pose.distance='portrait';dna.feet={pedicure:'painted red',composition_mode:'supporting detail'};
  const config=library({pose:{distance:{portrait:'PORTRAIT_MARKER'}}});
  expect(resolveBuilderControls(catalogDna(dna,config,true)).dna.feet.pedicure).toBe('');
});
test.each(['krea2','krea2_test','chroma','zimage'])('%s edited portrait wording keeps portrait composition instead of a full-body instruction', promptStyle => {
  const dna=sample();dna.pose.distance='portrait';
  const config=library({pose:{distance:{portrait:'PORTRAIT_MARKER'}}});
  const result=compileModelPrompts({dna,promptStyle,promptCatalog:config});
  expect(result.positive).toMatch(/portrait|head.and.shoulders/i);
  expect(result.positive).not.toMatch(/full character visible head to feet|Full-length photograph: show the entire subject/);
});
test('edited scene and location wording still resolve an indoor/outdoor conflict', () => {
  const dna=sample();dna.scene={environment:'studio',indoor_outdoor:'outdoor'};dna.feet.ground_surface='grass';
  const config=library({scene:{environment:{studio:'STUDIO_MARKER'},indoor_outdoor:{outdoor:'OUTDOOR_MARKER'}}});
  const result=resolveBuilderControls(catalogDna(dna,config,true)).dna;
  expect(result.scene.indoor_outdoor).toBe('');
  expect(result.feet.ground_surface).toBe('');
});
test('edited framing and camera angle do not describe competing camera heights', () => {
  const dna=sample();dna.pose.angle='from above';dna.camera.angle='low';
  const config=library({pose:{angle:{'from above':'ABOVE_MARKER'}},camera:{angle:{low:'LOW_MARKER'}}});
  expect(resolveBuilderControls(catalogDna(dna,config,true)).dna.camera.angle).toBe('');
});
test('buzz cuts suppress bangs while an undercut keeps its long hair', () => {
  const dna=sample();dna.hair={style:'buzz cut',bangs:'curtain'};
  expect(resolveBuilderControls(dna).dna.hair.bangs).toBe('');
  dna.hair={style:'undercut with shaved sides',length:'long',bangs:'side-swept'};
  expect(resolveBuilderControls(dna).dna.hair.length).toBe('long');
});
test.each(['pixie','short bob','shoulder','long','waist-length'])('buzz-cut length QC handles %s', length => {
  const dna=sample();dna.hair={style:'buzz cut',length};
  expect(resolveBuilderControls(dna).dna.hair.length).toBe('');
});
test.each(['short bob','shoulder','long','waist-length'])('pixie-cut length QC handles %s', length => {
  const dna=sample();dna.hair={style:'pixie cut',length};
  expect(resolveBuilderControls(dna).dna.hair.length).toBe('');
});
test('expanded generic hem edits adapt to trousers', () => {
  const dna=sample();dna.wardrobe={outfit_mode:'custom',bottom:'jeans',state:'riding up'};
  const config=library({wardrobe:{state:{'riding up':'fabric riding up with a raised hem'}}});
  expect(resolveBuilderControls(catalogDna(dna,config,true)).dna.wardrobe.state).toMatch(/trouser hems/);
});
test('edited open footwear and footless hosiery preserve visible foot details', () => {
  const dna=sample();dna.wardrobe={footwear:'strappy sandals',hosiery_type:'footless tights'};dna.feet={pedicure:'painted red',sole_texture:'smooth soles'};
  const config=library({wardrobe:{footwear:{'strappy sandals':'SANDAL_MARKER'},hosiery_type:{'footless tights':'FOOTLESS_MARKER'}}});
  const result=resolveBuilderControls(catalogDna(dna,config,true)).dna;
  expect(result.feet.pedicure).toBe('painted red');
  expect(result.feet.sole_texture).toBe('');
  expect(result.wardrobe.footwear).toBe('SANDAL_MARKER');
});
test('explicit freckles and glow controls own those appearance details', () => {
  const dna=sample();dna.skin={texture:'freckled',freckles:'none'};
  const config=library({skin:{texture:{freckled:'FRECKLED_MARKER'}}});
  expect(resolveBuilderControls(catalogDna(dna,config,true)).dna.skin.texture).toBe('');
  dna.skin={texture:'matte',glow:70};
  const finish=library({skin:{texture:{matte:'MATTE_MARKER'}}});
  expect(resolveBuilderControls(catalogDna(dna,finish,true)).dna.skin.texture).toBe('');
});
test('edited smoothing wording does not override the selected older adult age', () => {
  const dna=sample();dna.identity.age=70;dna.skin.texture='smooth';
  const config=library({skin:{texture:{smooth:'FINISH_MARKER'}}});
  expect(resolveBuilderControls(catalogDna(dna,config,true)).dna.skin.texture).toBe('mature skin texture');
});
test('resolved render controls remain stable across repeated QC passes', () => {
  const dna=sample();dna.pose={distance:'portrait',focus:'feet'};dna.hair={style:'pixie cut',length:'waist-length'};
  const config=library({hair:{style:{'pixie cut':'SHORT_STYLE_MARKER'},length:{'waist-length':'LONG_LENGTH_MARKER'}},pose:{distance:{portrait:'PORTRAIT_MARKER'},focus:{feet:'FEET_MARKER'}}});
  const resolved=resolveBuilderControls(catalogDna(dna,config,true)).dna;
  expect(resolveBuilderControls(resolved).dna).toEqual(resolved);
});

test.each(['standard','chroma','krea2','sdxl','pony','qwen_image','wan_t2v','zimage','krea2_test','chroma_test'])('%s final prompt keeps the winning selection and excludes edited conflicts', promptStyle => {
  const dna=sample();dna.hair={style:'pixie cut',length:'waist-length'};dna.scene={environment:'studio',indoor_outdoor:'outdoor'};
  const config=library({hair:{style:{'pixie cut':'SHORT_STYLE_MARKER'},length:{'waist-length':'LONG_LENGTH_MARKER'}},scene:{environment:{studio:'STUDIO_MARKER'},indoor_outdoor:{outdoor:'OUTDOOR_MARKER'}}});
  const before=JSON.stringify(dna);
  const result=compileModelPrompts({dna,promptStyle,promptCatalog:config});
  expect(result.positive).not.toMatch(/LONG_LENGTH_MARKER|OUTDOOR_MARKER/);
  expect(result.positive).toContain('SHORT_STYLE_MARKER');
  expect(result.positive).toContain('STUDIO_MARKER');
  expect(JSON.stringify(dna)).toBe(before);
});

const reviewedSections=new Set(['identity','physique','face','hair','skin','wardrobe','pose','scene','lighting','camera']);
const choices=SECTIONS.filter(section=>reviewedSections.has(section.key)).flatMap(section=>section.fields.flatMap(field=> {
  const values=field.type==='slider' ? [field.min,field.max] : field.groups ? field.groups.flatMap(group=>group.options) : field.options || [];
  return [...new Set(values)].map(value=>({section:section.key,field:field.key,value:field.type==='chips_multi'?[value]:value}));
}));
test.each(['standard','chroma','krea2','sdxl','pony','qwen_image','wan_t2v','zimage','krea2_test','chroma_test'])('%s compiles every built-in appearance, wardrobe, pose and scene choice without corrupting saved data', promptStyle => {
  for(const {section,field,value} of choices) {
    const dna=sample();dna[section] ||= {};dna[section][field]=value;
    const before=JSON.stringify(dna);
    const prompt=compileModelPrompts({dna,promptStyle,promptCatalog:{sections:[]}});
    expect(typeof prompt.positive).toBe('string');
    expect(prompt.positive.length).toBeGreaterThan(0);
    expect(/\b(?:undefined|NaN)\b/.test(prompt.positive)).toBe(false);
    expect(JSON.stringify(dna)).toBe(before);
  }
});
