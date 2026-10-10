// Shared registry avoids a dependency cycle between catalog translation and
// wardrobe control resolution. Explicit compiler catalogs never change it.
let catalog = {sections:[]};
export const setCoverageCatalog = value => {catalog=value;};
export const getCoverageCatalog = () => catalog;
export function coverageOption(value, config=catalog) {
  return config?.sections?.find(section=>section.key==='wardrobe')?.fields?.find(field=>field.key==='exposure_mode')?.options?.find(option=>option.value===value);
}
