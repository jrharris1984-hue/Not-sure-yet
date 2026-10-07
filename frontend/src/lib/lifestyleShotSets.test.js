import { lifestyleSetShots, lifestyleFrameControls } from './lifestyleShotSets';
import { shootFrameDna } from './shootFrames';
import { compileModelPrompts } from './modelPromptCompilers';

test('reviewed sets have deterministic views and independent frame wardrobes', () => {
  const shots = [...lifestyleSetShots('views'), ...lifestyleSetShots('chair', 'tailored pantsuit')];
  expect(shots.slice(0, 4).map(shot => shot.view)).toEqual(['front', '3/4', 'profile', 'back']);
  expect(shots).toHaveLength(7);
  expect(shots[4].outfit).toBe('tailored pantsuit');
  expect(lifestyleSetShots('unknown')).toEqual([]);
  const base = { identity: { age: 72 }, pose: { action: 'walking', angle: 'front', focus: 'face', hands: 'on hips' },
    camera: { angle: 'high', lens: '50mm' }, scene: { environment: 'studio' }, wardrobe: { outfit_preset: 'streetwear' } };
  const shot = lifestyleFrameControls(shots[3]);
  const dna = shootFrameDna(base, { poseAction: shot.pose_action, poseOverrides: shot.pose_overrides,
    cameraOverrides: shot.camera_overrides, outfitPreset: shot.outfit_overrides.outfit_preset });
  expect(dna.pose.angle).toBe('back');
  expect(dna.pose.focus).toBe('full frame');
  expect(dna.pose.hands).toBe('');
  expect(dna.camera).toEqual({ angle: 'eye-level', lens: '50mm' });
  expect(dna.identity).toEqual(base.identity);
  expect(dna.scene).toEqual(base.scene);
  expect(base.pose.hands).toBe('on hips');
});

test('couch and bed directions accompany a neutral seated pose', () => {
  for (const key of ['chair', 'couch', 'bed']) {
    const frame = lifestyleFrameControls(lifestyleSetShots(key)[0]);
    expect(frame.scene_direction).toContain(key);
    expect(frame.pose_action).toBe('seated hands folded in lap');
    expect(frame.outfit_overrides.outfit_preset).toBe('streetwear');
  }
});

test('compiled rear shots keep the requested view without saved face focus', () => {
  const shot = lifestyleFrameControls(lifestyleSetShots('views')[3]);
  const dna = shootFrameDna({ identity: { age: 72, gender: 'female' }, pose: { focus: 'face', angle: 'front' } }, {
    poseAction: shot.pose_action, poseOverrides: shot.pose_overrides, cameraOverrides: shot.camera_overrides,
    outfitPreset: shot.outfit_overrides.outfit_preset,
  });
  for (const promptStyle of ['chroma', 'krea2', 'qwen_rapid']) {
    const { positive } = compileModelPrompts({ dna, promptStyle, workflowKind: 'image' });
    expect(positive).toMatch(/back|rear/i);
    expect(positive).not.toContain('face clearly visible');
  }
});
