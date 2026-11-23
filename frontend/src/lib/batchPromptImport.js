import { newCatalogKey, validateCatalogDraft } from './promptCatalog';
import { expandPrompt } from './promptMap';

const clean = value => String(value || '').replace(/\s+/g, ' ').trim();
const norm = value => clean(value).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const words = value => new Set(norm(value).split(' ').filter(word => word.length > 2));
const overlap = (left, right) => {
  const a = words(left), b = words(right);
  if (!a.size || !b.size) return 0;
  return [...a].filter(word => b.has(word)).length / Math.max(a.size, b.size);
};

const ROUTES = [
  ['pose', /\b(pose|posing|stance|standing|seated|sitting|walking|kneeling|reclining|twist|turning|gesture|movement|arabesque|pin.?up)\b/i],
  ['wardrobe', /\b(wardrobe|outfit|clothing|garment|dress|jacket|coat|skirt|pants|trousers|shirt|blouse|lingerie|shoes|boots|heels|fabric|apparel)\b/i],
  ['scene', /\b(scene|environment|location|setting|room|studio|beach|forest|garden|street|rooftop|interior|exterior|background)\b/i],
  ['lighting', /\b(light|lighting|shadow|shadows|illumination|golden hour|rim light|softbox|flash|window light)\b/i],
  ['camera', /\b(camera|lens|angle|framing|crop|shot|perspective|close.?up|wide.?angle|focal length)\b/i],
  ['physique', /\b(physique|body|bust|breast|hip|waist|thigh|glute|buttock|shoulder|arm|calf|muscle|proportion|silhouette)\b/i],
  ['hair', /\b(hair|hairstyle|braid|ponytail|curl|locs|bangs)\b/i],
  ['skin', /\b(skin|complexion|freckle|pores|texture|glow|makeup)\b/i],
  ['face', /\b(face|eyes|eyebrows|nose|lips|expression|smile|gaze)\b/i],
  ['identity', /\b(age|heritage|nationality|identity|adult|appearance)\b/i],
];

function parseCsv(text) {
  const rows=[]; let row=[], cell='', quoted=false;
  for(let index=0;index<text.length;index++) {
    const char=text[index];
    if(char==='"' && quoted && text[index+1]==='"'){cell+='"';index++;}
    else if(char==='"') quoted=!quoted;
    else if(char===',' && !quoted){row.push(cell.trim());cell='';}
    else if((char==='\n' || char==='\r') && !quoted){
      if(char==='\r' && text[index+1]==='\n')index++;
      row.push(cell.trim()); if(row.some(Boolean))rows.push(row); row=[];cell='';
    } else cell+=char;
  }
  row.push(cell.trim());if(row.some(Boolean))rows.push(row);
  if(!rows.length)return [];
  const headers=rows[0].map(value=>norm(value).replace(/ /g,'_'));
  const headered=headers.some(value=>['prompt','text','keywords','category','subcategory','label','name','group'].includes(value));
  const body=headered?rows.slice(1):rows;
  return body.map(values=>headered?Object.fromEntries(headers.map((key,index)=>[key,values[index]||''])):{prompt:values[0]||'',label:values[1]||''});
}

export function parseBatchPromptInput(input) {
  const text=String(input||'').replace(/^\uFEFF/,'').trim();
  if(!text)throw new Error('Add prompt text or choose an import file.');
  let values;
  if(text.startsWith('{') || text.startsWith('[')) {
    const parsed=JSON.parse(text);
    values=Array.isArray(parsed)?parsed:parsed.prompts||parsed.items||parsed.entries;
    if(!Array.isArray(values))throw new Error('JSON must contain a prompts, items or entries array.');
  } else if(text.includes(',') && /\b(prompt|text|keywords|category|subcategory)\b/i.test(text.split(/\r?\n/)[0])) values=parseCsv(text);
  else values=text.split(/\r?\n/).map(line=>line.trim()).filter(line=>line && !/^#/.test(line)).map(line=>{
    const match=line.match(/^([^:]{2,100}):\s+(.+)$/);
    return match?{label:match[1],prompt:match[2]}:{prompt:line};
  });
  const entries=values.map((item,index)=>{
    if(typeof item==='string')item={prompt:item};
    if(!item || typeof item!=='object')throw new Error(`Prompt row ${index+1} is invalid.`);
    const prompt=clean(item.prompt||item.keywords||item.text||item.description);
    const label=clean(item.label||item.name||item.value)||prompt.slice(0,80);
    if(!prompt || !label)throw new Error(`Prompt row ${index+1} needs a name and prompt text.`);
    if(prompt.length>1500 || label.length>200)throw new Error(`Prompt row ${index+1} exceeds the supported length.`);
    return {id:clean(item.id),value:clean(item.value),label,prompt,category:clean(item.category||item.section),subcategory:clean(item.subcategory||item.field),group:clean(item.group)};
  });
  if(!entries.length || entries.length>1000)throw new Error('Import between 1 and 1,000 prompt rows at a time.');
  return entries;
}

function isPromptField(field) { return ['chips','chips_multi','pose_chips'].includes(field.type); }
function locationValue(section, field) { return `${section.key}::${field.key}`; }

