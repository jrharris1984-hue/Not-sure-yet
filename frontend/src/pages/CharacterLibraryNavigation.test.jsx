import { act } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { endpoints } from "@/lib/api";
import Library from "./Library";
import Shoots from "./Shoots";

jest.mock("@/lib/api", () => ({ API_BASE: "/api", endpoints: {
  listCharacters: jest.fn(), listCharacterTags: jest.fn(), listShoots: jest.fn(),
} }));
jest.mock("@/components/SmartPhotoshootLibrary", () => () => <div data-testid="shoot-style-editor">Shoot styles</div>);
let mockSearch = "";
jest.mock("react-router-dom", () => ({
  Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a>,
  useSearchParams: () => [new URLSearchParams(mockSearch), jest.fn()],
}), { virtual: true });
let container, root, client;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  mockSearch = "";
  jest.clearAllMocks();
  endpoints.listCharacters.mockResolvedValue([{ id: "char a", name: "Alice & Jane" }]);
  endpoints.listCharacterTags.mockResolvedValue([]);
  endpoints.listShoots.mockResolvedValue([]);
  container = document.createElement("div"); document.body.appendChild(container);
  root = createRoot(container);
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});
afterEach(() => { act(() => root.unmount()); client.clear(); container.remove(); });
async function show(Component) {
  await act(async () => { root.render(<QueryClientProvider client={client}><Component /></QueryClientProvider>); });
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 30)); });
}
test("roster offers a character gallery, unified shoots and a separate Preview Lab", async () => {
  await show(Library);
  expect(container.querySelector('[data-testid="btn-character-gallery-0"]').getAttribute("href")).toBe("/gallery?character=char%20a&name=Alice%20%26%20Jane");
  expect(container.querySelector('[data-testid="btn-shoot-0"]').getAttribute("href")).toBe("/shoots?character=char%20a");
  expect(container.querySelector('a[href="/create/character-preview"]')).not.toBeNull();
});
test("combined photoshoots retain styles, custom sessions and direct Smart entry", async () => {
  mockSearch = "character=char%20a";
  await show(Shoots);
  expect(endpoints.listShoots).toHaveBeenCalledWith({ character_id: "char a" });
  expect(container.querySelector('[data-testid="start-smart-shoot"]').getAttribute("href")).toBe("/character/char%20a?shoot=smart");
  expect(container.querySelector('[data-testid="start-custom-shoot"]').getAttribute("href")).toBe("/shoot/new/char%20a");
  expect(container.querySelector('[data-testid="shoot-style-editor"]')).not.toBeNull();
  expect(container.querySelector('[data-testid="shoot-character-gallery"]')).not.toBeNull();
});
test("no character selected cannot start an undefined shoot", async () => {
  await show(Shoots);
  expect(endpoints.listShoots).toHaveBeenCalledWith({});
  expect(container.querySelector('[data-testid="start-smart-shoot"]')).toBeNull();
  expect(container.querySelector('[data-testid="start-custom-shoot"]')).toBeNull();
});
