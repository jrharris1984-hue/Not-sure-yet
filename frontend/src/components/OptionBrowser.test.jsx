import { act } from 'react';
import { createRoot } from 'react-dom/client';
import OptionBrowser from './OptionBrowser';
const choices = Array.from({length:60}, (_,i) => `Choice ${i}`);
const renderOptions = options => options.map(option => <button key={option}>{option}</button>);
let container, root;
beforeEach(() => { sessionStorage.clear(); global.IS_REACT_ACT_ENVIRONMENT = true; container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
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

it('returns to an expanded list without leaking its limit into another field', () => {
  const render = key => act(() => root.render(<OptionBrowser preferenceKey={key} options={choices}>{renderOptions}</OptionBrowser>));
  render('hair');
  act(() => button('Show more choices (36)').click());
  expect(button('Choice 40')).toBeTruthy();
  render('clothing');
  expect(button('Choice 40')).toBeUndefined();
  render('hair');
  expect(button('Choice 40')).toBeTruthy();
  act(() => root.render(null));
  render('hair');
  expect(button('Choice 40')).toBeTruthy();
});
it('shows selections from other groups and offers recovery after the last selection is removed', () => {
  const render = value => act(() => root.render(<OptionBrowser options={choices.slice(0,2)} searchOptions={choices} value={value}>{renderOptions}</OptionBrowser>));
  render('Choice 59');
  act(() => button('Show selected').click());
  expect(button('Choice 59')).toBeTruthy();
  expect(button('Choice 0')).toBeUndefined();
  render('');
  expect(container.querySelector('[role="status"]').textContent).toContain('No selected choices');
  act(() => button('Browse all').click());
  expect(button('Choice 0')).toBeTruthy();
});
it('clears a failed search without losing the selected value', () => {
  act(() => root.render(<OptionBrowser options={choices} value="Choice 59">{renderOptions}</OptionBrowser>));
  search('missing option');
  act(() => button('Clear search').click());
  expect(container.querySelector('input').value).toBe('');
  expect(button('Choice 59')).toBeTruthy();
});
it('favorites persist per field without changing the supplied selection',()=>{
  const paint=(key,value='Choice 59')=>act(()=>root.render(<OptionBrowser preferenceKey={key} options={choices} value={value}>{renderOptions}</OptionBrowser>));
  paint('hair');act(()=>button('Favorite selected').click());
  act(()=>button('Favorites (1)').click());expect(button('Choice 59')).toBeTruthy();expect(button('Choice 0')).toBeUndefined();
  act(()=>button('Unfavorite selected').click());expect(container.querySelector('[role="status"]').textContent).toContain('No matching favorites');
  act(()=>button('Favorites (0)').click());expect(button('Choice 59')).toBeTruthy();
  act(()=>button('Favorite selected').click());
  act(()=>root.render(null));paint('other');expect(button('Favorites (0)')).toBeTruthy();
  act(()=>root.render(null));paint('hair');expect(button('Favorites (1)')).toBeTruthy();
});
it('matches words in any order and ignores accents and separators',()=>{
  act(()=>root.render(<OptionBrowser alwaysSearch options={choices} searchOptions={[...choices,'custom_blue_jacket']} labels={{custom_blue_jacket:'Bleu café jacket'}}>{renderOptions}</OptionBrowser>));
  search('jacket cafe');expect(button('custom_blue_jacket')).toBeTruthy();
  search('BLUE jacket');expect(button('custom_blue_jacket')).toBeTruthy();
  expect(container.querySelector('.choice-browser-count').textContent).toBe('1 of 1 matches');
});
it('typing searches the full library even when Favorites or Selected was active',()=>{
  act(()=>root.render(<OptionBrowser preferenceKey="search" options={choices} value="Choice 0">{renderOptions}</OptionBrowser>));
  act(()=>button('Favorite selected').click());act(()=>button('Favorites (1)').click());
  search('59');expect(button('Choice 59')).toBeTruthy();expect(button('Favorites (1)').getAttribute('aria-pressed')).toBe('false');
  act(()=>button('Show selected').click());search('58');expect(button('Choice 58')).toBeTruthy();
});
it('Escape clears only the query and retains keyboard focus and selection',()=>{
  act(()=>root.render(<OptionBrowser options={choices} value="Choice 59">{renderOptions}</OptionBrowser>));
  search('missing');const input=container.querySelector('input');input.focus();
  act(()=>input.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true})));
  expect(input.value).toBe('');expect(document.activeElement).toBe(input);expect(button('Choice 59')).toBeTruthy();
});
it('counts extra pinned selections accurately when offering more results',()=>{
  act(()=>root.render(<OptionBrowser options={choices} value="Choice 59">{renderOptions}</OptionBrowser>));
  expect(container.querySelector('.choice-browser-count').textContent).toBe('25 of 60 choices');
  expect(button('Show more choices (35)')).toBeTruthy();
});
