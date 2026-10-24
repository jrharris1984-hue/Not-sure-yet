import {act} from 'react';
import {createRoot} from 'react-dom/client';
import useWorkspaceOffsets from './useWorkspaceOffsets';
test('tracks header and toolbar growth and disconnects on unmount',()=>{
  global.IS_REACT_ACT_ENVIRONMENT=true;
  const original=global.ResizeObserver;
  let notify;const disconnect=jest.fn();
  global.ResizeObserver=class {constructor(callback){notify=callback;}observe(){}disconnect(){disconnect();}};
  const container=document.createElement('div');document.body.appendChild(container);
  const root=createRoot(container);
  function Workspace(){useWorkspaceOffsets(true);return <><header className="studio-app-header"/><div className="design-workspace"><div id="studio-model"/></div></>;}
  try {
    act(()=>root.render(<Workspace/>));
    container.querySelector('header').getBoundingClientRect=()=>({height:64});
    const toolbar=container.querySelector('#studio-model');
    toolbar.getBoundingClientRect=()=>({height:140});
    act(()=>notify());
    const style=container.querySelector('.design-workspace').style;
    expect(style.getPropertyValue('--workspace-sticky-offset')).toBe('220px');
    toolbar.getBoundingClientRect=()=>({height:210});act(()=>notify());
    expect(style.getPropertyValue('--workspace-sticky-offset')).toBe('290px');
    act(()=>root.unmount());expect(disconnect).toHaveBeenCalledTimes(1);
  } finally {container.remove();global.ResizeObserver=original;}
});
