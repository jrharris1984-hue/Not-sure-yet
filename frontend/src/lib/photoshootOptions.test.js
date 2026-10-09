import { parsePhotoshootImport, photoshootPresetForExport } from './bulkPhotoshootImport';
import { buildSmartPhotoshootPlan, smartPhotoshootVariation, photoshootPresetFromPlan, photoshootCatalog, CUSTOM_CAMERA_OPTIONS, CUSTOM_EXPRESSION_OPTIONS } from './batchSmartPhotoshoot';
import { expandPrompt } from './promptMap';

test.each(['smoldering', 'playful'])('import, plan, apply, and saved snapshot retain %s and foot-level camera', expression => {
  const customPresets = parsePhotoshootImport(JSON.stringify([{ key: 'custom_portrait', label: 'Portrait', sequence: [
    { title: 'Hero', pose_group: 'portrait standing', camera_match: 'foot level', framing: 'full body', expression },
  ] }]));
  const subjects = [{ dna: { pose: {}, camera: {}, face: {} } }];
  const plan = buildSmartPhotoshootPlan({ count: 1, preset: 'custom_portrait', customPresets, subjects, options: { expression: true } });
  expect(plan[0].camera.cameraAngle).toBe('foot level');
  const result = smartPhotoshootVariation({ subjects, plan, options: { expression: true } });
  expect(result.subjects[0].dna.camera.angle).toBe('foot level');
  expect(result.subjects[0].dna.face.expression).toBe(expression);
  const snapshot = { ...photoshootPresetFromPlan(plan, 'Saved portrait'), key: 'custom_snapshot' };
  const saved = parsePhotoshootImport(JSON.stringify([snapshot]));
  const exported = photoshootPresetForExport(photoshootCatalog(saved).presets.custom_snapshot);
  expect(exported.sequence[0]).toMatchObject({ expression, camera_angle: 'foot level' });
  expect(CUSTOM_EXPRESSION_OPTIONS).toContain(expression);
  expect(CUSTOM_CAMERA_OPTIONS.map(item => item[0])).toContain('foot level');
  expect(expandPrompt('face', 'expression', expression)).toContain('expression');
  expect(expandPrompt('camera', 'angle', 'foot level')).toContain('near the ground');
});

test('subtle camera strength keeps eye-level coverage and camera-off preserves the existing view', () => {
  const customPresets = [{ key: 'custom_camera', label: 'Camera', sequence: [{ title: 'Hero', camera_match: 'foot level' }] }];
  const args = { count: 1, preset: 'custom_camera', customPresets };
  expect(buildSmartPhotoshootPlan({ ...args, strength: 'subtle' })[0].camera.cameraAngle).toBe('eye-level');
  expect(buildSmartPhotoshootPlan({ ...args, options: { camera: false } })[0].camera).toBeNull();
});
