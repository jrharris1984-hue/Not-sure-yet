import choices from './simpleCoverageChoices.json';

export function simpleCoverageOptions(previous = []) {
  return choices.map(([label, keywords, coverage_mode, aliases]) => {
    const saved = previous.find(option => [label, ...aliases].includes(option.label.toLowerCase()));
    return {value: saved?.value?.startsWith('custom_') ? saved.value : `custom_coverage_${label.replace(/[^a-z0-9]+/g, '_')}`,
      label, keywords, short: keywords, short_tags: keywords, coverage_mode, group: ''};
  });
}
export const SIMPLE_COVERAGE_OPTIONS = simpleCoverageOptions();
