import {exportCategoryBatch, importCategoryBatch} from './bulkCatalogCategory';
const section = {key:'wardrobe', title:'Wardrobe', fields:[
  {key:'exposure_mode',label:'Coverage',type:'chips',options:[{value:'custom_coverage',label:'Layered',keywords:'layered clothing',short:'layers',group:'Everyday',coverage_mode:'use selected outfit'}]},
  {key:'fabric',label:'Fabric',type:'chips_multi',options:[{value:'cotton',label:'Cotton',keywords:'',group:''}]},
  {key:'length',label:'Length',type:'slider',min:0,max:100,options:[]},
]};
const download = () => exportCategoryBatch(section, () => 'original cotton wording');
test('updates multiple subcategories by identifier while preserving coverage metadata and ranges', () => {
  const batch=download(); batch.category.title='My wardrobe';
  batch.category.fields[0].choices[0].keywords='updated layers';
  batch.category.fields[1].label='Materials'; batch.category.fields[1].choices[0].short_tags='cotton texture';
  const next=importCategoryBatch(JSON.stringify(batch), section);
  expect(next.title).toBe('My wardrobe');
  expect(next.fields[0].options[0]).toMatchObject({keywords:'updated layers',coverage_mode:'use selected outfit',short:'layers'});
  expect(next.fields[1]).toMatchObject({label:'Materials',options:[{short_tags:'cotton texture',keywords:''}]});
  expect(next.fields[2]).toEqual(section.fields[2]);
  expect(section.fields[0].options[0].keywords).toBe('layered clothing');
});
test('unchanged downloads preserve blank automatic mappings and absent compact fields exactly', () => {
  expect(importCategoryBatch(JSON.stringify(download()),section)).toEqual(section);
});
test('rejects another category, missing or duplicate identifiers, and oversized wording', () => {
  let batch=download();batch.category.key='hair';
  expect(() => importCategoryBatch(JSON.stringify(batch),section)).toThrow('same category');
  batch=download();batch.category.fields.pop();
  expect(() => importCategoryBatch(JSON.stringify(batch),section)).toThrow('identifier');
  batch=download();batch.category.fields[1].key='exposure_mode';
  expect(() => importCategoryBatch(JSON.stringify(batch),section)).toThrow('identifier');
  batch=download();batch.category.fields[0].choices[0].short='x'.repeat(501);
  expect(() => importCategoryBatch(JSON.stringify(batch),section)).toThrow('500');
});
