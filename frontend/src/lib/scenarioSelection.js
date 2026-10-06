// An explicit cast-size change owns the number of people; stale pairings must not override Solo.
export function applyScenarioSelection(subjects, requested) {
  if (!subjects.length) return subjects;
  const previous = subjects[0].dna.scenario || {};
  const scenario = { ...requested };
  const sizeChanged = scenario.cast_size !== previous.cast_size;
  if (sizeChanged && (!scenario.cast_size || scenario.cast_size === 'solo')) {
    scenario.cast_size = 'solo';
    scenario.cast_type = 'none';
  } else if (sizeChanged && scenario.cast_size === 'duo' && ['triplets', 'grandmother, mother and daughter'].includes(scenario.cast_type)) {
    scenario.cast_type = 'none';
  } else if (scenario.cast_type !== previous.cast_type && scenario.cast_type && scenario.cast_type !== 'none') {
    scenario.cast_size = ['triplets', 'grandmother, mother and daughter'].includes(scenario.cast_type) ? 'trio' : 'duo';
  }
  const next = subjects.map((subject, index) => index === 0
    ? { ...subject, dna: { ...subject.dna, scenario } } : subject);
  return sizeChanged && scenario.cast_size === 'solo' ? next.slice(0, 1) : next;
}
