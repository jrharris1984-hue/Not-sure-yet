import VisualChoice from './VisualChoice';
import useTabPreference from "@/hooks/useTabPreference";
import { useMemo, useRef, useEffect, useState } from "react";
import OptionBrowser from "./OptionBrowser";
import PoseIcon from "@/components/PoseIcon";
import { X } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

// Grouped chip picker: category tabs + only the active category's chips.
// Supports single-select (value=string) or multi-select (value=array of strings).
export default function GroupedChips({
  groups,
  compactCategories = false,
  value,
  onChange,
  testIdPrefix,
  variant = "chips",     // "chips" | "poses"
  multi = false,
  labels = {},
}) {
  const arr = useMemo(() => multi ? (Array.isArray(value) ? value : []) : null, [multi, value]);
  const reduceMotion = useReducedMotion();
  const has = (opt) => (multi ? arr.includes(opt) : value === opt);

  const findGroupOf = (v) => groups.findIndex((g) => g.options.includes(v));
  const initialTab = () => {
    if (multi && arr.length) return Math.max(0, findGroupOf(arr[0]));
    if (!multi) return Math.max(0, findGroupOf(value));
    return 0;
  };
  const [groupName, setGroupName] = useTabPreference(testIdPrefix ? `ultra:choice-group:${testIdPrefix}` : null, groups[initialTab()]?.name || "");
  const tab = Math.max(0, groups.findIndex(group => group.name === groupName));
  const [browseVersion,setBrowseVersion]=useState(0);
  const setTab = index => {setGroupName(groups[index]?.name || "");setBrowseVersion(version=>version+1);};
  const previousSelection = useRef({ key: testIdPrefix, value });

  useEffect(() => {
    const previous = previousSelection.current;
    previousSelection.current = { key: testIdPrefix, value };
    if (previous.key !== testIdPrefix || previous.value === value) return;
    if (!multi) {
      const i = findGroupOf(value);
      if (i >= 0 && i !== tab) setGroupName(groups[i].name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, multi, testIdPrefix]);

  const active = groups[tab] || groups[0] || { name: "Choices", options: [] };

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
              {labels[opt] || opt}
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

      {/* Pose filters are optional on narrow screens; thumbnails remain primary. */}
      {variant === "poses" && <details className="pose-mobile-filters">
        <summary>Filter poses · {active.name}</summary>
        <label className="block text-sm text-zinc-300">Pose category
          <select aria-label="Pose category" className="studio-control-search mt-2 min-h-11 w-full" value={active.name} onChange={event=>setTab(groups.findIndex(group=>group.name===event.target.value))}>
            {groups.map(group=><option key={group.name} value={group.name}>{group.name}</option>)}
          </select>
        </label>
      </details>}
      {/* Category tabs */}
      <div className={variant === "poses" ? "pose-desktop-filters" : undefined}>
      {compactCategories ? <label className="block text-sm text-zinc-300">Category<select aria-label="Choice category" className="studio-control-search mt-2 min-h-11 w-full" value={active.name} onChange={event=>setTab(groups.findIndex(group=>group.name===event.target.value))}>{groups.map(group=><option key={group.name} value={group.name}>{group.name}</option>)}</select></label> : <div className="flex flex-wrap gap-1.5">
        {groups.map((g, i) => {
          const isActive = i === tab;
          const cnt = countPerGroup[i];
          return (
            <button
              key={g.name}
              type="button"
              aria-pressed={isActive}
              onClick={() => setTab(i)}
              data-testid={`${testIdPrefix}-tab-${g.name.replace(/[^a-z0-9]+/gi, "-")}`}
              className={`relative inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-mono uppercase tracking-wider transition-colors ${
                isActive
                  ? "bg-amber-500/15 text-amber-200 border border-amber-500/40"
                  : "border hairline text-zinc-400 hover:text-zinc-100 hover:bg-white/5"
              }`}
            >
              {g.name}
              {isActive && <motion.span layoutId={`${testIdPrefix}-category-indicator`}
                className="absolute inset-x-1 bottom-0 h-0.5 rounded-full bg-amber-400"
                transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 450, damping: 36 }} />}
              {cnt > 0 && (
                <span className="inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-amber-400 text-black text-[9px] font-bold">
                  {cnt}
                </span>
              )}
            </button>
          );
        })}
      </div>}

      </div>

      <OptionBrowser key={`${testIdPrefix}:${browseVersion}`} alwaysSearch preferenceKey={testIdPrefix} browseGroup={active.name} options={active.options} searchOptions={groups.flatMap(group => group.options)} value={value} labels={labels}>{visible => <>
      <motion.div key={`${testIdPrefix}-${active.name}`}
        initial={reduceMotion ? false : { opacity: 0, y: 7 }}
        animate={{ opacity: 1, y: 0 }}

        transition={reduceMotion ? {duration:0} : {type:"spring",stiffness:420,damping:30,opacity:{duration:0.16}}}>
      {variant === "poses" ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
          {visible.map((opt) => {
            const isActive = has(opt);
            return (
              <button
                key={opt}
                type="button"
                data-testid={`${testIdPrefix}-${opt.replace(/\s+/g, "-")}`}
                aria-pressed={isActive}
                onClick={() => toggle(opt)}
                className={`studio-choice flex flex-col items-center justify-center gap-1 rounded-xl border p-2 text-[10px] leading-tight text-center min-h-[148px] sm:min-h-[108px] transition-all ${
                  isActive
                    ? "border-amber-500 bg-amber-500/10 text-amber-100 shadow-[0_0_20px_rgba(245,158,11,0.15)]"
                    : "border-[#222634] bg-[#12141C] text-zinc-300 hover:border-zinc-600 hover:bg-[#1A1D28]"
                }`}
              >
                <PoseIcon name={opt} size={72} active={isActive} />
                <span className="font-mono uppercase tracking-tight">{labels[opt] || opt}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="visual-choice-grid">
          {visible.map(opt=><VisualChoice key={opt} value={opt} label={labels[opt] || opt} active={has(opt)} field={testIdPrefix}
            testId={`${testIdPrefix}-${opt.replace(/\s+/g, "-")}`} onClick={()=>toggle(opt)}/>)}
        </div>
      )}
      </motion.div>
      </>}</OptionBrowser>
    </div>
  );
}
