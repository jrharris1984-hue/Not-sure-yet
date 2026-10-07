import { studioProfile } from "@/lib/studioProfiles";

const stage = (id, title, detail, categories, simpleSections) => ({
  id,
  key: id,
  label: title,
  shortLabel: title,
  title,
  detail,
  hint: detail,
  categories,
  sections: categories.flatMap((category) => category.sections),
  simpleSections,
});

const BASE_CREATE_STAGES = [
  stage("start", "People", "Choose the cast and who you are creating", [
    { key: "people", title: "People", sections: ["identity", "scenario"] },
  ], ["identity", "scenario"]),
  stage("character", "Appearance", "Shape the body, face, hair and personal details", [
    { key: "body", title: "Body", sections: ["physique", "feet", "intimate"] },
    { key: "appearance", title: "Face & hair", sections: ["face", "hair", "skin"] },
  ], ["physique", "face", "hair", "skin"]),
  stage("wardrobe", "Wardrobe", "Dress and style the subject", [
    { key: "wardrobe", title: "Wardrobe", sections: ["wardrobe"] },
  ], ["wardrobe"]),
  stage("scene", "Pose & Scene", "Compose the photograph and specialty scene details", [
    { key: "pose", title: "Pose & framing", sections: ["pose", "camera"] },
    { key: "scene", title: "Scene & light", sections: ["scene", "lighting", "style"] },
    { key: "specialty", title: "Specialty", sections: ["kink", "watersports"] },
  ], ["pose", "scene", "lighting"]),
  stage("create", "Create", "Review generation settings and render", [], []),
];

const cloneStages = () => BASE_CREATE_STAGES.map((item) => ({
  ...item,
  categories: item.categories.map((category) => ({ ...category, sections: [...category.sections] })),
  sections: [...item.sections],
  simpleSections: [...item.simpleSections],
}));

export function createStagesForStudio(studio = "standard") {
  const stages = cloneStages();
  const profile = studioProfile(studio);
  if (!profile.focusStage || !profile.simpleSections?.length) return stages;

  const focused = stages.find((item) => item.id === profile.focusStage);
  if (!focused) return stages;
  focused.simpleSections = [...profile.simpleSections];
  focused.detail = profile.description;
  focused.hint = profile.description;
  return stages;
}

export const CREATE_STAGES = createStagesForStudio("standard");

// Backward-compatible export: mobile and desktop now consume the same stage objects.
export const CREATE_MOBILE_STEPS = CREATE_STAGES;


export function createStepForSection(sectionKey, steps = CREATE_STAGES) {
  return steps.find((step) => step.sections.includes(sectionKey))?.id || "start";
}

export function createSectionsForStep(stepId, mode = "simple", steps = CREATE_STAGES) {
  const step = steps.find((item) => item.id === stepId);
  if (!step) return [];
  return mode === "advanced" ? step.sections : (step.simpleSections || step.sections);
}
