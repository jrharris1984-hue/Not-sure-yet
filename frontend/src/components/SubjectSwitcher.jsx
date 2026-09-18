import { User, Plus, X, Copy, Shuffle } from "lucide-react";
import { MAX_SUBJECTS } from "@/lib/dna";

// Horizontal tab strip of subjects (A, B, C, D) + Add/Remove/Copy actions.
// Only renders if there are 2+ subjects OR the scenario expects multiple people
// (in which case we always show the strip so the user can add subject B).
export default function SubjectSwitcher({
  subjects,
  activeId,
  onSelect,
  onAdd,
  onRemove,
  onCopyFromPrimary,
  onRandomizeActive,
  expectedCount = 1,
  primaryLabel = "A",
}) {
  const showStrip = subjects.length > 1 || expectedCount > 1;
  if (!showStrip) return null;
  const canAdd = subjects.length < MAX_SUBJECTS;
  return (
    <div
      className="pane p-2 flex flex-wrap items-center gap-1.5"
      data-testid="subject-switcher"
    >
      <div className="section-label !text-emerald-300 pl-1 pr-2 flex items-center gap-1.5">
        <User className="h-3 w-3" /> Subjects
        {expectedCount > subjects.length && (
          <span
            className="ml-1 text-[10px] font-mono normal-case text-amber-300"
            data-testid="subject-hint-add-more"
            title="Your scenario expects more subjects — add one to give them their own DNA"
          >
            · needs {expectedCount - subjects.length} more
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-1 items-center">
        {subjects.map((s, i) => {
          const active = s.id === activeId;
          return (
            <div
              key={s.id}
              className={`inline-flex items-center rounded-md border overflow-hidden transition-colors ${
                active
                  ? "border-emerald-500 bg-emerald-500/10"
                  : "border-hairline bg-elevated hover:bg-white/[0.04]"
              }`}
            >
              <button
                type="button"
                onClick={() => onSelect(s.id)}
                data-testid={`subject-tab-${s.label}`}
                className={`px-2.5 py-1.5 text-sm font-display font-bold ${
                  active ? "text-emerald-200" : "text-zinc-200"
                }`}
                title={`Switch to Subject ${s.label}`}
              >
                {s.label}
                {s.dna?.identity?.name && (
                  <span className="ml-1.5 font-mono font-normal text-[10px] text-zinc-400">
                    {s.dna.identity.name}
                  </span>
                )}
              </button>
              {i > 0 && (
                <button
                  type="button"
                  onClick={() => onRemove(s.id)}
                  data-testid={`subject-remove-${s.label}`}
                  className="px-1.5 py-1.5 text-zinc-500 hover:text-red-300 hover:bg-red-500/10 border-l hairline"
                  title={`Remove Subject ${s.label}`}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          );
        })}
        <button
          type="button"
          onClick={onAdd}
          disabled={!canAdd}
          data-testid="btn-add-subject"
          className="inline-flex items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-30 disabled:cursor-not-allowed px-2.5 py-1.5 text-sm font-semibold"
          title={canAdd ? "Add another subject with its own DNA" : `Max ${MAX_SUBJECTS} subjects`}
        >
          <Plus className="h-3.5 w-3.5" /> Add
        </button>
      </div>
      <div className="ml-auto flex flex-wrap items-center gap-1.5">
        {subjects.length > 1 && subjects[0]?.id !== activeId && (
          <button
            type="button"
            onClick={onCopyFromPrimary}
            data-testid="btn-copy-from-primary"
            className="inline-flex items-center gap-1 rounded-md border hairline px-2 py-1.5 text-[11px] font-mono uppercase tracking-wide text-zinc-300 hover:bg-white/[0.05]"
            title={`Copy Subject ${primaryLabel}'s DNA into the active subject`}
          >
            <Copy className="h-3 w-3" /> Copy {primaryLabel} → here
          </button>
        )}
        <button
          type="button"
          onClick={onRandomizeActive}
          data-testid="btn-randomize-active-subject"
          className="inline-flex items-center gap-1 rounded-md border hairline px-2 py-1.5 text-[11px] font-mono uppercase tracking-wide text-zinc-300 hover:bg-white/[0.05]"
          title="Randomize the active subject only"
        >
          <Shuffle className="h-3 w-3" /> Randomize active
        </button>
      </div>
    </div>
  );
}
