import CreateSetupSummary from './CreateSetupSummary';
import { mediaUrl } from '@/lib/media';
import { galleryIsVideo } from '@/lib/galleryBrowse';
export default function GuidedCharacterPreview({ preview, name, dna, stages, sections, onSection, onReview }) {
  return <aside className="guided-preview hidden xl:block xl:sticky xl:top-24 self-start space-y-3 max-h-[calc(100dvh-8rem)] overflow-y-auto" aria-label="Character preview and setup">
    <section className="pane rounded-2xl overflow-hidden"><div className="border-b hairline p-3"><h2 className="text-sm font-semibold">{name || 'Your character'}</h2><p className="mt-1 text-xs text-zinc-500">Last available preview</p></div><div className="aspect-[4/3] bg-black/20 grid place-items-center">{preview ? galleryIsVideo(preview) ? <video src={mediaUrl(preview)} controls playsInline className="h-full w-full object-contain"/> : <img src={mediaUrl(preview)} alt="Last available character preview" className="h-full w-full object-contain"/> : <p className="p-5 text-center text-xs text-zinc-400">Your image will appear after generation. You can choose the character details first.</p>}</div><p className="p-3 text-xs text-zinc-500">Editing choices does not update this image automatically.</p></section>
    <CreateSetupSummary compact dna={dna} stages={stages} sections={sections} onSection={onSection}/>
    <button type="button" className="min-h-11 w-full rounded-xl bg-cyan-300 px-3 text-sm font-bold text-black" onClick={onReview}>Review & create</button>
  </aside>;
}
