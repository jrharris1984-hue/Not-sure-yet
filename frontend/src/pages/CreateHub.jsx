import CharacterPreviewEntry from '@/components/CharacterPreviewEntry';
import CharacterPicker from '@/components/CharacterPicker';
import { ArrowRight, Camera, ImagePlus, Sparkles, UserRound, Users } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

export default function CreateHub() {
  const [picker,setPicker]=useState('');
  const pickerRegion=useRef(null), opener=useRef(null);
  useEffect(()=>{if(picker) {pickerRegion.current?.focus();pickerRegion.current?.scrollIntoView?.({block:'start',behavior:'auto'});}},[picker]);
  const choose=(intent,event)=>{opener.current=event.currentTarget;setPicker(intent);};
  const close=()=>{setPicker('');requestAnimationFrame(()=>opener.current?.focus());};
  const cardClass='pane group flex min-h-44 flex-col justify-between rounded-2xl p-5 text-left transition-colors hover:border-cyan-400/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300';
  return <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-10 space-y-6" data-testid="create-hub">
    <header><div className="section-label">Create</div><h1 className="mt-2 font-display text-3xl sm:text-4xl font-extrabold">What would you like to do?</h1><p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">Start new work here. Choose a task and we’ll guide you through it. Advanced controls stay available when you need them.</p></header>
    <div className="grid gap-3 sm:grid-cols-2">
      <Link to="/character/new" className={`${cardClass} border-cyan-400/30 bg-cyan-500/[0.04]`}><div><UserRound className="h-6 w-6 text-cyan-300"/><h2 className="mt-4 text-lg font-bold">Create a character</h2><p className="mt-2 text-sm text-zinc-400">Start with a preset or build your own, one step at a time.</p></div><span className="mt-4 flex items-center gap-2 text-xs font-semibold text-cyan-200">Start creating<ArrowRight className="h-4 w-4"/></span></Link>
      <button type="button" className={cardClass} aria-expanded={picker==='character'} aria-controls="create-picker-region" onClick={event=>choose('character',event)}><div><Users className="h-6 w-6 text-violet-300"/><h2 className="mt-4 text-lg font-bold">Use a saved character</h2><p className="mt-2 text-sm text-zinc-400">Find a familiar face, continue editing, or make a separate copy.</p></div><span className="mt-4 text-xs font-semibold text-violet-200">Choose a character →</span></button>
      <Link to="/tools" className={cardClass}><div><ImagePlus className="h-6 w-6 text-amber-300"/><h2 className="mt-4 text-lg font-bold">Edit an image</h2><p className="mt-2 text-sm text-zinc-400">Choose an editing tool, then upload the photo you want to change.</p></div><span className="mt-4 text-xs font-semibold text-amber-200">Choose an editing tool →</span></Link>
      <button type="button" className={cardClass} aria-expanded={picker==='shoot'} aria-controls="create-picker-region" onClick={event=>choose('shoot',event)}><div><Camera className="h-6 w-6 text-emerald-300"/><h2 className="mt-4 text-lg font-bold">Create a photoshoot</h2><p className="mt-2 text-sm text-zinc-400">Choose a saved character, then plan a coordinated set of photos.</p></div><span className="mt-4 text-xs font-semibold text-emerald-200">Choose your cast →</span></button>
    </div>
    {picker && <div id="create-picker-region" ref={pickerRegion} tabIndex={-1} className="scroll-mt-24 outline-none"><CharacterPicker key={picker} intent={picker} onClose={close}/></div>}
    <section className="rounded-2xl border hairline bg-black/10 p-4 text-sm text-zinc-400"><b className="text-zinc-200">New here?</b> Choose Create a character, pick a few details, then review before generating. You can leave optional details alone.<Link to="/character/new/s/scenario" className="mt-3 block min-h-11 content-center text-cyan-200">Start from a character preset →</Link></section>
    <details className="pane rounded-2xl p-4 sm:p-5"><summary className="min-h-11 cursor-pointer content-center font-semibold">More ways to create</summary><div className="mt-3 grid gap-2 sm:grid-cols-2">{[['/create','Open streamlined workspace'],['/create/image','Prompt-only image'],['/create/video','Animate an image'],['/create/text-video','Video from text'],['/shoots','Manage photoshoots'],['/','Open character library']].map(([to,label])=><Link key={to} to={to} className="min-h-11 rounded-xl border hairline p-3 text-sm text-zinc-300">{label}</Link>)}</div><div className="mt-4"><CharacterPreviewEntry/></div><Link to="/research" className="mt-4 flex min-h-11 items-center gap-2 text-sm text-cyan-200"><Sparkles className="h-4 w-4"/>Model and prompt research</Link></details>
  </div>;
}
