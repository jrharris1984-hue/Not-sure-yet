import { act } from "react";
import { createRoot } from "react-dom/client";
import ReviewEditBanner from "./ReviewEditBanner";

test("review banner names the edited section and returns on request", () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container), onReturn = jest.fn();
  act(() => root.render(<ReviewEditBanner sectionTitle="Hair" onReturn={onReturn} />));
  expect(container.textContent).toContain("Adjusting Hair");
  act(() => container.querySelector("button").click());
  expect(onReturn).toHaveBeenCalledTimes(1);
  act(() => root.unmount());
  container.remove();
});