export function suggestPromptDestination(entry, sections=[]) {
  const category=norm(entry.category), subcategory=norm(entry.subcategory);
  let section=category ? sections.find(item=>norm(item.key)===category||norm(item.title)===category) : null;
  let confidence=0.35, reason='No strong category match; review the destination.';
  if(section){confidence=1;reason='Matched the supplied category.';}
  if(!section){
    const hit=ROUTES.find(([,pattern])=>pattern.test(`${entry.label} ${entry.prompt}`));
    section=hit && sections.find(item=>item.key===hit[0]);
    if(section){confidence=0.72;reason=`Matched ${section.title} terms in the prompt.`;}
  }
  if(!section){
    const ranked=sections.map(item=>({item,score:Math.max(overlap(`${entry.label} ${entry.prompt}`,item.title),overlap(`${entry.label} ${entry.prompt}`,item.key))})).sort((a,b)=>b.score-a.score);
    if(ranked[0]?.score>=0.34){section=ranked[0].item;confidence=ranked[0].score;reason=`Matched words in ${section.title}.`;}
  }
  let field=null;
  if(section && subcategory)field=section.fields.find(item=>isPromptField(item)&&(norm(item.key)===subcategory||norm(item.label)===subcategory));
  if(section && !field){
    const ranked=section.fields.filter(isPromptField).map(item=>({item,score:Math.max(overlap(`${entry.label} ${entry.prompt}`,item.label),overlap(`${entry.label} ${entry.prompt}`,item.key),...(item.options||[]).map(option=>overlap(`${entry.label} ${entry.prompt}`,`${option.label} ${option.value} ${option.keywords||''}`)))})).sort((a,b)=>b.score-a.score);
    field=ranked[0]?.item;
  }
  if(section && !field)field=section.fields.find(isPromptField);
  if(section && field && subcategory)reason='Matched the supplied category and subcategory.';
  return {destination:section&&field?locationValue(section,field):'__custom__',confidence,reason,sectionKey:section?.key||'',fieldKey:field?.key||''};
}

export function prepareBatchPromptRows(entries, sections) {
  const locations=sections.flatMap(section=>section.fields.filter(isPromptField).map(field=>({value:locationValue(section,field),section,field})));
  const known=new Map();
  const byId=new Map();
  locations.forEach(({value,field})=>field.options.forEach(option=>{known.set(`${value}::${norm(option.label)}`,option);byId.set(`${value}::${option.value}`,{value,option});}));
  return entries.map(entry=>{
    const suggestion=suggestPromptDestination(entry,sections);
    const exact=entry.id.match(/^([^:]+)::([^:]+)::(.+)$/);
    const exactMatch=exact&&byId.get(`${exact[1]}::${exact[2]}::${exact[3]}`);
    const destination=exactMatch?exactMatch.value:locations.some(item=>item.value===suggestion.destination)?suggestion.destination:'__custom__';
    const match=exactMatch?.option||known.get(`${destination}::${norm(entry.label)}`);
    return {...entry,...suggestion,destination:exactMatch?destination:destination,change:match?'update':'add',existingValue:match?.value||''};
  });
}

export function exportPromptBatch(sections, sectionKey='*', fieldKey='*') {
  const prompts=sections.filter(section=>sectionKey==='*'||section.key===sectionKey).flatMap(section=>section.fields
    .filter(field=>(fieldKey==='*'||field.key===fieldKey)&&isPromptField(field))
    .flatMap(field=>(field.options||[]).map(option=>({
      id:`${section.key}::${field.key}::${option.value}`,
      category:section.title,subcategory:field.label,label:option.label||option.value,
      prompt:clean(option.keywords||(section.key==='shared_poses'?option.value:expandPrompt(section.key,field.key,option.value))),group:option.group||''
    }))));
  return {format:'ultrastudio-prompt-batch',version:1,prompts};
}

export function applyBatchPromptRows(catalog, rows, sections) {
  const next=JSON.parse(JSON.stringify(catalog||{sections:[]}));
  let added=0,updated=0;
  for(const row of rows){
    if(row.skip)continue;
    let [sectionKey,fieldKey]=row.destination==='__custom__'?['custom_imported_prompts','custom_prompts']:row.destination.split('::');
    let target=next.sections.find(section=>section.key===sectionKey);
    if(!target){
      const source=sections.find(section=>section.key===sectionKey);
      if(source)target={key:source.key,title:source.title,fields:[]};
      else target={key:'custom_imported_prompts',title:'Imported prompts',fields:[{key:'custom_prompts',label:'Custom prompts',type:'chips',options:[]}]};
      next.sections.push(target);
    }
    let field=target.fields.find(item=>item.key===fieldKey);
    if(!field){const source=sections.find(section=>section.key===sectionKey)?.fields.find(item=>item.key===fieldKey);field=source?{...source,options:[]}:{key:fieldKey,label:'Imported prompts',type:'chips',options:[]};target.fields.push(field);}
    const exact=row.id.match(/^([^:]+)::([^:]+)::(.+)$/);
    const existing=(exact&&exact[1]===sectionKey&&exact[2]===fieldKey?field.options.find(option=>option.value===exact[3]):null)||field.options.find(option=>norm(option.label)===norm(row.label));
    if(existing){existing.keywords=row.prompt; if(row.group)existing.group=row.group;updated++;}
    else {field.options.push({value:newCatalogKey(),label:row.label,keywords:row.prompt,group:row.group||''});added++;}
  }
  validateCatalogDraft(next);
  return {catalog:next,added,updated,skipped:rows.filter(row=>row.skip).length};
}
