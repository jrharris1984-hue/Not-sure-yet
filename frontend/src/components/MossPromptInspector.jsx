import { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, ClipboardList } from 'lucide-react';

// Read-only view of the compiler output. Does not change the prompt or selections.
export default function MossPromptInspector({ positive = '', compilerMeta = {} }) {
  const [open, setOpen] = useState(false);
  const diagnostics = compilerMeta.mossDiagnostics;
  if (!Array.isArray(diagnostics)) return null;
  const conflicts = compilerMeta.mossPromptConflicts || [];
  const duplicates = compilerMeta.mossRemovedDuplicates || [];
  const warnings = diagnostics.flatMap((entry, index) =>
    (entry.warnings || []).map(message => ({ message, index })));
  return (
    <section className="rounded-lg border hairline bg-black/20 p-3 space-y-2" data-testid="moss-prompt-inspector">
      <button type="button" onClick={() => setOpen(value => !value)}
        className="flex w-full items-center justify-between gap-2 text-left text-xs font-semibold text-zinc-200"
        aria-expanded={open}>
        <span className="inline-flex items-center gap-2"><ClipboardList className="h-4 w-4 text-cyan-300"/> MOSS Prompt Inspector</span>
        <span className="inline-flex items-center gap-2 text-[11px] font-normal text-zinc-400">
          {conflicts.length + warnings.length} notices · {duplicates.length} duplicates
          {open ? <ChevronUp className="h-4 w-4"/> : <ChevronDown className="h-4 w-4"/>}
        </span>
      </button>
      {open && <div className="space-y-3 text-xs text-zinc-300">
        <p className="text-[11px] text-zinc-400">Read-only diagnostics. These findings do not change your settings or prove the model will reproduce the proportions.</p>
        {diagnostics.map((entry, index) => (
          <div key={index} className="space-y-1 rounded-md border hairline p-2">
            <div className="font-semibold">Subject {String.fromCharCode(65 + index)}</div>
            {Object.entries(entry.geometry || {}).map(([region, detail]) => (
              <div key={region} className="grid grid-cols-[70px_minmax(0,1fr)] gap-2 break-words text-[11px]">
                <span className="capitalize text-zinc-400">{region}</span>
                <span>Size: {String(detail.size || 'unspecified')} ({detail.sizeSource}); shape: {detail.contour || 'unspecified'}; projection: {detail.projection}</span>
              </div>
            ))}
          </div>
        ))}
        {(warnings.length || conflicts.length) ? <div className="space-y-1">
          <div className="flex items-center gap-1 font-semibold text-amber-200"><AlertTriangle className="h-3.5 w-3.5"/> Review notices</div>
          {warnings.map(({message,index}, i) => <p key={i} className="text-[11px]">Subject {String.fromCharCode(65 + index)}: {message}</p>)}
          {conflicts.map((conflict,i) => <p key={i} className="text-[11px]">{conflict.message}</p>)}
        </div> : <p className="text-[11px] text-zinc-400">No known geometry conflicts reported.</p>}
        <div className="text-[11px]">Exact repeated clauses removed: {duplicates.length}</div>
        {duplicates.length > 0 && <ul className="max-h-24 overflow-y-auto list-disc pl-4 text-[11px]">
          {duplicates.map((clause, i) => <li key={i}>{clause}</li>)}
        </ul>}
        <details>
          <summary className="cursor-pointer text-[11px] text-cyan-200">View current positive prompt</summary>
          <pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap break-words rounded-md border hairline p-2 text-[11px]">{positive}</pre>
        </details>
      </div>}
    </section>
  );
}
