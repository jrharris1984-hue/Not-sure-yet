import {act} from 'react';
import {createRoot} from 'react-dom/client';
import RelatedFootControls from './RelatedFootControls';
import {SECTIONS} from '@/lib/dna';
import {resolveBuilderControls} from '@/lib/builderControlResolution';
let container,root;
const section=SECTIONS.find(item=>item.key==='feet');
beforeEach(()=>{global.IS_REACT_ACT_ENVIRONMENT=true;sessionStorage.clear();container=document.createElement('div');document.body.appendChild(container);root=createRoot(container);});
afterEach(()=>{act(()=>root.unmount());container.remove();});
test('editing a relocated pedicure retains other saved feet fields',()=>{
  const onChange=jest.fn(),value={pedicure:'painted red',arch:'high arch',framing:'feet close-up'};
  act(()=>root.render(<RelatedFootControls destination="wardrobe" section={section} value={value} onChange={onChange}/>));
  act(()=>container.querySelector('[data-testid="chip-feet-pedicure-painted-black"]').click());
  expect(onChange).toHaveBeenCalledWith({...value,pedicure:'painted black'});
  expect(container.querySelector('[data-testid="btn-randomize-feet"]')).toBeNull();
});
test('uses the real visibility resolver to explain details hidden by shoes',()=>{
  const value={pedicure:'painted red'},dna={feet:value,wardrobe:{outfit_mode:'custom',footwear:'combat boots'}};
  const notes=resolveBuilderControls(dna).notes;
  act(()=>root.render(<RelatedFootControls destination="wardrobe" section={section} value={value} notes={notes} onChange={jest.fn()}/>));
  expect(container.querySelector('[data-testid="builder-control-notes"]').textContent).toContain('Hidden by the selected closed footwear');
});
test('opening detail-shot controls never switches composition automatically',()=>{
  const onChange=jest.fn();
  act(()=>root.render(<RelatedFootControls destination="pose" section={section} value={{composition_mode:'supporting detail'}} requestedField={{field:'feet:framing'}} onChange={onChange}/>));
  expect(container.querySelector('details').open).toBe(true);
  expect(container.querySelector('[data-field-key="framing"]')).not.toBeNull();
  expect(onChange).not.toHaveBeenCalled();
});
test('foot field locks and section locks prevent edits at the new location',()=>{
  const onChange=jest.fn();
  act(()=>root.render(<RelatedFootControls destination="wardrobe" section={section} value={{pedicure:'painted red'}} fieldLocks={{pedicure:true}} onChange={onChange}/>));
  act(()=>container.querySelector('[data-testid="chip-feet-pedicure-painted-black"]').click());
  expect(onChange).not.toHaveBeenCalled();
  act(()=>root.render(<RelatedFootControls destination="wardrobe" section={section} value={{pedicure:'painted red'}} locked onChange={onChange}/>));
  act(()=>container.querySelector('[data-testid="chip-feet-pedicure-painted-black"]').click());
  expect(onChange).not.toHaveBeenCalled();
});
