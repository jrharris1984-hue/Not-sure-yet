import {SECTIONS, DEFAULT_DNA} from './dna';
import {catalogSections, catalogDna, customCatalogPrompt, setPromptCatalog, editableSection, applyCatalogRules, validateCatalogDraft, promptLibrarySections, sharedPoseGroups} from './promptCatalog';
import {compileModelPrompts} from './modelPromptCompilers';
const custom={key:'custom_atmosphere',title:'Atmosphere',fields:[{key:'custom_weather',label:'Weather details',type:'chips_multi',options:[{value:'custom_mist',label:'Morning mist',keywords:'a thin layer of morning mist over the ground',group:'Outdoors'}]}]};
afterEach(() => setPromptCatalog({sections:[]}));
test('category and selection names can change without mutating built-ins or stored option IDs', () => {
  const hair=editableSection(SECTIONS.find(section => section.key==='hair'));
  hair.title='Hair styling';const field=hair.fields.find(field => field.key==='color');field.options[0].label='Black hair';
  const sections=catalogSections(SECTIONS,{sections:[hair,custom]});
  expect(sections.find(section => section.key==='hair').title).toBe('Hair styling');
  expect(sections.find(section => section.key==='hair').fields.find(field => field.key==='color').optionLabels['jet black']).toBe('Black hair');
  expect(SECTIONS.find(section => section.key==='hair').title).toBe('Hair');
  expect(sections.at(-1).key).toBe('custom_atmosphere');
});
test.each(['qwen_image','qwen_rapid','chroma','zimage','krea2'])('%s includes selected custom keywords, not internal IDs', promptStyle => {
  setPromptCatalog({sections:[custom]});
  const dna={...JSON.parse(JSON.stringify(DEFAULT_DNA)),custom_atmosphere:{custom_weather:['custom_mist']}};
  const result=compileModelPrompts({dna,promptStyle,workflowKind:'image'});
  expect(result.positive).toContain('a thin layer of morning mist over the ground');
  expect(result.positive).not.toContain('custom_mist');
  expect(dna.custom_atmosphere.custom_weather).toEqual(['custom_mist']);
});
test('built-in choice keyword override resolves before compiling, while blank keywords keep original mappings', () => {
  const hair=editableSection(SECTIONS.find(section => section.key==='hair'));
  hair.fields.find(field => field.key==='color').options.find(option => option.value==='jet black').keywords='natural black hair with subtle highlights';
  const dna={hair:{color:'jet black'}};
  expect(catalogDna(dna,{sections:[hair]}).hair.color).toBe('natural black hair with subtle highlights');
  expect(dna.hair.color).toBe('jet black');
  expect(catalogDna({hair:{length:'long'}},{sections:[hair]}).hair.length).toBe('long');
});
test('removed custom options omit stale IDs and new custom fields use display name when keywords are blank', () => {
  const hair=editableSection(SECTIONS.find(section => section.key==='hair'));
  hair.fields.push({key:'custom_accessory',label:'Hair accessory',type:'chips',options:[{value:'custom_pin',label:'Silver hairpin',keywords:'',group:''}]});
  expect(customCatalogPrompt({hair:{custom_accessory:'custom_pin'}},{sections:[hair]})).toBe('Silver hairpin');
  expect(catalogDna({hair:{color:'custom_deleted'}},{sections:[hair]}).hair.color).toBe('');
});
test('multiple subjects retain separate custom choices', () => {
  setPromptCatalog({sections:[custom]});
  const dna=JSON.parse(JSON.stringify(DEFAULT_DNA));
  const result=compileModelPrompts({promptStyle:'qwen_image',workflowKind:'image',subjects:[{label:'A',dna:{...dna,custom_atmosphere:{custom_weather:['custom_mist']}}},{label:'B',dna}]});
  expect(result.positive).toContain('Subject A: a thin layer of morning mist');
  expect(result.positive).not.toContain('Subject B: a thin layer');
});

