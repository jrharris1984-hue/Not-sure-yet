import { VIDEO_LIBRARY, VIDEO_PRESETS, videoDefaults, videoOptions, composeVideoPrompt } from './videoPromptLibrary';
test('ships broad motion and camera categories and reusable presets',()=>{
  expect(Object.keys(VIDEO_LIBRARY).length).toBeGreaterThanOrEqual(10);
  expect(VIDEO_LIBRARY.motion.choices.length).toBeGreaterThan(8);
  expect(VIDEO_PRESETS.length).toBeGreaterThan(4);
});
test('keeps built-in choices when user adds a saved choice',()=>{
  const config={sections:[{key:'video_motion',fields:[{key:'choices',options:[{value:'custom_wave',label:'Custom wave',keywords:'waves naturally'}]}]}]};
  expect(videoOptions(config,'motion').some(item=>item.value==='walk')).toBe(true);
  expect(videoOptions(config,'motion').some(item=>item.value==='custom_wave')).toBe(true);
});
test('image-to-video avoids injecting scene details and preserves image',()=>{
  const prompt=composeVideoPrompt({mode:'video',scene:'A different person',selected:videoDefaults(),catalog:{sections:[]},intensity:'natural'});
  expect(prompt).toContain('Animate the provided image');
  expect(prompt).toContain('Keep the starting image');
  expect(prompt).not.toContain('A different person');
});
test('text-to-video uses the scene and ordered actions',()=>{
  const prompt=composeVideoPrompt({mode:'text_video',scene:'A rainy street',steps:['looks left','walks away'],selected:videoDefaults(),catalog:{sections:[]},intensity:'subtle'});
  expect(prompt).toContain('A rainy street');
  expect(prompt).toContain('1. looks left; 2. walks away');
});
