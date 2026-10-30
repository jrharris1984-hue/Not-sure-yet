import {act} from 'react';
import {createRoot} from 'react-dom/client';
import StudioMoreActions from './StudioMoreActions';
let host,root;
beforeEach(()=>{global.IS_REACT_ACT_ENVIRONMENT=true;host=document.createElement('div');document.body.appendChild(host);root=createRoot(host);});
afterEach(()=>{act(()=>root.unmount());host.remove();});
test('Escape closes the actions panel and returns focus to its trigger',()=>{
  act(()=>root.render(<StudioMoreActions><button>Undo</button></StudioMoreActions>));
  const menu=host.querySelector('details'),button=host.querySelector('button');menu.open=true;button.focus();
  act(()=>button.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true})));
  expect(menu.open).toBe(false);expect(document.activeElement).toBe(host.querySelector('summary'));
});
test('outside pointer dismisses, while inside controls remain usable',()=>{
  const click=jest.fn();act(()=>root.render(<StudioMoreActions><button onClick={click}>Undo</button></StudioMoreActions>));
  const menu=host.querySelector('details');menu.open=true;
  act(()=>{host.querySelector('button').dispatchEvent(new Event('pointerdown',{bubbles:true}));host.querySelector('button').click();});
  expect(menu.open).toBe(true);expect(click).toHaveBeenCalledTimes(1);
  act(()=>document.body.dispatchEvent(new Event('pointerdown',{bubbles:true})));expect(menu.open).toBe(false);
});
test('Escape inside a nested dialog is left for that dialog to handle',()=>{
  act(()=>root.render(<StudioMoreActions><dialog open><button>Close drawer</button></dialog></StudioMoreActions>));
  const menu=host.querySelector('details');menu.open=true;
  act(()=>host.querySelector('button').dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true})));
  expect(menu.open).toBe(true);
});
