import {compileVideoDirection,normalizeVideoDirector,supportsVideoAudio} from './videoDirector';
import {compileModelPrompts} from './modelPromptCompilers';
import {assembleFinalPrompts} from './finalPromptAssembly';
import {generationPromptFields,workflowPromptPolicy} from './workflowPromptPolicy';
const workflow={kind:'text_video',prompt_style:'ltx_t2v',json_str:JSON.stringify(require('../../../backend/seed_workflows/sulphur2_t2v.json'))};
const director={enabled:true,start:'the subject stands at a gate',action:'the subject walks down the path',end:'the subject stops and smiles',camera:'follow',pace:'natural',continuity:'the blue jacket and garden lighting',audio:'quiet footsteps'};
test('builds chronological action with one camera and preserves additional notes',()=>{
 const prompt=compileVideoDirection({director,notes:'Leaves rustle nearby',workflow});
 expect(prompt.indexOf('At the start')).toBeLessThan(prompt.indexOf('Then,'));
 expect(prompt.indexOf('Then,')).toBeLessThan(prompt.indexOf('By the end'));
 for (const detail of ['Track the subject','natural, unhurried','blue jacket','Leaves rustle nearby','Audio: quiet footsteps'])expect(prompt).toContain(detail);
});
test('freeform text is exact and camera-only directions do not satisfy action validation',()=>{
 expect(compileVideoDirection({director:{...director,enabled:false},notes:'  Keep this\nwording. '})).toBe('  Keep this\nwording. ');
 expect(compileVideoDirection({director:{enabled:true,camera:'follow',pace:'slow'}})).toBe('');
});
test('audio requires a supported graph and is omitted without discarding the saved input',()=>{
 expect(supportsVideoAudio(workflow)).toBe(true);
 for (const w of [{kind:'text_video',prompt_style:'wan_t2v'}, {...workflow,json_str:'invalid'},{...workflow,json_str:'{}'}]) {
  expect(supportsVideoAudio(w)).toBe(false);
  expect(compileVideoDirection({director,workflow:w})).not.toContain('quiet footsteps');
 }
 expect(director.audio).toBe('quiet footsteps');
});
test('normalizes corrupt drafts and bounds text input',()=>{
 expect(normalizeVideoDirector(null)).toMatchObject({enabled:false,camera:'',action:''});
 expect(normalizeVideoDirector({enabled:'yes',camera:'teleport',pace:42,action:'a'.repeat(900)})).toMatchObject({enabled:false,camera:'',pace:'',action:'a'.repeat(800)});
});
test.each(['wan_t2v','wan5b_t2v','ltx_t2v'])('%s keeps structured direction before the selected character/scene',promptStyle=>{
 const w={...workflow,prompt_style:promptStyle};
 const instruction=compileVideoDirection({director,workflow:w});
 for (const promptFormat of ['detailed','scene']) {
  const c=compileModelPrompts({promptStyle,workflowKind:'text_video',structuredVideo:true,promptFormat,videoInstruction:instruction,dna:{identity:{age:30,gender:'woman'},hair:{color:'auburn'},wardrobe:{outfit_preset:'pantsuit'},scene:{environment:'garden'}}});
  expect(c.positive.startsWith(instruction)).toBe(true);
  expect(c.positive.split('the subject walks down the path')).toHaveLength(2);
  expect(c.positive).toContain('auburn');expect(c.positive).toContain('garden');
  const final=assembleFinalPrompts({...c,promptStyle,workflowKind:'text_video',photographic:true});
  expect(generationPromptFields(workflowPromptPolicy({workflowKind:'text_video',promptStyle}),final).video_instruction).toBe(final.positive);
 }
});
test('image-to-video uses movement without rebuilding character appearance from DNA',()=>{
 const instruction=compileVideoDirection({director,workflow:{kind:'video',prompt_style:'wan_i2v'}});
 const c=compileModelPrompts({workflowKind:'video',promptStyle:'wan_i2v',structuredVideo:true,videoInstruction:instruction,dna:{hair:{color:'purple'}}});
 expect(c.positive).toContain(instruction);expect(c.positive).not.toContain('purple');
});
