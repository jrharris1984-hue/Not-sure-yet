import { act } from "react";
import { createRoot } from "react-dom/client";
import useSmartPhotoshootPlan from "./useSmartPhotoshootPlan";

test("keeps survive ordinary rerenders and clear immediately when shoot settings change", () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const root = createRoot(document.createElement("div"));
  const config = { enabled: true, count: 6, subjects: [{ dna: {} }], promptCatalog: null,
    preset: "editorial", options: {}, customPresets: [], strength: "bold" };
  let planner;
  function Harness(props) { planner = useSmartPhotoshootPlan(props); return null; }
  act(() => root.render(<Harness {...config} />));
  act(() => planner.toggleKeep(0));
  const kept = planner.plan[0];
  act(() => planner.regenerate());
  expect(planner.plan[0]).toBe(kept);
  act(() => root.render(<Harness {...config} />));
  expect(planner.plan[0]).toBe(kept);
  const beforeRedo = planner.plan;
  act(() => planner.regenerate(2));
  beforeRedo.forEach((shot, index) => { if (index !== 2) expect(planner.plan[index]).toBe(shot); });
  act(() => root.render(<Harness {...config} preset="classic_portrait" count={4} />));
  expect(planner.plan).toHaveLength(4);
  expect(planner.plan.every(shot => !shot.kept)).toBe(true);
  act(() => root.render(<Harness {...config} enabled={false} />));
  expect(planner.plan).toEqual([]);
  act(() => root.unmount());
});
