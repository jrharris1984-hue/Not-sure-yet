// Shared registry avoids a dependency cycle between catalog translation and
// wardrobe control resolution. Explicit compiler catalogs never change it.
import {SIMPLE_COVERAGE_OPTIONS} from './simpleCoverage';
let catalog = {sections:[]};
export const setCoverageCatalog = value => {catalog=value;};
export const getCoverageCatalog = () => catalog;
export function coverageOption(value, config=catalog) {
  const field = config?.sections?.find(section=>section.key==='wardrobe')?.fields?.find(field=>field.key==='exposure_mode');
  return (field?.options || SIMPLE_COVERAGE_OPTIONS).find(option=>option.value===value);
}
