import { QUICK_SHOOT_COUNTS } from "./quickShootStyles";

test("quick shoot presets include 20, 40, and 120 image options", () => {
  expect(QUICK_SHOOT_COUNTS).toEqual(expect.arrayContaining([20, 40, 120]));
});
