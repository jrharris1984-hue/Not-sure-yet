"""Verify slider strength reaches both supported sampler graphs."""
import copy
import json
import math
from pathlib import Path
import subprocess
import sys
import unittest

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'backend'))
from body_adjust import body_adjust_denoise, patch_img2img_denoise


class BodyAdjustTests(unittest.TestCase):
    def test_slider_curve_and_frontend_match(self):
        result = subprocess.check_output(['node', '--input-type=module', '-e', '''
          import fs from 'node:fs';
          const source = fs.readFileSync('frontend/src/lib/bodyAdjust.js', 'utf8');
          const mod = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
          console.log(JSON.stringify(Array.from({length: 101}, (_, n) => mod.bodyAdjustDenoise(n))));
          for (const region of ['glutes', 'bust', 'hips', 'thighs', 'waist']) {
            if (!mod.buildBodyAdjustInstruction(region, 100).includes('Enlarge')) throw Error(region);
            if (!mod.buildBodyAdjustInstruction(region, 0).includes('Reduce')) throw Error(region);
            if (mod.buildBodyAdjustInstruction(region, 50).includes('Enlarge')) throw Error(region);
          }
        '''], cwd=ROOT, text=True)
        frontend = json.loads(result)
        self.assertEqual(frontend, [body_adjust_denoise(n) for n in range(101)])
        for amount, expected in [(0, .55), (25, .4), (50, .28), (60, .38), (75, .5), (100, .62)]:
            self.assertEqual(body_adjust_denoise(amount), expected)
        self.assertTrue(all(frontend[n] >= frontend[n+1] for n in range(50)))
        self.assertTrue(all(frontend[n] <= frontend[n+1] for n in range(50, 100)))
        with self.assertRaises(ValueError):
            body_adjust_denoise(math.nan)

    def test_chroma_graph_receives_strength_without_changing_source_or_links(self):
        workflow = json.loads((ROOT / 'backend/seed_workflows/chroma_variation.json').read_text())
        original = copy.deepcopy(workflow)
        self.assertTrue(patch_img2img_denoise(workflow, body_adjust_denoise(100)))
        self.assertEqual(workflow['11']['inputs']['denoise'], .62)
        original['11']['inputs']['denoise'] = .62
        self.assertEqual(workflow, original)
        self.assertEqual(workflow['16']['inputs']['sigmas'], ['11', 1])

    def test_ksampler_and_missing_node(self):
        workflow = {'1': {'class_type': 'KSampler', 'inputs': {'denoise': .3}}}
        self.assertTrue(patch_img2img_denoise(workflow, .62))
        self.assertEqual(workflow['1']['inputs']['denoise'], .62)
        self.assertFalse(patch_img2img_denoise({'1': {'class_type': 'LoadImage', 'inputs': {'image': 'source.png'}}}, .62))


if __name__ == '__main__':
    unittest.main()
