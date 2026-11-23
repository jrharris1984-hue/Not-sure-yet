import {previewCanContinue} from './workspacePreview';
export function workspaceStepEnabled(steps,index,furthest,values) {
  return index<=furthest && steps.slice(0,index).every(step=>previewCanContinue(step.key,values));
}
export function matchingWorkspaceFields(sections,query) {
  const terms=query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  return sections.flatMap(section=>section.fields.filter(field=>{
    const haystack=`${section.title} ${field.label} ${field.key.replace(/_/g,' ')}`.toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ');
    const tokens=new Set(haystack.split(/\s+/));
    return terms.every(term=>tokens.has(term));
  }).map(field=>({section:section.key,sectionTitle:section.title,field})));
}
