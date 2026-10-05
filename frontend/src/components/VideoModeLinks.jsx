import { Link } from 'react-router-dom';

export default function VideoModeLinks({ mode }) {
  return <nav aria-label="Video creation mode" className="grid gap-2 sm:grid-cols-2">
    {[['video', 'Image to video', 'Animate a starting image; describe movement and camera behavior.'], ['text_video', 'Text to video', 'Describe the whole scene and action; no starting image required.']].map(([key, title, detail]) => <Link key={key} to={key === 'video' ? '/create/video' : '/create/text-video'} aria-current={mode === key ? 'page' : undefined} className={`rounded-lg border p-3 ${mode === key ? 'border-cyan-400/60 bg-cyan-500/10' : 'border-hairline hover:border-cyan-400/40'}`}>
      <span className="block font-semibold text-cyan-200">{title}</span><span className="mt-1 block text-xs text-zinc-400">{detail}</span>
    </Link>)}
  </nav>;
}
