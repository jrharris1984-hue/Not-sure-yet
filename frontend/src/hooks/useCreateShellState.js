import { useEffect, useState } from "react";
import { mobileStudioSectionsForStep, mobileStudioStepForSection } from "@/components/MobileStudioFlow";

export function useCreateShellState({ activeSection, studioSteps, nav, sectionUrl }) {
  const [mobileStudioStep, setMobileStudioStep] = useState(() => mobileStudioStepForSection(activeSection, studioSteps));
  const [mobileStudioMode, setMobileStudioMode] = useState("simple");
  const [mobileSheets, setMobileSheets] = useState(true);
  const [mobileToolsGroup, setMobileToolsGroup] = useState("overview");
  const [sheetViewport, setSheetViewport] = useState(() =>
    window.matchMedia?.("(max-width: 767px)").matches ?? window.innerWidth < 768
  );
  const [desktopQuickMode, setDesktopQuickMode] = useState(true);
  const [specialtyTab, setSpecialtyTab] = useState(0);
  const [quickReview, setQuickReview] = useState(false);

  useEffect(() => {
    const query = window.matchMedia?.("(max-width: 767px)");
    if (!query) return;
    const update = () => setSheetViewport(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => { setQuickReview(false); }, [activeSection]);

  useEffect(() => {
    if (mobileStudioStep === "create") return;
    setMobileStudioStep(mobileStudioStepForSection(activeSection, studioSteps));
  }, [activeSection, mobileStudioStep, studioSteps]);

  const activeMobileStudioIndex = Math.max(0, studioSteps.findIndex((step) => step.id === mobileStudioStep));

  const openMobileStudioStep = (stepId) => {
    const step = studioSteps.find((item) => item.id === stepId);
    if (!step) return;
    setMobileStudioStep(stepId);
    const visibleSections = mobileStudioSectionsForStep(stepId, mobileStudioMode, studioSteps);
    if (visibleSections.length && !visibleSections.includes(activeSection)) nav(sectionUrl(visibleSections[0]));
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  };

  const moveMobileStudioStep = (direction) => {
    const nextIndex = Math.max(0, Math.min(studioSteps.length - 1, activeMobileStudioIndex + direction));
    openMobileStudioStep(studioSteps[nextIndex].id);
  };

  const changeMobileStudioMode = (nextMode) => {
    setMobileStudioMode(nextMode);
    if (nextMode !== "simple") return;
    const visibleSections = mobileStudioSectionsForStep(mobileStudioStep, "simple", studioSteps);
    if (visibleSections.length && !visibleSections.includes(activeSection)) nav(sectionUrl(visibleSections[0]));
  };

  return {
    mobileStudioStep, setMobileStudioStep,
    mobileStudioMode, setMobileStudioMode,
    mobileSheets, setMobileSheets,
    mobileToolsGroup, setMobileToolsGroup,
    sheetViewport,
    desktopQuickMode, setDesktopQuickMode,
    specialtyTab, setSpecialtyTab,
    quickReview, setQuickReview,
    activeMobileStudioIndex,
    openMobileStudioStep,
    moveMobileStudioStep,
    changeMobileStudioMode,
  };
}
