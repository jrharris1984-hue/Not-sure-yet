import { ChevronRight, SlidersHorizontal, Sparkles } from "lucide-react";

export const MOBILE_STUDIO_STEPS = [
  {
    id: "start",
    label: "Start",
    shortLabel: "Start",
    hint: "Identity & setup",
    sections: ["identity"],
    simpleSections: ["identity"],
  },
  {
    id: "character",
    label: "Character",
    shortLabel: "Character",
    hint: "Body, face, hair & wardrobe",
    sections: ["physique", "face", "hair", "skin", "intimate", "feet", "wardrobe"],
    simpleSections: ["physique", "face", "hair", "wardrobe"],
  },
  {
    id: "scene",
    label: "Scene",
    shortLabel: "Scene",
    hint: "Pose, camera & atmosphere",
    sections: ["pose", "scene", "lighting", "camera", "style"],
    simpleSections: ["pose", "scene", "lighting"],
  },
  {
    id: "fine-tune",
    label: "Fine Tune",
    shortLabel: "Fine tune",
    hint: "Specialized controls",
    sections: ["kink", "scenario", "watersports"],
    simpleSections: ["scenario"],
  },
  {
    id: "create",
    label: "Create",
    shortLabel: "Create",
    hint: "Review & render",
    sections: [],
    simpleSections: [],
  },
];

export const SIMPLE_FIELD_KEYS = {
  identity: ["gender", "age", "ethnicity", "archetype", "name"],
  physique: ["height", "body_type", "curves", "bust", "butt", "hips", "waist"],
  face: ["eye_shape", "eye_color", "jawline", "lips", "expression"],
  hair: ["style", "length", "color"],
  wardrobe: ["outfit_preset", "footwear"],
  pose: ["action", "angle", "distance", "body_language"],
  scene: ["environment", "indoor_outdoor", "era"],
  lighting: ["source", "style", "mood"],
  scenario: ["cast_size", "roleplay", "explicit_level", "kink_level"],
};

export function mobileStudioStepForSection(sectionKey) {
  return MOBILE_STUDIO_STEPS.find((step) => step.sections.includes(sectionKey))?.id || "start";
}

export function mobileStudioSectionsForStep(stepId, mode = "simple") {
  const step = MOBILE_STUDIO_STEPS.find((item) => item.id === stepId);
  if (!step) return [];
  return mode === "advanced" ? step.sections : (step.simpleSections || step.sections);
}

export default function MobileStudioFlow({
  currentStep,
  activeSection,
  locks = {},
  sections = [],
  mode = "simple",
  summary = "",
  onStep,
  onSection,
  onModeChange,
}) {
  const activeIndex = Math.max(0, MOBILE_STUDIO_STEPS.findIndex((step) => step.id === currentStep));
  const active = MOBILE_STUDIO_STEPS[activeIndex] || MOBILE_STUDIO_STEPS[0];
  const sectionMap = Object.fromEntries(sections.map((section) => [section.key, section]));
  const visibleSections = mobileStudioSectionsForStep(active.id, mode);

  return (
    <section className="md:hidden pane overflow-hidden" data-testid="mobile-studio-flow">
      <div className="border-b hairline px-3 py-2.5">
        <div className="flex items-start justify-between gap-3">
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

          <div className="flex shrink-0 rounded-lg border hairline bg-black/20 p-0.5" data-testid="mobile-studio-mode">
            <button
              type="button"
              onClick={() => onModeChange("simple")}
              data-testid="btn-mobile-mode-simple"
              className={`inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-[9px] font-bold uppercase tracking-wide transition-colors ${
                mode === "simple" ? "bg-amber-500 text-black" : "text-zinc-500"
              }`}
            >
              <Sparkles className="h-3 w-3" /> Simple
            </button>
            <button
              type="button"
              onClick={() => onModeChange("advanced")}
              data-testid="btn-mobile-mode-advanced"
              className={`inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-[9px] font-bold uppercase tracking-wide transition-colors ${
                mode === "advanced" ? "bg-zinc-200 text-black" : "text-zinc-500"
              }`}
            >
              <SlidersHorizontal className="h-3 w-3" /> Advanced
            </button>
          </div>
        </div>

        {summary && (
          <div className="mt-2 rounded-lg border hairline bg-black/15 px-2.5 py-2 text-[10px] leading-relaxed text-zinc-400" data-testid="mobile-studio-summary">
            <span className="mr-1.5 font-mono uppercase tracking-wide text-zinc-600">Selected</span>
            {summary}
          </div>
        )}
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

      {visibleSections.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto px-3 py-2.5 scroll-fade" data-testid="mobile-studio-section-tabs">
          {visibleSections.map((sectionKey) => {
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

      {mode === "simple" && active.sections.length > visibleSections.length && (
        <button
          type="button"
          onClick={() => onModeChange("advanced")}
          className="flex w-full items-center justify-center gap-1.5 border-t hairline px-3 py-2 text-[10px] font-semibold text-zinc-500 hover:text-zinc-300"
          data-testid="btn-mobile-show-more-sections"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          {active.sections.length - visibleSections.length} more {active.sections.length - visibleSections.length === 1 ? "section" : "sections"} in Advanced Studio
        </button>
      )}

      {active.id === "create" && (
        <div className="px-3 py-2.5 text-[11px] text-zinc-400">
          {mode === "simple"
            ? "Choose quality and image count, review the essentials, then render."
            : "Advanced Studio shows the full prompt, model, LoRA, and tuning controls."}
        </div>
      )}
    </section>
  );
}