test('enabled rules apply only to their scope and unsupported negative conditioning stays empty', () => {
  const config={sections:[],rules:[
    {key:'custom_photo',label:'Natural detail',text:'subtle natural photographic texture',kind:'positive',scope:'image',enabled:true},
    {key:'custom_no_blur',label:'Avoid blur',text:'motion blur',kind:'negative',scope:'image',enabled:true},
    {key:'custom_disabled',label:'Disabled',text:'illustrated style',kind:'positive',scope:'all',enabled:false},
  ]};
  expect(applyCatalogRules({positive:'Portrait',negative:'watermark'},'image',config)).toMatchObject({positive:'Portrait; subtle natural photographic texture',negative:'watermark, motion blur'});
  expect(applyCatalogRules({positive:'Pan left',negative:''},'video',config).positive).toBe('Pan left');
  expect(applyCatalogRules({positive:'Portrait',negative:''},'pony',config).positive).toContain('subtle natural photographic texture');
  expect(applyCatalogRules({positive:'Portrait',negative:'',negativeStrategy:'zeroed'},'image',config).negative).toBe('');
});
test('malformed imports and blank rule wording fail validation', () => {
  expect(() => validateCatalogDraft({sections:[{key:'custom_bad',title:'Bad',fields:[{key:'custom_choice',label:'Choice',type:'chips',options:[null]}]}]})).toThrow('valid choice');
  expect(() => validateCatalogDraft({sections:[],rules:[{key:'custom_rule',label:'Rule',text:'',kind:'positive',scope:'all',enabled:true}]})).toThrow('wording');
});
test('saved rules reach Qwen compiled and freeform dispatch prompts, while disabled rules stay out', () => {
  const {freeformPayload}=require('./freeformGeneration');
  setPromptCatalog({sections:[],rules:[
    {key:'custom_detail',label:'Natural detail',text:'subtle natural texture',kind:'positive',scope:'image',enabled:true},
    {key:'custom_no_blur',label:'No blur',text:'blur',kind:'negative',scope:'image',enabled:true},
    {key:'custom_off',label:'Off',text:'watercolor appearance',kind:'positive',scope:'all',enabled:false},
  ]});
  const result=compileModelPrompts({dna:DEFAULT_DNA,promptStyle:'qwen_rapid',workflowKind:'image'});
  expect(result.positive).toContain('subtle natural texture');
  expect(result.positive).not.toContain('watercolor appearance');
  expect(result.negative).toBe('');
  const payload=freeformPayload({mode:'image',workflow:{id:'q',kind:'image',prompt_style:'qwen_image'},prompt:'Portrait photograph'});
  expect(payload.prompt_positive).toBe('Portrait photograph; subtle natural texture');
  expect(payload.prompt_negative).toBe('blur');
});


test('Prompt Library ordering starts with Scenario then Identity and adds Shared Poses after Pose', () => {
  const sections=promptLibrarySections(SECTIONS);
  expect(sections.slice(0,2).map(section=>section.key)).toEqual(['scenario','identity']);
  expect(sections.findIndex(section=>section.key==='shared_poses')).toBe(sections.findIndex(section=>section.key==='pose')+1);
});

test('shared pose metadata is editable without becoming a character DNA section', () => {
  const config={sections:[{key:'shared_poses',title:'Shared Poses',fields:[{key:'two_people',label:'2 people',type:'pose_chips',options:[
    {value:'side by side',label:'Editorial Pair',keywords:'close editorial pairing',group:'Custom'},
  ]}]}]};
  const groups=sharedPoseGroups(2,config);
  expect(groups[0]).toMatchObject({label:'Custom',poses:[{value:'side by side',label:'Editorial Pair',prompt:'close editorial pairing'}]});
  expect(catalogSections(SECTIONS,config).some(section=>section.key==='shared_poses')).toBe(false);
});
