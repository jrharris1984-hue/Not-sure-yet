import {ArrowLeft,ArrowRight,Camera,Footprints,Layers2,Mountain,Palette,PersonStanding,ScanFace,Scissors,Shirt,Sparkles,Sun,UserRound,UsersRound} from 'lucide-react';
const sectionIcons={scenario:UsersRound,identity:UserRound,physique:PersonStanding,feet:Footprints,face:ScanFace,hair:Scissors,skin:Layers2,wardrobe:Shirt,pose:PersonStanding,camera:Camera,scene:Mountain,lighting:Sun,style:Palette};
const hints={scenario:'Set the cast. Build the story.',identity:'Give your character a point of view.',physique:'Shape the silhouette, one detail at a time.',feet:'Fine-tune the details that make them unique.',face:'Find a face with character.',hair:'A new cut. A different color. Your signature.',skin:'Bring texture and subtle detail to life.',wardrobe:'Style a complete look, or build your own.',pose:'Find the angle. Set the mood.',camera:'See your scene through a different lens.',scene:'Give your character a world.',lighting:'Let the light tell the story.',style:'Make the image feel like yours.'};
export default function CreationSectionHeader({section,sections,stages,onSection}) {
  if(!section)return null;
  const index=sections.findIndex(item=>item.key===section.key);
  const stage=stages.find(item=>item.sections?.includes(section.key));
  const SectionIcon=sectionIcons[section.key] || Sparkles;
  return <header className="creation-section-heading">
    <div className="creation-section-title"><span className="creation-section-emblem" data-section-icon={section.key} aria-hidden="true"><SectionIcon size={23} strokeWidth={1.8}/></span><div><p>{stage?.title || 'Create'} / Edit details</p><h1>{section.title}</h1><span className="creation-section-hint">{hints[section.key] || 'Explore the details. Make it your own.'}</span></div></div>
    <div className="creation-section-actions"><button type="button" aria-label="Previous category" title="Previous category" disabled={index<=0} onClick={()=>onSection(sections[index-1].key)}><ArrowLeft size={17}/></button><button type="button" aria-label="Next category" title="Next category" disabled={index<0 || index>=sections.length-1} onClick={()=>onSection(sections[index+1].key)}><ArrowRight size={17}/></button></div>
  </header>;
}
