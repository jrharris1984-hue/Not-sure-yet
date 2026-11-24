import {mossWorkflowSettings} from './mossWorkflowSettings';
const graphs = [
  [require('../../../backend/seed_workflows/moss_stardust_bf16.json'),25,3,'er_sde'],
  [require('../../../backend/seed_workflows/moss_jib_realistic_bf16.json'),8,1,'euler'],
  [require('../../../backend/seed_workflows/moss_finalcut_universal.json'),6,2.5,'euler'],
  [require('../../../backend/seed_workflows/dirty_moss_v2_photographic_realism.json'),25,2.5,'er_sde'],
];
test.each(graphs)('reads the chosen Moss graph instead of carrying another model sampling setup', (graph,steps,cfg,sampler) => {
  expect(mossWorkflowSettings({prompt_style:'moss_image',json_str:JSON.stringify(graph)})).toEqual({width:graph['6'].inputs.width,height:graph['6'].inputs.height,batchSize:1,steps,cfg,sampler,scheduler:'simple'});
});
test('ignores other families, invalid JSON and linked sampler values', () => {
  expect(mossWorkflowSettings({prompt_style:'krea2',json_str:JSON.stringify(graphs[0][0])})).toBeNull();
  expect(mossWorkflowSettings({prompt_style:'moss_image',json_str:'invalid'})).toBeNull();
  const graph=JSON.parse(JSON.stringify(graphs[0][0]));graph['7'].inputs.steps=['other',0];
  expect(mossWorkflowSettings({prompt_style:'moss_image',json_str:JSON.stringify(graph)})).toBeNull();
});
test('rejects ambiguous graphs and invalid literal settings rather than guessing',()=>{
  for (const change of [g=>g['7'].inputs.cfg=-1,g=>g['7'].inputs.steps=0,g=>g['6'].inputs.width=777,g=>g['7'].inputs.sampler_name='',g=>g.extra={...g['7']}]) {
    const graph=JSON.parse(JSON.stringify(graphs[0][0]));change(graph);
    expect(mossWorkflowSettings({prompt_style:'moss_image',json_str:JSON.stringify(graph)})).toBeNull();
  }
});

test('Dirty-Moss V2 exposes its creator shift of five through the native sampler node',()=>{
  const graph=require('../../../backend/seed_workflows/dirty_moss_v2_photographic_realism.json');
  expect(graph['10']).toMatchObject({class_type:'ModelSamplingSD3',inputs:{shift:5,model:['1',0]}});
  expect(graph['7'].inputs.model).toEqual(['10',0]);
});
