import {SECTIONS} from './dna';
import {PROMPT_MAP} from './promptMap';
import options from './characterVibeOptions.json';
import {catalogSections} from './promptCatalog';
test('vibe options keep the saved archetype key and all legacy themes',()=>{
  const field=SECTIONS.find(section=>section.key==='identity').fields.find(item=>item.key==='archetype');
  expect(field.label).toBe('Character vibe (optional)');
  expect(field.groups.flatMap(group=>group.options)).toEqual(expect.arrayContaining(['athlete','artist','queen','warrior','vintage starlet',...options.map(option=>option.value)]));
  options.forEach(option=>expect(PROMPT_MAP.identity.archetype[option.value]).toBe(option.keywords));
});
test('new portrait descriptors do not assign clothes, body traits or camera settings',()=>{
  options.forEach(option=>expect(option.keywords).not.toMatch(/\b(dress|lingerie|nude|breast|blonde|lens|lighting|pose|bedroom)\b/i));
});

test('saved custom library labels and wording remain authored',()=>{
  const config={sections:[{key:'identity',fields:[{key:'archetype',label:'My persona',options:[{value:'romantic muse',label:'My muse',keywords:'custom words',group:'Mine'}]}]}]};
  const before=JSON.stringify(config);
  const field=catalogSections(SECTIONS,config).find(section=>section.key==='identity').fields.find(item=>item.key==='archetype');
  expect(field.label).toBe('My persona');
  expect(field.optionLabels['romantic muse']).toBe('My muse');
  expect(JSON.stringify(config)).toBe(before);
});
