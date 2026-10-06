// Display placement changes must not migrate saved DNA fields.
export function builderSectionLayout(sections) {
  const intensity = sections.find(section => section.key === 'scenario')?.fields.find(field => field.key === 'explicit_level');
  if (!intensity || !sections.some(section => section.key === 'pose')) return sections;
  return sections.map(section => section.key === 'scenario'
    ? { ...section, fields: section.fields.filter(field => field.key !== 'explicit_level') }
    : section.key === 'pose' ? { ...section, title: 'Pose & Framing', fields: [...section.fields.filter(field => field.key !== 'explicit_level'), intensity] } : section);
}
export function builderSectionValue(section, dna, primary = dna) {
  return section === 'pose' ? { ...dna.pose, explicit_level: primary.scenario?.explicit_level ?? 0 }
    : (section === 'scenario' ? primary : dna)[section] || {};
}
export function builderSectionChange(section, value, primary) {
  if (section !== 'pose') return { section, value };
  const { explicit_level, ...pose } = value;
  if (explicit_level !== (primary.scenario?.explicit_level ?? 0)) {
    return { section: 'scenario', value: { ...primary.scenario, explicit_level } };
  }
  return { section: 'pose', value: pose };
}
