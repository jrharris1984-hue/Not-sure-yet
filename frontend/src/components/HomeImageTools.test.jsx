import { act } from 'react';
import { createRoot } from 'react-dom/client';
import HomeImageTools, { imageToolGroups } from './HomeImageTools';
jest.mock('react-router-dom', () => ({ Link: ({to, children, ...props}) => <a href={to} {...props}>{children}</a> }), {virtual:true});
const workflows=[{id:'pose',name:'AnyPose',kind:'edit'},{id:'repair',name:'Repair',kind:'enhance'},{id:'variation',name:'Chroma Variation',kind:'variation'},{id:'video',name:'WAN Image to Video',kind:'video'},{id:'creator',name:'Chroma',kind:'image'},{id:'t2v',name:'Text to Video',kind:'text_video'},{id:'internal',name:'Pose Assist',kind:'pose'}];
test('groups video modes together and excludes still-image creation and internal stages',()=>{
  const groups=imageToolGroups(workflows);
  expect(groups.map(group=>group.workflows.map(workflow=>workflow.id))).toEqual([['pose','repair'],['variation'],['video','t2v']]);
});
test('home shortcuts navigate to individual tools and explain empty groups',()=>{
  global.IS_REACT_ACT_ENVIRONMENT=true;
  const container=document.createElement('div'),root=createRoot(container);
  act(()=>root.render(<HomeImageTools workflows={workflows}/>));
  for (const mode of ['image','video','text-video']) expect(container.querySelector(`a[href="/create/${mode}"]`)).not.toBeNull();
  expect(container.querySelector('a[href="/image-tools/pose"]').textContent).toContain('AnyPose');
  expect(container.querySelector('a[href="/image-tools/video"]')).not.toBeNull();
  expect(container.querySelector('a[href="/image-tools/t2v"]')).not.toBeNull();
  expect(container.querySelector('a[href="/image-tools/creator"]')).toBeNull();
  act(()=>root.render(<HomeImageTools workflows={[]}/>));
  expect(container.querySelectorAll('a[href="/settings"]')).toHaveLength(3);
  act(()=>root.unmount());
});

test('embedded workflow lists can hide create shortcuts and hand selection back to a source-aware parent',()=>{
  global.IS_REACT_ACT_ENVIRONMENT=true;
  const container=document.createElement('div'),root=createRoot(container),onWorkflow=jest.fn();
  act(()=>root.render(<HomeImageTools workflows={workflows} showCreateShortcuts={false} showHeading={false} onWorkflow={onWorkflow}/>));
  expect(container.querySelector('a[href="/create/image"]')).toBeNull();
  expect(container.textContent).not.toContain('Image & video tools');
  const poseButton=Array.from(container.querySelectorAll('button')).find(button=>button.textContent.includes('AnyPose'));
  act(()=>poseButton.click());
  expect(onWorkflow).toHaveBeenCalledWith(expect.objectContaining({id:'pose',kind:'edit'}));
  act(()=>root.unmount());
  container.remove();
});

