import { Redo2, Undo2 } from "lucide-react";
export default function CharacterHistoryControls({ canUndo, canRedo, onUndo, onRedo, busy = false }) {
  const style = "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border hairline px-3 text-xs font-semibold text-zinc-200 hover:border-cyan-400/40 disabled:cursor-not-allowed disabled:opacity-30";
  return <div className="pane flex flex-wrap items-center justify-between gap-3 px-3 py-2" aria-label="Character edit history">
    <div className="text-xs text-zinc-400">Character edits <span className="text-zinc-600">· this session</span></div>
    <div className="flex gap-2">
      <button type="button" aria-label="Undo character edit" onClick={onUndo} disabled={busy || !canUndo} className={style}><Undo2 className="h-4 w-4" />Undo</button>
      <button type="button" aria-label="Redo character edit" onClick={onRedo} disabled={busy || !canRedo} className={style}><Redo2 className="h-4 w-4" />Redo</button>
    </div>
  </div>;
}
