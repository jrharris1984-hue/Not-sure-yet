import {ArrowLeft,ArrowRight} from 'lucide-react';
export default function CreationSectionHeader({section,sections,stages,onSection}) {
  if(!section)return null;
  const index=sections.findIndex(item=>item.key===section.key);
  const stage=stages.find(item=>item.sections?.includes(section.key));
  return <header className="creation-section-heading">
    <div><p>{stage?.title || 'Create'} / Edit details</p><h1>{section.title}</h1></div>
    <div className="creation-section-actions"><button type="button" aria-label="Previous category" disabled={index<=0} onClick={()=>onSection(sections[index-1].key)}><ArrowLeft size={17}/></button><button type="button" aria-label="Next category" disabled={index<0 || index>=sections.length-1} onClick={()=>onSection(sections[index+1].key)}><ArrowRight size={17}/></button></div>
  </header>;
}
