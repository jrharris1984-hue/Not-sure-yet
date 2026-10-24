import { act } from 'react';
import { createRoot } from 'react-dom/client';
import OptionBrowser from './OptionBrowser';
const choices = Array.from({length:60}, (_,i) => `Choice ${i}`);
const renderOptions = options => options.map(option => <button key={option}>{option}</button>);
let container, root;
beforeEach(() => { global.IS_REACT_ACT_ENVIRONMENT = true; container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); });
const search = value => act(() => { const input = container.querySelector("input"); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, value); input.dispatchEvent(new Event("input", {bubbles:true})); });
const button = name => [...container.querySelectorAll('button')].find(el => el.textContent === name);
it('keeps selections visible and makes every choice reachable', () => {
  act(() => root.render(<OptionBrowser options={choices} value="Choice 59">{renderOptions}</OptionBrowser>));
  expect(button('Choice 59')).toBeTruthy();
  expect(button('Choice 40')).toBeUndefined();
  act(() => [...container.querySelectorAll('button')].find(el => el.textContent.startsWith('Show more')).click());
  expect(button('Choice 40')).toBeTruthy();
});
it('searches labels across groups without changing the selection', () => {
  act(() => root.render(<OptionBrowser options={choices.slice(0,2)} searchOptions={choices} value="Choice 0" labels={{'Choice 59':'Sunset'}}>{renderOptions}</OptionBrowser>));
  search('sunset');
  expect(button('Choice 59')).toBeTruthy();
  expect(container.textContent).toContain('Selected: Choice 0');
  search('no match');
  expect(container.querySelector('[role="status"]').textContent).toContain('No matching choices');
});
