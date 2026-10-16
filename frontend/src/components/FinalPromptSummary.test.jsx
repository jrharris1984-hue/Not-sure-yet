import { act } from "react";
import { createRoot } from "react-dom/client";
import FinalPromptSummary from "./FinalPromptSummary";

test("final prompt summary reports finished length and preserves selected details", () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement("div"), root = createRoot(container);
  act(() => root.render(<FinalPromptSummary assembly={{words:180,estimatedTokens:243,budgetWords:150,overBudgetWords:30}} />));
  expect(container.textContent).toContain("180 words");
  expect(container.textContent).toContain("30 words above guidance");
  expect(container.textContent).toContain("selections were kept");
  act(() => root.render(<FinalPromptSummary assembly={{words:120,estimatedTokens:162,budgetWords:150,overBudgetWords:0}} />));
  expect(container.textContent).not.toContain("above guidance");
  act(() => root.unmount());
});
