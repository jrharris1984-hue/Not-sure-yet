import { DEFAULT_DNA } from './dna';
import { catalogDna } from './promptCatalog';
import { compileModelPrompts } from './modelPromptCompilers';
import { resolvePhysiqueControls } from './physiqueControls';

const library = (field, keywords) => ({sections:[{key:'physique',fields:[
  {key:field,type:'chips',options:[{value:'custom_choice',label:'Original preset label',keywords}]},
]}]});
const sample = () => {const dna=JSON.parse(JSON.stringify(DEFAULT_DNA));dna.identity={...dna.identity,gender:'male',age:35};dna.pose.action='standing';return dna;};

test('a general build preset cannot override separately selected regional sizes', () => {
  const dna={physique:{body_type:'custom_choice',bust:'small',butt:'flat'}};
  const result=catalogDna(dna,library('body_type','balanced build, generous bust, full glutes'));
  expect(result.physique.body_type).toBe('balanced build');
  expect(dna.physique.body_type).toBe('custom_choice');
});

test('filtering all preset wording keeps it inactive instead of restoring its label', () => {
  const result=catalogDna({physique:{body_type:'custom_choice',muscularity:10}},library('body_type','female bodybuilder, massive muscles, ripped physique'));
  expect(result.physique.body_type).toBe('');
});

test('an unset muscularity slider does not erase a build preset', () => {
  expect(catalogDna({physique:{body_type:'custom_choice'}},library('body_type','muscular build')).physique.body_type).toBe('muscular build');
});

test('natural contour takes priority over augmentation bundled into a size preset', () => {
  const dna={physique:{bust:'augmented volume, surgical implants',bust_shape:'natural'}};
  const resolved=resolvePhysiqueControls(dna);
  expect(resolved.dna.physique.bust).toBe('');
  expect(resolved.dna.physique.bust_shape).toBe('natural');
  expect(resolved.adjustments).toHaveLength(1);
  expect(dna.physique.bust).toContain('implants');
});

test.each(['chroma','krea2','sdxl','pony','zimage','qwen_image'])('%s keeps identity gender and skin choices authoritative', promptStyle => {
  const dna=sample();dna.physique.body_type='custom_choice';dna.skin.freckles='none';
  const config=library('body_type','skinny adult woman, thin frame, visible ribs');
  config.sections[0].fields.push({key:'shoulders',type:'chips',options:[{value:'custom_freckles',label:'Freckled shoulders',keywords:'freckled shoulders, scattered freckles'}]});
  dna.physique.shoulders='custom_freckles';
  const result=compileModelPrompts({dna,promptStyle,promptCatalog:config});
  expect(result.positive).toContain('adult man');
  expect(result.positive).not.toMatch(/adult woman|freckled shoulders|scattered freckles|custom_choice|custom_freckles/);
  expect(result.positive).toContain('no freckles');
});
