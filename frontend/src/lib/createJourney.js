export const CREATE_STAGES = [
  { key: "identity", title: "Design", detail: "Choose your subject", categories: [
    { key: "identity", title: "People", sections: ["identity", "scenario"] },
    { key: "physique", title: "Body", sections: ["physique", "feet", "intimate"] },
    { key: "face", title: "Appearance", sections: ["face", "hair", "skin"] },
    { key: "wardrobe", title: "Wardrobe", sections: ["wardrobe"] },
  ] },
  { key: "pose", title: "Compose", detail: "Arrange the photograph", categories: [
    { key: "pose", title: "Pose & framing", sections: ["pose", "camera"] },
    { key: "scene", title: "Scene", sections: ["scene"] },
    { key: "lighting", title: "Lighting & style", sections: ["lighting", "style"] },
    { key: "kink", title: "Scene details", sections: ["kink", "watersports"] },
  ] },
  { key: "review", title: "Generate", detail: "Review and create", categories: [] },
].map((stage) => ({ ...stage, sections: stage.categories.flatMap((category) => category.sections) }));

// Keep the existing mobile step IDs for route and draft compatibility.
export const CREATE_MOBILE_STEPS = CREATE_STAGES.map((stage, index) => ({
  id: ["start", "scene", "create"][index], label: stage.title,
  shortLabel: stage.title, hint: stage.detail,
  sections: stage.sections, simpleSections: stage.sections,
}));
