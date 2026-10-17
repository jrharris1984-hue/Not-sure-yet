import {act} from 'react';
import {createRoot} from 'react-dom/client';
import GuidedCharacterPreview from './GuidedCharacterPreview';
test('preview explains its status and review does not generate an image',()=>{
 global.IS_REACT_ACT_ENVIRONMENT=true;const container=document.createElement('div'),root=createRoot(container),review=jest.fn();
 act(()=>root.render(<GuidedCharacterPreview stages={[]} sections={[]} onReview={review}/>));
 expect(container.textContent).toContain('does not update this image automatically');expect(container.textContent).toContain('after generation');
 act(()=>container.querySelector('button').click());expect(review).toHaveBeenCalledTimes(1);act(()=>root.unmount());
});
