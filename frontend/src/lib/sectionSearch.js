const normalize = (value) => String(value || "").toLowerCase().replace(/[_-]+/g, " ").trim();
const strings = (items = []) => items.filter((item) => typeof item === "string" || typeof item === "number");

export function sectionSearchText(section, context = "") {
  return normalize([
    context, section.title, section.key,
    ...(section.fields || []).flatMap((field) => [
      field.label, field.key, ...strings(field.options),
      ...Object.keys(field.optionLabels || {}), ...strings(Object.values(field.optionLabels || {})),
      ...(field.groups || []).flatMap((group) => [group.name, ...strings(group.options)]),
    ]),
  ].join(" "));
}

export function matchesSection(section, query, context = "") {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  const text = sectionSearchText(section, context);
  return terms.every((term) => text.includes(term));
}
