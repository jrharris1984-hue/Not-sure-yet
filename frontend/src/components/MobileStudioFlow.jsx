import { ChevronRight } from "lucide-react";

export const MOBILE_STUDIO_STEPS = [
  {
    id: "start",
    label: "Start",
    shortLabel: "Start",
    hint: "Identity & setup",
    sections: ["identity"],
  },
  {
    id: "character",
    label: "Character",
    shortLabel: "Character",
    hint: "Body, face, hair & wardrobe",
    sections: ["physique", "face", "hair", "skin", "intimate", "feet", "wardrobe"],
  },
  {
    id: "scene",
    label: "Scene",
    shortLabel: "Scene",
    hint: "Pose, camera & atmosphere",
    sections: ["pose", "scene", "lighting", "camera", "style"],
  },
  {
    id: "fine-tune",
    label: "Fine Tune",
    shortLabel: "Fine tune",
    hint: "Specialized controls",
    sections: ["kink", "scenario", "watersports"],
  },
  {
    id: "create",
    label: "Create",
    shortLabel: "Create",
    hint: "Review & render",
    sections: [],
  },
];

export function mobileStudioStepForSection(sectionKey) {
  return MOBILE_STUDIO_STEPS.find((step) => step.sections.includes(sectionKey))?.id || "start";
}

export default function MobileStudioFlow({
  currentStep,
  activeSection,
  locks = {},
  sections = [],
  onStep,
  onSection,
}) {
  const activeIndex = Math.max(0, MOBILE_STUDIO_STEPS.findIndex((step) => step.id === currentStep));
  const active = MOBILE_STUDIO_STEPS[activeIndex] || MOBILE_STUDIO_STEPS[0];
  const sectionMap = Object.fromEntries(sections.map((section) => [section.key, section]));

  return (
    <section className="md:hidden pane overflow-hidden" data-testid="mobile-studio-flow">
      <div className="flex items-center justify-between gap-3 border-b hairline px-3 py-2.5">
        <div className="min-w-0">
          <div className="text-[9px] font-mono uppercase tracking-[0.18em] text-zinc-500">
            Studio flow · {activeIndex + 1} of {MOBILE_STUDIO_STEPS.length}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5">
            <span className="font-display text-base font-bold text-zinc-100">{active.label}</span>
            <ChevronRight className="h-3.5 w-3.5 text-zinc-600" />
            <span className="truncate text-[10px] text-zinc-500">{active.hint}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-5 border-b hairline bg-black/10">
        {MOBILE_STUDIO_STEPS.map((step, index) => {
          const selected = step.id === currentStep;
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => onStep(step.id)}
              data-testid={`mobile-studio-step-${step.id}`}
              className={`min-w-0 border-r hairline px-1 py-2.5 text-center last:border-r-0 transition-colors ${
                selected ? "bg-amber-500/10 text-amber-200" : "text-zinc-500 hover:bg-white/[0.03]"
              }`}
            >
              <span className={`mx-auto grid h-5 w-5 place-items-center rounded-full border text-[9px] font-mono ${
                selected ? "border-amber-400 bg-amber-500/15 text-amber-200" : "border-zinc-700 text-zinc-500"
              }`}>
                {index + 1}
              </span>
              <span className="mt-1 block truncate text-[8px] font-semibold uppercase tracking-wide">
                {step.shortLabel}
              </span>
            </button>
          );
        })}
      </div>

      {active.sections.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto px-3 py-2.5 scroll-fade" data-testid="mobile-studio-section-tabs">
          {active.sections.map((sectionKey) => {
            const section = sectionMap[sectionKey];
            if (!section) return null;
            const selected = activeSection === sectionKey;
            return (
              <button
                key={sectionKey}
                type="button"
                onClick={() => onSection(sectionKey)}
                data-testid={`mobile-studio-section-${sectionKey}`}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-[10px] font-semibold transition-colors ${
                  selected
                    ? "border-amber-400/70 bg-amber-500/10 text-amber-100"
                    : "hairline bg-elevated text-zinc-400"
                }`}
              >
                {section.title}{locks[sectionKey] ? " · locked" : ""}
              </button>
            );
          })}
        </div>
      )}

      {active.id === "create" && (
        <div className="px-3 py-2.5 text-[11px] text-zinc-400">
          Review the prompt and render settings below. Nothing from the advanced Builder has been removed.
        </div>
      )}
    </section>
  );
}
