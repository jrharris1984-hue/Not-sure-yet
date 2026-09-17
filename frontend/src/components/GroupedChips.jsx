import { useMemo, useState, useEffect } from "react";
import PoseIcon from "@/components/PoseIcon";

// Grouped chip picker: category tabs + only the active category's chips.
// Auto-jumps to the category containing the currently-selected value on mount.
export default function GroupedChips({
  groups,
  value,
  onChange,
  testIdPrefix,
  variant = "chips", // "chips" | "poses"
}) {
  const findGroupOf = (v) => groups.findIndex((g) => g.options.includes(v));
  const [tab, setTab] = useState(() => {
    const i = findGroupOf(value);
    return i >= 0 ? i : 0;
  });
  // If value changes externally (preset apply), jump tab
  useEffect(() => {
    const i = findGroupOf(value);
    if (i >= 0 && i !== tab) setTab(i);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const active = groups[tab] || groups[0];
  const activeCount = useMemo(
    () => groups.map((g) => (g.options.includes(value) ? 1 : 0)),
    [groups, value]
  );

  return (
    <div className="space-y-3" data-testid={`${testIdPrefix}-grouped`}>
      <div className="flex flex-wrap gap-1.5">
        {groups.map((g, i) => {
          const isActive = i === tab;
          const hasSelected = activeCount[i] === 1;
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
              {hasSelected && <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />}
            </button>
          );
        })}
      </div>

      {variant === "poses" ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {active.options.map((opt) => {
            const isActive = value === opt;
            return (
              <button
                key={opt}
                type="button"
                data-testid={`${testIdPrefix}-${opt.replace(/\s+/g, "-")}`}
                onClick={() => onChange(isActive ? "" : opt)}
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
            const isActive = value === opt;
            return (
              <button
                key={opt}
                type="button"
                data-testid={`${testIdPrefix}-${opt.replace(/\s+/g, "-")}`}
                className={`chip ${isActive ? "active" : ""}`}
                onClick={() => onChange(isActive ? "" : opt)}
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
