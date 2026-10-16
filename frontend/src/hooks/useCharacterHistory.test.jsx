import { act, useState } from "react";
import { createRoot } from "react-dom/client";
import { useCharacterHistory } from "./useCharacterHistory";
let container, root, api, edit, now;
const original = [{ id: "a", dna: { hair: { color: "black" }, physique: { scale: 10 } } }];
function Host({ scope = "one", enabled = true }) {
  const [subjects, setSubjects] = useState(original);
  edit = setSubjects;
  api = { ...useCharacterHistory({ subjects, onRestore: setSubjects, scope, enabled }), subjects };
  return null;
}
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  now = 1000; jest.spyOn(Date, "now").mockImplementation(() => now);
  container = document.createElement("div"); document.body.appendChild(container); root = createRoot(container);
  act(() => root.render(<Host />));
});
afterEach(() => { act(() => root.unmount()); container.remove(); jest.restoreAllMocks(); });
const hair = (color) => [{ ...original[0], dna: { ...original[0].dna, hair: { color } } }];

test("undo and redo restore a whole cast and a new edit discards the redo branch", () => {
  const cast = [...hair("red"), { id: "b", dna: { hair: { color: "brown" } } }];
  act(() => edit(cast));
  expect(api.canUndo).toBe(true);
  act(() => api.undo());
  expect(api.subjects).toEqual(original);
  expect(api.canRedo).toBe(true);
  act(() => api.redo());
  expect(api.subjects).toEqual(cast);
  act(() => api.undo());
  act(() => edit(hair("white")));
  expect(api.canRedo).toBe(false);
  act(() => api.undo());
  expect(api.subjects).toEqual(original);
});

test("rapid changes to one field form one undo step while different fields stay separate", () => {
  act(() => edit(hair("red"))); now += 100;
  act(() => edit(hair("white"))); now += 100;
  act(() => edit([{ ...hair("white")[0], dna: { ...hair("white")[0].dna, physique: { scale: 50 } } }]));
  act(() => api.undo());
  expect(api.subjects).toEqual(hair("white"));
  act(() => api.undo());
  expect(api.subjects).toEqual(original);
  expect(api.canUndo).toBe(false);
});

test("history is bounded and resets when loading another character", () => {
  for (let index = 0; index < 35; index++) { now += 1000; act(() => edit(hair(String(index)))); }
  for (let index = 0; index < 30; index++) act(() => api.undo());
  expect(api.canUndo).toBe(false);
  expect(api.subjects).toEqual(hair("4"));
  act(() => root.render(<Host scope="two" />));
  expect(api.canRedo).toBe(false);
  expect(api.canUndo).toBe(false);
});

test("hydration and identical values do not create undo entries", () => {
  act(() => edit(JSON.parse(JSON.stringify(original))));
  expect(api.canUndo).toBe(false);
  act(() => root.render(<Host enabled={false} />));
  act(() => edit(hair("red")));
  act(() => root.render(<Host enabled />));
  expect(api.canUndo).toBe(false);
  now += 1000; act(() => edit(hair("white")));
  act(() => api.undo());
  expect(api.subjects).toEqual(hair("red"));
});
