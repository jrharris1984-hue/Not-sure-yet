import { DEFAULT_DNA, expectedSubjectCount } from './dna';
import { catalogDna, catalogSelection } from './promptCatalog';
import { compileModelPrompts } from './modelPromptCompilers';
import { resolvePhysiqueControls } from './physiqueControls';

const config = {sections:[
  {key:'physique', fields:[{key:'body_type',type:'chips',options:[
    {value:'pear',label:'Pear',keywords:'pear shaped body, wide hips, narrow shoulders, full thighs'},
    {value:'slim',label:'Slim',keywords:'slim body, petite build, narrow hips'},
  ]}]},
  {key:'pose',fields:[{key:'action',type:'pose_chips',options:[
    {value:'custom_seated',label:'Seated hands in lap',keywords:'seated on a chair, hands folded in lap'},
    {value:'standing arms loosely crossed',label:'Crossed arms',keywords:'standing comfortably, arms crossed'},
  ]}]},
  {key:'scenario',fields:[{key:'cast_type',type:'chips',options:[
    {value:'triplets',label:'Triplets',keywords:'three identical triplet sisters, matching trio'},
  ]}]},
]};
const sample = () => {const dna=JSON.parse(JSON.stringify(DEFAULT_DNA));dna.identity={...dna.identity,gender:'female',age:35};return dna;};

test('expanded choices retain original keys privately for compiler checks', () => {
  const dna={scenario:{cast_type:'triplets',cast_size:'solo'}};
  const resolved=catalogDna(dna,config,true);
  expect(expectedSubjectCount(resolved)).toBe(3);
  expect(catalogSelection(resolved,'scenario','cast_type')).toBe('triplets');
  expect(dna).toEqual({scenario:{cast_type:'triplets',cast_size:'solo'}});
  expect(catalogDna(dna,config)._catalogSelections).toBeUndefined();
});

test('regional slider safeguards still recognize a renamed body preset', () => {
  const dna={physique:{body_type:'pear',hip_scale:20}};
  expect(resolvePhysiqueControls(catalogDna(dna,config,true)).dna.physique.body_type).toBe('');
});

test.each(['chroma','krea2','sdxl','pony','zimage','qwen_image'])('%s keeps explicit traits and custom hand placement without contradictory prose', promptStyle => {
  const dna=sample();dna.physique={...dna.physique,body_type:'slim',height:'tall',hips:'wide'};
  dna.pose={...dna.pose,action:'custom_seated',hands:'over head'};
  const before=JSON.stringify(dna);
  const result=compileModelPrompts({dna,promptStyle,promptCatalog:config});
  expect(result.positive).toContain('slim body');
  expect(result.positive).toContain('hands folded in lap');
  expect(result.positive).not.toMatch(/petite build|narrow hips|hands over head|arms raised overhead|custom_seated|_catalogSelections/);
  expect(JSON.stringify(dna)).toBe(before);
});

test('compound appearance wording is not duplicated by the preservation pass', () => {
  const dna=sample();dna.physique.body_type='pear';dna.pose.action='standing';
  const result=compileModelPrompts({dna,promptStyle:'krea2',promptCatalog:config});
  expect(result.positive.split('pear shaped body')).toHaveLength(2);
});
