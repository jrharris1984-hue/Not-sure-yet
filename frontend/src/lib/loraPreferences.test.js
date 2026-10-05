import {readLoraPreferences, saveLoraPreference, loraFileKey} from './loraPreferences';
import {compatibleInstalledLoras} from './loraRegistry';
beforeEach(() => localStorage.clear());
test('saved triggers and family share a normalized path key and can be cleared', () => {
  expect(saveLoraPreference('Qwen\\Portrait.safetensors',{family:'qwen_image'})).toBe(true);
  expect(saveLoraPreference('qwen/portrait.safetensors',{triggerWords:['portrait style']})).toBe(true);
  expect(readLoraPreferences()[loraFileKey('QWEN/Portrait.safetensors')]).toEqual({family:'qwen_image',triggerWords:['portrait style']});
  saveLoraPreference('qwen/portrait.safetensors',{triggerWords:[]});
  expect(readLoraPreferences()['qwen/portrait.safetensors'].triggerWords).toEqual([]);
});
test('an explicit training family overrides ambiguous filename detection, without showing in another family', () => {
  const name='Qwen/portrait.safetensors';
  saveLoraPreference(name,{family:'qwen_image',triggerWords:['portrait style']});
  const prefs=readLoraPreferences();
  expect(compatibleInstalledLoras({prompt_style:'qwen_image'},[name],prefs)[0].triggerWords).toEqual(['portrait style']);
  expect(compatibleInstalledLoras({name:'Qwen Edit',prompt_style:'qwen_edit'},[name],prefs)).toEqual([]);
});
test('storage errors are reported and malformed data is ignored', () => {
  localStorage.setItem('ultra-studio:lora-preferences:v1','broken json');
  expect(readLoraPreferences()).toEqual({});
  const spy=jest.spyOn(Storage.prototype,'setItem').mockImplementation(() => {throw new Error('unavailable');});
  expect(saveLoraPreference('portrait.safetensors',{triggerWords:['portrait']})).toBe(false);
  spy.mockRestore();
});
