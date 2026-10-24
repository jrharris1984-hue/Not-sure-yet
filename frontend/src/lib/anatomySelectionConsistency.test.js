import { anatomySelectionReview, selectAnatomyPreset, cleanUpAnatomySelections, normalizeAnatomyDetails } from './anatomyDetailControls';
const catalog = {sections:[]};
test('selecting a recognized preset updates dimensions and clears its duplicate instruction', () => {
  const source = {areolas:'medium pink', areola_size:'small areolas'};
  const result = selectAnatomyPreset(source, 'areolas', 'large brown', catalog);
  expect(result).toEqual({areolas:'',areola_size:'wide areolas',areola_color:'warm brown areolas'});
  expect(source.areolas).toBe('medium pink');
});
test('preset application respects field locks and keeps unrelated selections', () => {
  const source = {areola_size:'small areolas', custom_note:'keep'};
  expect(selectAnatomyPreset(source,'areolas','large brown',catalog,{areola_size:true})).toMatchObject({areola_size:'small areolas',areola_color:'warm brown areolas',custom_note:'keep'});
  expect(selectAnatomyPreset(source,'areolas','large brown',catalog,{areolas:true})).toBe(source);
});
test('review reports overlap without changing saved data; cleanup matches existing effective choices', () => {
  const source = {areolas:'large brown',areola_size:'small areolas'};
  expect(anatomySelectionReview(source,catalog)[0].conflicts).toEqual(['areola_size']);
  expect(source.areolas).toBe('large brown');
  const cleaned = cleanUpAnatomySelections(source,catalog);
  expect(cleaned).toEqual(normalizeAnatomyDetails({intimate:source},catalog).intimate);
  expect(cleanUpAnatomySelections(cleaned,catalog)).toEqual(cleaned);
});
test('locked overlaps remain unchanged until explicitly unlocked', () => {
  const source = {areolas:'large brown',areola_size:'small areolas'};
  expect(cleanUpAnatomySelections(source,catalog,{areola_size:true})).toEqual(source);
});
test('unknown and customized presets are never reinterpreted or removed', () => {
  const custom = {sections:[{key:'intimate',fields:[{key:'areolas',options:[{value:'large brown',keywords:'authored wording'}]}]}]};
  expect(selectAnatomyPreset({},'areolas','large brown',custom)).toEqual({areolas:'large brown'});
  expect(anatomySelectionReview({areolas:'large brown'},custom)).toEqual([]);
  expect(cleanUpAnatomySelections({areolas:'custom'},catalog)).toEqual({areolas:'custom'});
});
