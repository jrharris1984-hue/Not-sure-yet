import {API_BASE} from './api';
export const comparisonImageUrl=(render)=>{
 const url=render?.output_variants?.enhanced?.[0]||render?.output_files?.[0]||'';
 if(!url)return '';
 try{
  const parsed=new URL(url,typeof window==='undefined'?'http://localhost':window.location.origin);
  const filename=parsed.searchParams.get('filename');
  if(filename&&parsed.pathname.endsWith('/view')){
   const params=new URLSearchParams({filename,subfolder:parsed.searchParams.get('subfolder')||'',type:parsed.searchParams.get('type')||'output'});
   return `${API_BASE}/comfyui/media?${params}`;
  }
  return url;
 }catch{return '';}
};
export const comparisonJobStatus=(jobs,queue=[])=>jobs.map(job=>{
 const match=queue.find(item=>item.id===job.id||item.queue_id===job.id);
 return {...job,...(match||{}),label:job.label};
});
