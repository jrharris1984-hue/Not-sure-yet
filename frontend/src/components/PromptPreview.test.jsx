import { act } from 'react';
import { createRoot } from 'react-dom/client';
import PromptPreview from './PromptPreview';

test('compact preview requires application and reports current missing selections', () => {
  global.IS_REACT_ACT_ENVIRONMENT=true;
  const container=document.createElement('div'),root=createRoot(container),onOptimize=jest.fn();
  const positive='Subject A: 75-year-old adult woman, red dress, red dress; Subject B: 45-year-old adult woman, red dress';
  act(()=>root.render(<PromptPreview positive={positive} negative="" workflow={{name:'Chroma',prompt_style:'chroma'}} context={{subjectCount:2}} compilerMeta={{priorityPlan:{mustMatch:[],important:[{key:'B:hair.color',label:'Subject B Hair color',value:'blue',matchTerms:['blue hair']}],detail:[]}}} onOptimize={onOptimize}/>));
  const review=container.querySelector('[data-testid="prompt-length-review"]');
  expect(review.textContent).toContain('Subject B Hair color: blue');
  expect(review.textContent).toContain('estimate, not a confirmed encoder limit');
  act(()=>container.querySelector('[data-testid="btn-review-compaction"]').click());
  const compact=container.querySelector('[data-testid="compact-prompt-review"]');
  expect(compact.textContent).toContain('Subject B: 45-year-old');
  expect(onOptimize).not.toHaveBeenCalled();
  act(()=>Array.from(compact.querySelectorAll('button')).find(button=>button.textContent==='Apply reviewed wording').click());
  expect(onOptimize).toHaveBeenCalledWith('Subject A: 75-year-old adult woman, red dress; Subject B: 45-year-old adult woman, red dress');
  act(()=>root.unmount());
});
