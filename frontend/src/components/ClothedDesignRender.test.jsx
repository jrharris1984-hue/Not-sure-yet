import { act } from "react";
import { createRoot } from "react-dom/client";
import ClothedDesignRender from "./ClothedDesignRender";
import { endpoints } from "../lib/api";
jest.mock("../lib/api", () => ({ endpoints: { previewCharacterDesign: jest.fn(), renderCharacterDesign: jest.fn() } }));
let container, root;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  jest.useFakeTimers(); jest.clearAllMocks();
  endpoints.previewCharacterDesign.mockResolvedValue({ positive: "Clothed studio study" });
  endpoints.renderCharacterDesign.mockResolvedValue({ id: "queued-design", status: "queued" });
  container = document.createElement("div"); document.body.appendChild(container); root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); jest.useRealTimers(); });
const subject = { dna: { identity: { age: 35, gender: "female" }, wardrobe: { notes: "unrelated" } },
  design_profile: { size: 125, shape: "athletic round", texture: "firm" } };
const render = async props => { await act(async () => root.render(<ClothedDesignRender subject={subject} onQueued={() => {}} {...props} />)); };
const preview = async () => { await act(async () => jest.advanceTimersByTime(250)); };

test("uses the dedicated preview and renders only structured design selections", async () => {
  const onQueued = jest.fn();
  await render({ characterId: "character-1", onQueued });
  expect(container.querySelector("button").disabled).toBe(true);
  await preview();
  expect(container.querySelector('[data-testid="clothed-design-preview"]').textContent).toBe("Clothed studio study");
  await act(async () => container.querySelector("button").click());
  expect(endpoints.renderCharacterDesign).toHaveBeenCalledWith({ size: 125, shape: "athletic round", texture: "firm", age: 35, gender: "woman", character_id: "character-1" });
  expect(onQueued).toHaveBeenCalledWith({ id: "queued-design", status: "queued" });
});

test("changing subjects refreshes the preview before allowing another render", async () => {
  await render({}); await preview();
  await render({ subject: { dna: { identity: { age: 40, gender: "male" } }, design_profile: { size: 25, shape: "naturally round", texture: "smooth" } } });
  expect(container.querySelector("button").disabled).toBe(true);
  await preview();
  expect(endpoints.previewCharacterDesign).toHaveBeenLastCalledWith({ size: 25, shape: "naturally round", texture: "smooth", age: 40, gender: "man", character_id: null });
});

test("reports a backend error without calling the queued callback", async () => {
  endpoints.renderCharacterDesign.mockRejectedValue({ response: { data: { detail: "Backend unavailable" } } });
  const onQueued = jest.fn(); await render({ onQueued }); await preview();
  await act(async () => container.querySelector("button").click());
  expect(container.querySelector('[role="alert"]').textContent).toBe("Backend unavailable");
  expect(onQueued).not.toHaveBeenCalled();
});
