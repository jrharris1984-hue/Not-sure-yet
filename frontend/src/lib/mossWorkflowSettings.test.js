import {mossWorkflowSettings} from './mossWorkflowSettings';
const graphs = [
  [require('../../../backend/seed_workflows/moss_stardust_bf16.json'),25,3,'er_sde'],
  [require('../../../backend/seed_workflows/moss_jib_realistic_bf16.json'),8,1,'euler'],
  [require('../../../backend/seed_workflows/moss_finalcut_universal.json'),6,2.5,'euler'],
];
test.each(graphs)('reads the chosen Moss graph instead of carrying another model sampling setup', (graph,steps,cfg,sampler) => {
  expect(mossWorkflowSettings({prompt_style:'moss_image',json_str:JSON.stringify(graph)})).toEqual({width:graph['6'].inputs.width,height:1024,batchSize:1,steps,cfg,sampler,scheduler:'simple'});
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
