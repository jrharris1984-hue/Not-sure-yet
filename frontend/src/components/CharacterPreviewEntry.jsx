import { Link } from 'react-router-dom';
import { ScanFace, ArrowRight } from 'lucide-react';

export default function CharacterPreviewEntry() {
  return <section className="pane border-cyan-400/25 bg-cyan-500/[0.04] p-4 sm:p-5" aria-label="Experimental studio" data-testid="character-preview-entry">
    <div className="section-label text-cyan-300">Experimental studio</div>
    <Link to="/create/character-preview" className="mt-3 flex min-h-14 items-center gap-4">
      <ScanFace className="h-8 w-8 shrink-0 text-cyan-300" />
      <div className="min-w-0 flex-1"><h2 className="font-display text-lg font-bold">Character Preview Lab</h2>
        <p className="mt-1 text-xs leading-relaxed text-zinc-400">Test a character as you build it. Update a small AI preview without changing your regular editor draft.</p>
      </div>
      <ArrowRight className="h-5 w-5 shrink-0 text-cyan-300" />
    </Link>
  </section>;
}
