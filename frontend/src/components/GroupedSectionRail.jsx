import { useState } from "react";
import { ChevronDown, Lock } from "lucide-react";
import { PHASES, SECTIONS, isSectionFilled } from "@/lib/dna";

const PHASE_STYLES = {
  body:     { dot: "bg-amber-400",   ring: "ring-amber-400/30",   text: "text-amber-300" },
  intimate: { dot: "bg-rose-400",    ring: "ring-rose-400/30",    text: "text-rose-300" },
  style:    { dot: "bg-sky-400",     ring: "ring-sky-400/30",     text: "text-sky-300" },
  play:     { dot: "bg-fuchsia-400", ring: "ring-fuchsia-400/30", text: "text-fuchsia-300" },
};

const SECTION_INDEX = Object.fromEntries(SECTIONS.map((s, i) => [s.key, i + 1]));

export default function GroupedSectionRail({ dna, locks, activeSection, onSelect, testIdPrefix = "nav-section" }) {
  // Auto-expand the phase containing the active section on first render
  const activePhase = PHASES.find((p) => p.sections.includes(activeSection))?.key || "body";
  const [openPhases, setOpenPhases] = useState(() => ({
    body: true, intimate: activePhase === "intimate", style: activePhase === "style", play: activePhase === "play",
  }));
  const toggle = (k) => setOpenPhases((s) => ({ ...s, [k]: !s[k] }));

  return (
    <div className="pane p-2 space-y-1" data-testid="grouped-section-rail">
      <div className="section-label px-2 pt-1.5 pb-1">Sections</div>
      {PHASES.map((phase) => {
        const style = PHASE_STYLES[phase.key];
        const filledCount = phase.sections.filter((k) => isSectionFilled(k, dna)).length;
        const isOpen = openPhases[phase.key];
        return (
          <div key={phase.key} className="rounded-md overflow-hidden">
            <button
              type="button"
              onClick={() => toggle(phase.key)}
              data-testid={`phase-header-${phase.key}`}
              className={`w-full flex items-center gap-2 px-2 py-2 rounded-md hover:bg-white/[0.04] transition-colors ${isOpen ? "bg-white/[0.02]" : ""}`}
            >
              <div className={`h-2 w-2 rounded-full ${style.dot} ring-4 ${style.ring}`} />
              <div className="flex-1 text-left">
                <div className={`font-display font-bold text-[0.82rem] ${style.text}`}>{phase.label}</div>
                <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">{phase.hint}</div>
              </div>
              <div className="flex items-center gap-1">
                {/* Filled-dot indicator: shows filled vs empty per sub-section */}
                <div className="flex gap-0.5">
                  {phase.sections.map((k) => (
                    <span
                      key={k}
                      className={`block h-1.5 w-1.5 rounded-full transition-colors ${
                        isSectionFilled(k, dna) ? style.dot : "bg-zinc-700"
                      }`}
                    />
                  ))}
                </div>
                <ChevronDown className={`h-3.5 w-3.5 text-zinc-500 transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </div>
            </button>
            {isOpen && (
              <div className="pb-1">
                {phase.sections.map((secKey) => {
                  const sec = SECTIONS.find((s) => s.key === secKey);
                  if (!sec) return null;
                  const active = activeSection === secKey;
                  const filled = isSectionFilled(secKey, dna);
                  const locked = !!locks?.[secKey];
                  return (
                    <button
                      key={secKey}
                      type="button"
                      onClick={() => onSelect(secKey)}
                      data-testid={`${testIdPrefix}-${secKey}`}
                      className={`w-full flex items-center gap-2 pl-6 pr-2 py-1.5 text-sm text-left transition-colors ${
                        active
                          ? `${style.text} bg-white/[0.04] font-semibold`
                          : "text-zinc-300 hover:bg-white/[0.03]"
                      }`}
                    >
                      <span className="w-5 text-[10px] font-mono text-zinc-500 tabular-nums">{SECTION_INDEX[secKey]}</span>
                      <span className="flex-1 capitalize">{sec.title}</span>
                      {locked && <Lock className="h-3 w-3 text-zinc-500" />}
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          active ? style.dot : filled ? style.dot + " opacity-60" : "bg-zinc-700"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
