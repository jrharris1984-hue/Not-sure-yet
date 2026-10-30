// Deterministic UI-only backend. Unknown writes fail closed.
function createFixtures() {
  const characters = new Map();
  let dispatches = 0;
  const requests=[];
  const workflow = {id:'ui-photo',name:'UI test photo workflow',kind:'image',prompt_style:'chroma',workflow_json:{},enabled:true};
  const render = {id:'ui-render',status:'done',workflow_id:workflow.id,output_files:['/ui-test-result.svg']};
  return {
    get dispatches(){return dispatches;},
    get requests(){return requests;},
    response(method, path, body = {}) {
      const ok = body => ({status:200, body});
      if (path === '/settings') return ok({prompt_catalog:{sections:[]},default_workflow_id:workflow.id,hidden_workflow_ids:[],ai_provider:'ollama'});
      if (path === '/comfyui/health') return ok({online:true});
      if (path === '/workflows') return ok([workflow]);
      if (path === '/characters' && method === 'POST') {
        const saved = {...body,id:'ui-character'};characters.set(saved.id,saved);return ok(saved);
      }
      if (path === '/characters/ui-character' && method === 'PATCH') {
        const saved={...characters.get('ui-character'),...body,id:'ui-character'};characters.set(saved.id,saved);return ok(saved);
      }
      if (path === '/characters/ui-character') return ok(characters.get('ui-character') || {});
      if (path === '/characters') return ok([...characters.values()]);
      if (path === '/renders/dispatch' && method === 'POST') {dispatches++;requests.push(JSON.parse(JSON.stringify(body)));return ok(render);}
      if (path === '/renders/ui-render/poll' && method === 'POST') return ok(render);
      if (method !== 'GET') return {status:501,body:{detail:`UI fixture does not implement ${method} ${path}`}};
      if (path === '/renders' || path.endsWith('/renders')) return ok(dispatches ? [render] : []);
      if (path.includes('status')) return ok({ready:false,online:false,missing:[]});
      if (path.endsWith('/schema')) return ok({});
      return ok([]);
    }
  };
}
module.exports = {createFixtures};
