import { parseBulkChoices, mergeBulkChoices, bulkChoiceText } from './bulkCatalogChoices';

test('parses grouped plain text and pasted Markdown without altering prompt wording', () => {
 const text='**Portrait Standing:**\n```\nQuarter turn: body angled 45 degrees, three-quarter view\n```\n\n[Seated]\nSide pose: lateral recline, relaxed侧卧: exact suffix';
 expect(parseBulkChoices(text)).toEqual([
  {label:'Quarter turn',keywords:'body angled 45 degrees, three-quarter view',group:'Portrait Standing'},
  {label:'Side pose',keywords:'lateral recline, relaxed侧卧: exact suffix',group:'Seated'},
 ]);
});
test('updates stable IDs, keeps unrelated choices and adds new entries across category types', () => {
 const options=[{value:'jet black',label:'Black',keywords:'old',group:'Dark'}, {value:'custom_old',label:'Silver',keywords:'keep',group:'Light'}];
 const before=JSON.stringify(options);
 const result=mergeBulkChoices(options,parseBulkChoices('Black: natural black hair\nCopper: warm copper hair'),()=> 'custom_copper');
 expect(result.options).toEqual([
  {value:'jet black',label:'Black',keywords:'natural black hair',group:'Dark'},
  options[1], {value:'custom_copper',label:'Copper',keywords:'warm copper hair',group:''},
 ]);
 expect(result.changes.map(change=>change.type)).toEqual(['update','add']);
 expect(JSON.stringify(options)).toBe(before);
 expect(mergeBulkChoices(options,parseBulkChoices('jet black: exact new wording')).options[0].label).toBe('Black');
});
test('rejects malformed batches, duplicate or ambiguous names, and oversized lists atomically', () => {
 expect(()=>parseBulkChoices('Bad line')).toThrow('Line 1');
 expect(()=>parseBulkChoices('Blue: first\nBLUE: second')).toThrow('duplicate');
 expect(()=>parseBulkChoices('Name: '+ 'x'.repeat(1501))).toThrow('1,500');
 expect(()=>mergeBulkChoices([{value:'a',label:'Same'},{value:'b',label:'Same'}],parseBulkChoices('Same: words'))).toThrow('multiple choices');
 expect(()=>mergeBulkChoices([{value:'a',label:'Same'}],parseBulkChoices('a: first\nSame: second'))).toThrow('Multiple lines');
 expect(()=>mergeBulkChoices(Array.from({length:300},(_,i)=>({value:String(i),label:String(i)})),parseBulkChoices('New: words'))).toThrow('300');
});
test('exports and reimports multiple entries with groups and original keywords', () => {
 const options=[{value:'first',label:'First',group:'One',keywords:'exact first'}, {value:'second',label:'Second',group:'',keywords:''}];
 const text=bulkChoiceText(options,()=> 'default second');
 const result=mergeBulkChoices(options,parseBulkChoices(text));
 expect(result.changes.every(change=>change.type==='update')).toBe(true);
 expect(result.options.map(option=>option.keywords)).toEqual(['exact first','default second']);
 expect(result.options.map(option=>option.group)).toEqual(['One','']);
});
