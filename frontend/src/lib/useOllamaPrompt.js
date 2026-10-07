import {useEffect,useState} from 'react';
import {endpoints} from './api';
import {useAssistantResearch} from './assistantResearch';
export function useOllamaPrompt(source, enabled, context = {}) {
  const {enabled:researchEnabled,focus}=useAssistantResearch();
  const workflowName=context.workflowName || '',promptStyle=context.promptStyle || '';
  const requestKey=JSON.stringify([source,researchEnabled,researchEnabled ? focus : '',workflowName,promptStyle]);
  const [result,setResult]=useState(null);
  useEffect(()=>{
    if(!enabled || !source.trim()) return;
    const controller=new AbortController();let active=true;
    const timer=setTimeout(async()=>{
      try {
        const response=await endpoints.aiCompileOllama(source,controller.signal,{workflowName,promptStyle});
        if(active)setResult({...response,source,requestKey});
      } catch(error) {
        if(active)setResult({source,requestKey,positive:source,accepted:false,reason:error?.response?.data?.detail || 'Ollama unavailable; using compact logic.'});
      }
    },700);
    return ()=>{active=false;clearTimeout(timer);controller.abort();};
  },[source,enabled,requestKey,workflowName,promptStyle]);
  const current=enabled && result?.requestKey===requestKey ? result : null;
  return {positive:current?.positive || source,pending:enabled && !!source.trim() && !current,
    reason:current?.reason || (enabled ? 'Ollama is compiling the selected details…' : ''),accepted:current?.accepted};
}
