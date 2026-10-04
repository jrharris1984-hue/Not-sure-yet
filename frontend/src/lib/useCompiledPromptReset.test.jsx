import { act, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { useCompiledPromptReset } from "./useCompiledPromptReset";

let container, root, editor;
function Editor({ positive = "original body", workflowId = "chroma", recipe }) {
  const [override, setPositive] = useState("");
  const [negativeOverride, setNegative] = useState("");
  const preserve = useCompiledPromptReset({
    positive, negative: "generated negative", workflowId, setPositive, setNegative,
  });
  useEffect(() => {
    if (!recipe) return;
    preserve();
    setPositive(recipe.positive);
    setNegative(recipe.negative);
  }, [recipe, preserve]);
  editor = { setPositive, setNegative };
  return <output data-negative={negativeOverride || "generated negative"}>{override || positive}</output>;
}

beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div");
  root = createRoot(container);
});
afterEach(() => act(() => root.unmount()));
const render = (props) => act(() => root.render(<Editor {...props} />));
const recipe = { positive: "saved exact prompt", negative: "saved exact negative" };

test("an exact recipe keeps its saved prompts until the first edit, even when restoration leaves compiler inputs unchanged", () => {
  render({});
  render({ recipe });
  expect(container.textContent).toBe(recipe.positive);
  expect(container.firstChild.dataset.negative).toBe(recipe.negative);
  render({ recipe, positive: "edited body and wardrobe" });
  expect(container.textContent).toBe("edited body and wardrobe");
  expect(container.firstChild.dataset.negative).toBe("generated negative");
});

test("restoration that also changes compiler inputs preserves the exact prompt but never skips a subsequent edit", () => {
  render({});
  render({ recipe, positive: "restored body", workflowId: "krea2" });
  expect(container.textContent).toBe(recipe.positive);
  render({ recipe, positive: "new pose", workflowId: "krea2" });
  expect(container.textContent).toBe("new pose");
  render({ recipe, positive: "new wardrobe", workflowId: "krea2" });
  expect(container.textContent).toBe("new wardrobe");
});

test("manual prompt edits survive rerenders and are cleared when the workflow changes", () => {
  render({ recipe });
  act(() => {
    editor.setPositive("manual edit");
    editor.setNegative("manual negative");
  });
  render({ recipe });
  expect(container.textContent).toBe("manual edit");
  expect(container.firstChild.dataset.negative).toBe("manual negative");
  render({ recipe, workflowId: "flux" });
  expect(container.textContent).toBe("original body");
  expect(container.firstChild.dataset.negative).toBe("generated negative");
});

test("restoring the same recipe again does not leave a skip flag for the next edit", () => {
  render({ recipe });
  render({ recipe: { ...recipe } });
  expect(container.textContent).toBe(recipe.positive);
  render({ positive: "edited framing" });
  expect(container.textContent).toBe("edited framing");
});
