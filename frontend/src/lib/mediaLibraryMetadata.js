// Accept structured analyzer metadata only. Captions are not reliable person counts.
function object(value) {
  if (typeof value === "string") {
    try { value = JSON.parse(value); } catch { return {}; }
  }
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

const fields = {
  gender: ["gender"],
  description: ["search_description", "subject_description", "description"],
  bodyBuild: ["body_build"], bodyProportions: ["body_proportions"],
  physicalAppearance: ["physical_appearance"], hairColor: ["hair_color"],
  hairLength: ["hair_length"], hairStyle: ["hair_style"],
  expression: ["facial_expression"], wardrobe: ["wardrobe_details"],
  pose: ["pose"], orientation: ["body_orientation"], framing: ["framing"],
  cameraAngle: ["camera_angle"], cameraDistance: ["camera_distance"],
  composition: ["composition"], lighting: ["lighting"], background: ["background"],
  environment: ["environment"], photographicStyle: ["photographic_style"],
};

function traits(record) {
  const result = {};
  for (const [key, aliases] of Object.entries(fields)) {
    const value = [key, ...aliases].map((name) => record[name]).find((entry) => typeof entry === "string" && entry.trim());
    if (value) result[key] = value;
  }
  return result;
}

export function mediaPeopleMetadata(item = {}) {
  const metadata = { ...object(item.analysis_json), ...object(item.analysis), ...object(item.metadata), ...item };
  const raw = [metadata.people, metadata.persons, metadata.subjects].map((value) => {
    if (typeof value === "string") { try { return JSON.parse(value); } catch { return null; } }
    return value;
  }).find(Array.isArray) || [];
  const people = raw.filter((entry) => entry && typeof entry === "object" && !Array.isArray(entry)).map(traits);
  const count = [metadata.person_count, metadata.people_count, metadata.subject_count, metadata.num_people, metadata.number_of_people]
    .map((value) => typeof value === "number" || (typeof value === "string" && /^\d+$/.test(value.trim())) ? Number(value) : NaN)
    .find((value) => Number.isInteger(value) && value >= 0);
  return { personCount: count ?? (people.length || null), people, ...traits(metadata) };
}

export function mediaLibraryTraits(item = {}, selectedCount) {
  const metadata = mediaPeopleMetadata(item);
  const requested = Number(selectedCount ?? metadata.personCount ?? 1);
  const personCount = Number.isInteger(requested) ? Math.min(4, Math.max(1, requested)) : 1;
  return {
    ...metadata, personCount, mediaId: item.id, sourceName: item.file_name,
    generalTags: Array.isArray(item.general_tags) ? item.general_tags : [],
  };
}
