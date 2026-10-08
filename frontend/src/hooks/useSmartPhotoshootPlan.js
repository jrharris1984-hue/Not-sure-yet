import { useMemo, useState } from "react";
import { buildSmartPhotoshootPlan, regenerateSmartPhotoshootPlan } from "@/lib/batchSmartPhotoshoot";

export default function useSmartPhotoshootPlan({ enabled, count, subjects, promptCatalog, preset, options, customPresets, strength }) {
  const context = useMemo(() => ({ enabled, count, subjects, promptCatalog, preset, options, customPresets, strength }),
    [enabled, count, subjects, promptCatalog, preset, options, customPresets, strength]);
  const initialPlan = useMemo(() => enabled ? buildSmartPhotoshootPlan({ ...context, seed: 1 }) : [], [context, enabled]);
  const [edited, setEdited] = useState(null);
  // Changing the style, subjects, count or variation settings immediately clears
  // previous keeps. A stale plan must never reach the render dispatcher.
  const plan = edited?.context === context ? edited.plan : initialPlan;
  const update = (transform) => setEdited(previous => {
    const current = previous?.context === context ? previous : { context, plan: initialPlan, seed: 1 };
    return transform(current);
  });
  const toggleKeep = index => update(current => ({ ...current,
    plan: current.plan.map((shot, position) => position === index ? { ...shot, kept: !shot.kept } : shot),
  }));
  const regenerate = (index = null) => update(current => ({ ...current,
    seed: current.seed + 1,
    plan: regenerateSmartPhotoshootPlan({ ...context, plan: current.plan, seed: current.seed + 1, index }),
  }));
  return { plan, toggleKeep, regenerate };
}
