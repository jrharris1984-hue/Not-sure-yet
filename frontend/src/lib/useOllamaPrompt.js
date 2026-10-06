import {useEffect,useState} from 'react';
import {endpoints} from './api';
export function useOllamaPrompt(source, enabled) {
  const [result,setResult]=useState(null);
  useEffect(()=>{
    if(!enabled || !source.trim()) return;
    const controller=new AbortController();let active=true;
    const timer=setTimeout(async()=>{
      try {
        const response=await endpoints.aiCompileOllama(source,controller.signal);
        if(active)setResult({...response,source});
      } catch(error) {
        if(active)setResult({source,positive:source,accepted:false,reason:'Ollama unavailable; using compact logic.'});
      }
    },700);
    return ()=>{active=false;clearTimeout(timer);controller.abort();};
  },[source,enabled]);
  const current=enabled && result?.source===source ? result : null;
  return {positive:current?.positive || source,pending:enabled && !!source.trim() && !current,
    reason:current?.reason || (enabled ? 'Ollama is compiling the selected details…' : ''),accepted:current?.accepted};
}
