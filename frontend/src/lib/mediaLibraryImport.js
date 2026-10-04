import { DEFAULT_DNA, SECTIONS, MAX_SUBJECTS, makeSubject, subjectLabel, SHARED_SECTIONS } from "./dna";

export function mapMediaTraits(incoming = {}) {
    const next = JSON.parse(JSON.stringify(DEFAULT_DNA));
    const notes = [];
    const lower = (value) => String(value || "").toLowerCase();

    // Only map values that match existing Studio choices exactly or safely.
    const hairColorOptions = SECTIONS.find(s=>s.key==="hair")?.fields.find(f=>f.key==="color")?.groups?.flatMap(g=>g.options) || [];
    const hairLengthOptions = SECTIONS.find(s=>s.key==="hair")?.fields.find(f=>f.key==="length")?.options || [];
    const hairStyleOptions = SECTIONS.find(s=>s.key==="hair")?.fields.find(f=>f.key==="style")?.groups?.flatMap(g=>g.options) || [];
    const bodyOptions = SECTIONS.find(s=>s.key==="physique")?.fields.find(f=>f.key==="body_type")?.options || [];
    const poseOptions = SECTIONS.find(s=>s.key==="pose")?.fields.find(f=>f.key==="action")?.groups?.flatMap(g=>g.options) || [];
    const framingOptions = SECTIONS.find(s=>s.key==="pose")?.fields.find(f=>f.key==="distance")?.options || [];
    const angleOptions = SECTIONS.find(s=>s.key==="pose")?.fields.find(f=>f.key==="angle")?.options || [];
    const envOptions = SECTIONS.find(s=>s.key==="scene")?.fields.find(f=>f.key==="environment")?.options || [];
    const styleOptions = SECTIONS.find(s=>s.key==="style")?.fields.find(f=>f.key==="render")?.options || [];

    const exact = (value, options) => options.find(o => lower(o) === lower(value)) || "";
    const containsOption = (value, options) => {
      const text = lower(value);
      if (!text) return "";
      return options
        .filter(Boolean)
        .sort((a,b)=>b.length-a.length)
        .find(o => text.includes(lower(o))) || "";
    };
    const alias = (value, pairs, options=[]) => {
      const text = lower(value);
      const hit = pairs.find(([needle]) => text.includes(needle));
      return hit ? hit[1] : containsOption(value, options);
    };
    const mapped = [];
    const map = (label, section, key, value) => {
      if (!value) return;
      next[section][key] = value;
      mapped.push({ label, value });
    };
    const hasMapped = (...labels) => labels.some((label) => mapped.some((item) => item.label === label));
    const addReferenceNote = (label, value, ownedBy = []) => {
      if (!value || (ownedBy.length && hasMapped(...ownedBy))) return;
      notes.push(`${label}: ${value}`);
    };

    map("Gender", "identity", "gender", exact(incoming.gender, ["female", "male"]));

    map("Hair color", "hair", "color", exact(incoming.hairColor, hairColorOptions) ||
      alias(incoming.hairColor, [["dark","dark chocolate"],["brown","chestnut"],["black","jet black"],["blonde","golden blonde"],["red","auburn"],["gray","steel gray"],["grey","steel gray"]], hairColorOptions));
    map("Hair length", "hair", "length", exact(incoming.hairLength, hairLengthOptions) ||
      alias(incoming.hairLength, [["very long","waist-length"],["long","long"],["shoulder","shoulder"],["short","short bob"]], hairLengthOptions));
    map("Hair style", "hair", "style", exact(incoming.hairStyle, hairStyleOptions) || containsOption(incoming.hairStyle, hairStyleOptions));
    map("Body type", "physique", "body_type", exact(incoming.bodyBuild, bodyOptions) ||
      alias(incoming.bodyBuild, [["hourglass","hourglass"],["curvy","curvy"],["voluptuous","voluptuous"],["athletic","athletic"],["slim","slim"],["plus","plus size"]], bodyOptions));
    map("Pose", "pose", "action", exact(incoming.pose, poseOptions) ||
      alias(incoming.pose, [["kneeling","kneeling upright"],["bending over","bending over"],["lying","lying back"],["sitting","sitting on edge"],["standing","standing"],["walking","walking"]], poseOptions));
    map("Framing", "pose", "distance", exact(incoming.framing || incoming.cameraDistance, framingOptions) ||
      alias(incoming.framing || incoming.cameraDistance, [["close","close-up"],["medium","waist-up"],["full","full body"],["wide","wide shot"],["portrait","portrait"]], framingOptions));
    map("Camera angle", "pose", "angle", exact(incoming.cameraAngle || incoming.orientation, angleOptions) ||
      alias(incoming.cameraAngle || incoming.orientation, [["back","back"],["rear","back"],["profile","profile"],["side","profile"],["over-shoulder","over-shoulder"],["above","from above"],["below","from below"],["front","front"]], angleOptions));
    map("Environment", "scene", "environment", exact(incoming.environment, envOptions) ||
      alias(incoming.environment, [["bedroom","bedroom"],["studio","studio"],["beach","beach"],["forest","forest"],["rooftop","rooftop"],["warehouse","warehouse"],["desert","desert"],["alley","neon alley"],["castle","castle"],["street","urban street"]], envOptions));
    map("Photo style", "style", "render", exact(incoming.photographicStyle, styleOptions) ||
      alias(incoming.photographicStyle, [["cinematic","cinematic"],["editorial","editorial"],["documentary","documentary"],["analog","analog film"],["35mm","35mm film"],["photo","photorealistic"],["selfie","photorealistic"]], styleOptions));

    const expressionOptions = SECTIONS.find(s=>s.key==="face")?.fields.find(f=>f.key==="expression")?.options || [];
    const wardrobeSection = SECTIONS.find(s=>s.key==="wardrobe");
    const outfitOptions = wardrobeSection?.fields.find(f=>f.key==="outfit_preset")?.groups?.flatMap(g=>g.options) || wardrobeSection?.fields.find(f=>f.key==="outfit_preset")?.options || [];
    const garmentColors = wardrobeSection?.fields.find(f=>f.key==="garment_color")?.groups?.flatMap(g=>g.options) || [];
    const materialOptions = wardrobeSection?.fields.find(f=>f.key==="material")?.options || [];
    const fitOptions = wardrobeSection?.fields.find(f=>f.key==="fit")?.options || [];
    const lightSourceOptions = SECTIONS.find(s=>s.key==="lighting")?.fields.find(f=>f.key==="source")?.options || [];
    const lightStyleOptions = SECTIONS.find(s=>s.key==="lighting")?.fields.find(f=>f.key==="style")?.options || [];
    const lightMoodOptions = SECTIONS.find(s=>s.key==="lighting")?.fields.find(f=>f.key==="mood")?.options || [];
    const cameraAngleOptions = SECTIONS.find(s=>s.key==="camera")?.fields.find(f=>f.key==="angle")?.options || [];
    const focusOptions = SECTIONS.find(s=>s.key==="pose")?.fields.find(f=>f.key==="focus")?.options || [];

    map("Expression", "face", "expression", exact(incoming.expression, expressionOptions) || containsOption(incoming.expression, expressionOptions));
    map("Outfit", "wardrobe", "outfit_preset", containsOption(incoming.wardrobe, outfitOptions));
    map("Outfit color", "wardrobe", "garment_color", containsOption(incoming.wardrobe, garmentColors));
    map("Material", "wardrobe", "material", containsOption(incoming.wardrobe, materialOptions));
    map("Fit", "wardrobe", "fit", containsOption(incoming.wardrobe, fitOptions));
    map("Lighting source", "lighting", "source", containsOption(incoming.lighting, lightSourceOptions));
    map("Lighting style", "lighting", "style", containsOption(incoming.lighting, lightStyleOptions));
    map("Lighting mood", "lighting", "mood", containsOption(incoming.lighting, lightMoodOptions));
    map("Camera", "camera", "angle", alias(incoming.cameraAngle, [["eye-level","eye-level"],["low angle","low"],["high angle","high"],["dutch","dutch"],["bird","birds-eye"]], cameraAngleOptions));
    map("Composition focus", "pose", "focus", alias(incoming.composition, [["face","face"],["full body","full frame"],["body","body"],["hip","hips"],["leg","legs"],["feet","feet"],["hand","hands"]], focusOptions));

    const proportionsText = lower([incoming.bodyBuild, incoming.bodyProportions, incoming.physicalAppearance].filter(Boolean).join(" "));
    const sizeMap = (words) => words.find(([word])=>proportionsText.includes(word))?.[1] || "";
    map("Bust", "physique", "bust", sizeMap([["very large bust","very large"],["large bust","large"],["medium bust","medium"],["small bust","small"]]));
    map("Glutes", "physique", "butt", sizeMap([["very large butt","very large"],["large butt","large"],["prominent butt","large"],["large glute","large"],["round butt","round"]]));
    map("Hips", "physique", "hips", sizeMap([["very wide hip","very wide"],["wide hip","wide"],["narrow hip","narrow"]]));
    map("Thighs", "physique", "thighs", sizeMap([["very thick thigh","very thick"],["thick thigh","thick"],["athletic thigh","athletic"],["slim thigh","slim"]]));
    map("Waist", "physique", "waist", sizeMap([["tiny waist","tiny"],["cinched waist","cinched"],["slim waist","slim"],["thick waist","thick"]]));
    // Preserve only observations that were not already mapped into authoritative
    // Studio controls. This prevents imported reference metadata from being
    // appended later as a second, contradictory instruction block.
    addReferenceNote("Appearance", incoming.physicalAppearance);
    addReferenceNote("Build", incoming.bodyBuild, ["Body type"]);
    addReferenceNote("Proportions", incoming.bodyProportions, ["Bust", "Glutes", "Hips", "Thighs", "Waist"]);
    addReferenceNote("Hair", [incoming.hairColor, incoming.hairLength, incoming.hairStyle].filter(Boolean).join(", "),
      ["Hair color", "Hair length", "Hair style"]);
    addReferenceNote("Expression", incoming.expression, ["Expression"]);
    addReferenceNote("Wardrobe", incoming.wardrobe, ["Outfit", "Outfit color", "Material", "Fit"]);
    addReferenceNote("Pose", incoming.pose, ["Pose"]);
    addReferenceNote("Body orientation", incoming.orientation, ["Camera angle", "Camera"]);
    addReferenceNote("Framing", incoming.framing, ["Framing"]);
    addReferenceNote("Camera angle", incoming.cameraAngle, ["Camera angle", "Camera"]);
    addReferenceNote("Composition", incoming.composition, ["Composition focus"]);
    addReferenceNote("Lighting", incoming.lighting, ["Lighting source", "Lighting style", "Lighting mood"]);
    addReferenceNote("Environment", incoming.environment, ["Environment"]);
    addReferenceNote("Background", incoming.background);
    addReferenceNote("Interaction", incoming.interaction);
    addReferenceNote("Mirror reflection", incoming.mirrorReflection);
    addReferenceNote("Photo style", incoming.photographicStyle, ["Photo style"]);

    next.physique.proportions = incoming.bodyProportions || "";
    next.scene.background = [incoming.environment, incoming.background].filter(Boolean).join(". ");
    next.style.extra = [incoming.photographicStyle, incoming.composition, incoming.confirmedDescription, incoming.interaction, Array.isArray(incoming.detailTags) ? incoming.detailTags.join(", ") : "", incoming.mirrorReflection === "yes" ? "mirror reflections of existing subjects; reflections do not add people" : ""].filter(Boolean).join(", ");

    return { dna: next, mapped, notes };
}

