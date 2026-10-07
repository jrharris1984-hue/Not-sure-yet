import { batchCameraVariation, CAMERA_VARIATIONS } from "./batchCameraVariation";

const subject = () => ({
  id: "a",
  label: "A",
  dna: {
    pose: { action: "standing", angle: "front", distance: "full body" },
    camera: { angle: "eye-level", lens: "50mm", aperture: "f/2.8" },
  },
});

test("camera variety changes viewpoint without changing framing or lens", () => {
  const first = batchCameraVariation({ subjects: [subject()], index: 0, seed: 3 });
  const second = batchCameraVariation({ subjects: [subject()], index: 1, seed: 3 });

  expect(first.camera).not.toBeNull();
  expect(second.camera).not.toBeNull();
  expect(first.camera.label).not.toBe(second.camera.label);
  expect(first.subjects[0].dna.pose.distance).toBe("full body");
  expect(first.subjects[0].dna.camera.lens).toBe("50mm");
  expect(first.subjects[0].dna.camera.aperture).toBe("f/2.8");
});

test("camera variety avoids the currently selected camera combination", () => {
  const result = batchCameraVariation({ subjects: [subject()], index: 0, seed: 0 });
  expect(result.camera.poseAngle === "front" && result.camera.cameraAngle === "eye-level").toBe(false);
});

test("camera variation pool only uses supported pose and camera values", () => {
  const poseAngles = new Set(["front", "3/4", "profile", "back", "over-shoulder", "from above", "from below", "pov"]);
  const cameraAngles = new Set(["eye-level", "low", "high", "dutch", "birds-eye"]);
  expect(CAMERA_VARIATIONS.every(item => poseAngles.has(item.poseAngle) && cameraAngles.has(item.cameraAngle))).toBe(true);
});
