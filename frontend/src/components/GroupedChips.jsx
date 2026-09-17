import { useMemo, useState, useEffect } from "react";
import PoseIcon from "@/components/PoseIcon";
import { X } from "lucide-react";

// Grouped chip picker: category tabs + only the active category's chips.
// Supports single-select (value=string) or multi-select (value=array of strings).
export default function GroupedChips({
  groups,
  value,
  onChange,
  testIdPrefix,
  variant = "chips",     // "chips" | "poses"
  multi = false,
}) {
  const arr = multi ? (Array.isArray(value) ? value : []) : null;
  const has = (opt) => (multi ? arr.includes(opt) : value === opt);

  const findGroupOf = (v) => groups.findIndex((g) => g.options.includes(v));
  const initialTab = () => {
    if (multi && arr.length) return Math.max(0, findGroupOf(arr[0]));
    if (!multi) return Math.max(0, findGroupOf(value));
    return 0;
  };
  const [tab, setTab] = useState(initialTab);

  useEffect(() => {
    if (!multi) {
      const i = findGroupOf(value);
      if (i >= 0 && i !== tab) setTab(i);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, multi]);

  const active = groups[tab] || groups[0];

  // Selected count per group (for dot indicator)
  const countPerGroup = useMemo(() => groups.map((g) => {
    if (multi) return g.options.filter((o) => arr.includes(o)).length;
    return g.options.includes(value) ? 1 : 0;
  }), [groups, value, arr, multi]);

  const toggle = (opt) => {
    if (multi) {
      const next = arr.includes(opt) ? arr.filter((x) => x !== opt) : [...arr, opt];
      onChange(next);
    } else {
      onChange(value === opt ? "" : opt);
    }
  };

  const removeChip = (opt) => onChange(arr.filter((x) => x !== opt));
  const clearAll = () => onChange([]);

  return (
    <div className="space-y-3" data-testid={`${testIdPrefix}-grouped`}>
      {/* Selected pills bar (multi only) */}
      {multi && arr.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-md bg-amber-500/5 border border-amber-500/30">
          <span className="text-[10px] font-mono uppercase tracking-widest text-amber-300">
            {arr.length} selected
          </span>
          {arr.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => removeChip(opt)}
              data-testid={`${testIdPrefix}-selected-${opt.replace(/\s+/g, "-")}`}
              className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 text-amber-100 border border-amber-500/40 px-2 py-0.5 text-[11px] hover:bg-amber-500/25"
            >
              {opt}
              <X className="h-3 w-3" />
            </button>
          ))}
          <button
            type="button"
            onClick={clearAll}
            data-testid={`${testIdPrefix}-clear-all`}
            className="ml-auto text-[10px] font-mono uppercase tracking-widest text-zinc-400 hover:text-zinc-100"
          >
            clear all
          </button>
        </div>
      )}

      {/* Category tabs */}
      <div className="flex flex-wrap gap-1.5">
        {groups.map((g, i) => {
          const isActive = i === tab;
          const cnt = countPerGroup[i];
          return (
            <button
              key={g.name}
              type="button"
              onClick={() => setTab(i)}
              data-testid={`${testIdPrefix}-tab-${g.name.replace(/[^a-z0-9]+/gi, "-")}`}
              className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-mono uppercase tracking-wider transition-colors ${
                isActive
                  ? "bg-amber-500/15 text-amber-200 border border-amber-500/40"
                  : "border hairline text-zinc-400 hover:text-zinc-100 hover:bg-white/5"
              }`}
            >
              {g.name}
              {cnt > 0 && (
                <span className="inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-amber-400 text-black text-[9px] font-bold">
                  {cnt}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {variant === "poses" ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {active.options.map((opt) => {
            const isActive = has(opt);
            return (
              <button
                key={opt}
                type="button"
                data-testid={`${testIdPrefix}-${opt.replace(/\s+/g, "-")}`}
                onClick={() => toggle(opt)}
                className={`flex flex-col items-center justify-center gap-1 rounded-xl border p-2 text-[10px] leading-tight text-center min-h-[88px] transition-all ${
                  isActive
                    ? "border-amber-500 bg-amber-500/10 text-amber-100 shadow-[0_0_20px_rgba(245,158,11,0.15)]"
                    : "border-[#222634] bg-[#12141C] text-zinc-300 hover:border-zinc-600 hover:bg-[#1A1D28]"
                }`}
              >
                <PoseIcon name={opt} size={40} active={isActive} />
                <span className="font-mono uppercase tracking-tight">{opt}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {active.options.map((opt) => {
            const isActive = has(opt);
            return (
              <button
                key={opt}
                type="button"
                data-testid={`${testIdPrefix}-${opt.replace(/\s+/g, "-")}`}
                className={`chip ${isActive ? "active" : ""}`}
                onClick={() => toggle(opt)}
              >
                {opt}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
