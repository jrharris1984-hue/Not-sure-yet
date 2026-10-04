import { act } from "react";
import { createRoot } from "react-dom/client";
import PoseIcon from "./PoseIcon";
import { mannequinPose, MANNEQUIN_POSE_NAMES } from "@/lib/mannequinPoses";
import { SECTIONS } from "@/lib/dna";

test("every selectable body pose has an explicit articulated mannequin", () => {
  const field = SECTIONS.find((section) => section.key === "pose").fields.find((item) => item.key === "action");
  const names = field.groups.flatMap((group) => group.options);
  for (const name of names) {
    expect(MANNEQUIN_POSE_NAMES).toContain(name);
    const pose = mannequinPose(name);
    expect(pose.fallback).toBe(false);
    for (const part of [pose.leftArm, pose.rightArm, pose.leftLeg, pose.rightLeg]) {
      expect(part).toHaveLength(3);
      expect(part.flat().every(Number.isFinite)).toBe(true);
    }
  }
});

test("standing, seated, kneeling, and lying guides differ without changing saved labels", () => {
  const guides = ["standing", "seated hands folded in lap", "kneeling upright", "lying back"].map(mannequinPose);
  expect(new Set(guides.map((pose) => JSON.stringify(pose))).size).toBe(4);
  expect(guides[1].support).toBeDefined();
  expect(guides[2].leftLeg[1][1]).toBe(guides[2].leftLeg[2][1]);
});

test("renders local SVG meshes with distinct gradient IDs and retains foot guides", () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement("div");
  const root = createRoot(container);
  act(() => root.render(<><PoseIcon name="standing quarter turn" /><PoseIcon name="standing quarter turn" active /><PoseIcon name="soles up" /></>));
  expect(container.querySelectorAll("svg")).toHaveLength(3);
  expect(container.querySelectorAll("polygon")).toHaveLength(2);
  const ids = Array.from(container.querySelectorAll("linearGradient")).map((node) => node.id);
  expect(new Set(ids).size).toBe(2);
  expect(container.querySelector("image")).toBeNull();
  act(() => root.unmount());
});

test("unknown future poses get an explicit neutral guide instead of an empty SVG", () => {
  expect(mannequinPose("future pose").fallback).toBe(true);
});