export function buildMediaSubjects(incoming = {}) {
  const count = Math.min(MAX_SUBJECTS, Math.max(1, Math.floor(Number(incoming.personCount)) || 1));
  const records = Array.isArray(incoming.people) ? incoming.people : [];
  // Flat appearance fields describe one person only; never clone them across a cast.
  const shared = mapMediaTraits(incoming);
  const results = Array.from({ length: count }, (_, index) => {
    const person = records[index] || (count === 1 ? incoming : {});
    const result = mapMediaTraits(person);
    for (const key of SHARED_SECTIONS) result.dna[key] = JSON.parse(JSON.stringify(shared.dna[key]));
    result.dna.pose.distance = shared.dna.pose.distance;
    result.dna.scenario.cast_size = ["solo", "duo", "trio", "group"][count - 1];
    result.dna.scenario.cast_type = "none";
    return { ...result, subject: makeSubject({ label: subjectLabel(index), dna: result.dna }) };
  });
  const mapped = results.flatMap((result) => result.mapped.map((item) => ({ ...item, label: count > 1 ? `${result.subject.label}: ${item.label}` : item.label })));
  const notes = results.flatMap((result) => result.notes.map((note) => count > 1 ? `Subject ${result.subject.label} — ${note}` : note));
  if (count > 1) notes.push(`Cast: ${count} people. Review each subject's appearance before rendering.`);
  return { subjects: results.map((result) => result.subject), mapped, notes };
}
