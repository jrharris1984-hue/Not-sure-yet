import {workflowPromptPolicy,builderLoraFields,generationPromptFields} from './workflowPromptPolicy';
import {assembleFinalPrompts} from './finalPromptAssembly';
import {compileModelPrompts} from './modelPromptCompilers';
import {PHOTO_DETAIL,LIMB_DETAIL} from './photographicGuidance';
const videoCases=[['video','wan_i2v'],['text_video','wan_t2v'],['text_video','wan5b_t2v'],['text_video','ltx_t2v'],['text_video','custom_video']];
const selection={primary:{name:'image-style.safetensors',strength:0.8,triggerWords:['image_style']},secondary:{name:'portrait.safetensors',strength:0.6,triggerWords:['portrait_style']},overrides:{'10':{strength_model:1}}};
test.each(videoCases)('%s / %s rejects stale image adapters and photo additions', (workflowKind,promptStyle)=>{
  const policy=workflowPromptPolicy({workflowKind,promptStyle});
  const positive='The subject waves slowly; the camera moves left.';
  const final=assembleFinalPrompts({positive,negative:'flicker',workflowKind,promptStyle,photographic:true,loraTriggers:['image_style']});
  expect(final.positive).toBe(positive);expect(final.negative).toBe('flicker');
  expect(builderLoraFields(policy,selection)).toMatchObject({selected_loras:[],selected_lora_name:'',selected_lora_triggers:[],lora_overrides:{}});
  expect(generationPromptFields(policy,final)).toEqual({prompt_positive:positive,prompt_negative:'flicker',video_instruction:positive});
  expect(selection.primary.triggerWords).toEqual(['image_style']);
});
test.each(['wan_i2v','wan_t2v','wan5b_t2v','ltx_t2v'])('compiler/style fallback protects %s when kind is absent',compiler=>{
  expect(assembleFinalPrompts({positive:'Waves roll onto shore.',compiler,photographic:true,loraTriggers:['image_style']}).positive).toBe('Waves roll onto shore.');
});
test.each(['wan_i2v','wan_t2v','wan5b_t2v','ltx_t2v'])('%s keeps motion through compilation, assembly and dispatch',promptStyle=>{
  const workflowKind=promptStyle==='wan_i2v'?'video':'text_video';
  for (const promptFormat of ['detailed','scene']) {
    const c=compileModelPrompts({promptStyle,workflowKind,promptFormat,dna:{identity:{age:30,gender:'woman'},wardrobe:{outfit_preset:'pantsuit'},scene:{environment:'garden'}},videoInstruction:'The subject waves slowly. The camera moves left.'});
    const final=assembleFinalPrompts({...c,workflowKind,promptStyle,photographic:true,loraTriggers:['image_style']});
    expect(final.positive).toContain('waves slowly');expect(final.positive).toContain('camera moves left');
    for(const unwanted of [PHOTO_DETAIL,LIMB_DETAIL,'image_style'])expect(final.positive).not.toContain(unwanted);
    const fields=generationPromptFields(workflowPromptPolicy({workflowKind,promptStyle}),final);
    expect(fields.video_instruction).toBe(final.positive);expect(fields.prompt_positive).toBe(final.positive);
  }
});
test('switching back to an image restores its saved adapter selection without adding video fields',()=>{
  const policy=workflowPromptPolicy({workflowKind:'image',promptStyle:'moss_image'});
  expect(builderLoraFields(policy,selection).selected_loras).toHaveLength(2);
  expect(builderLoraFields(policy,selection).lora_overrides).toEqual(selection.overrides);
  const final=assembleFinalPrompts({positive:'Studio portrait.',workflowKind:'image',photographic:true,loraTriggers:['image_style']});
  expect(final.positive).toContain(PHOTO_DETAIL);expect(final.positive).toContain('image_style');
  expect(generationPromptFields(policy,final)).not.toHaveProperty('video_instruction');
});
test.each(['qwen_edit','flux2_klein_edit','qwen_reference'])('direct %s editing excludes photo boilerplate',promptStyle=>{
  const positive='Change the jacket to blue. Preserve everything else.';
  expect(assembleFinalPrompts({positive,workflowKind:'edit',promptStyle,photographic:true}).positive).toBe(positive);
});
test('exact video replay preserves user-authored wording and whitespace',()=>{
  const positive='  Natural photographic skin texture\nThe camera moves left.  ';
  expect(assembleFinalPrompts({positive,negative:'  flicker ',workflowKind:'text_video',exact:true,photographic:true,loraTriggers:['image_style']})).toMatchObject({positive,negative:'  flicker '});
});
