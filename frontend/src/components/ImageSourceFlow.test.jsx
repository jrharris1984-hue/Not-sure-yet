import { act } from "react";
import { createRoot } from "react-dom/client";
import ImageSourceFlow from "./ImageSourceFlow";
let container, root;
beforeEach(()=>{global.IS_REACT_ACT_ENVIRONMENT=true;container=document.createElement("div");document.body.appendChild(container);root=createRoot(container);});
afterEach(()=>{act(()=>root.unmount());container.remove();});
const render = props => act(()=>root.render(<ImageSourceFlow onUpload={()=>{}} onRemove={()=>{}} onRender={()=>{}} renderCount={1} onRenderCount={()=>{}} {...props}><textarea aria-label="Change instruction"/></ImageSourceFlow>));

test("requires a source before showing editing controls or allowing dispatch",()=>{
  const onRender=jest.fn();render({onRender});
  expect(container.querySelector("textarea")).toBeNull();
  expect(container.querySelector('[data-testid="input-qwen-edit-source"]')).not.toBeNull();
  const button=container.querySelector('[data-testid="btn-source-workflow-render"]');
  expect(button.disabled).toBe(true);
  act(()=>button.click());expect(onRender).not.toHaveBeenCalled();
});

test("an uploaded source unlocks controls and renders through the existing dispatcher",()=>{
  const onRender=jest.fn();render({source:{name:"portrait.png"},preview:"/portrait.png",onRender});
  expect(container.querySelector("textarea")).not.toBeNull();
  expect(container.querySelector("img").getAttribute("src")).toBe("/portrait.png");
  const button=container.querySelector('[data-testid="btn-source-workflow-render"]');
  expect(button.disabled).toBe(false);act(()=>button.click());expect(onRender).toHaveBeenCalledTimes(1);
});

test("upload passes the selected file to the shared uploader",()=>{
  const onUpload=jest.fn();render({variation:true,onUpload});
  const input=container.querySelector('[data-testid="input-variation-source"]');
  const file=new File(["image"],"source.png",{type:"image/png"});
  Object.defineProperty(input,"files",{value:[file]});
  act(()=>input.dispatchEvent(new Event("change",{bubbles:true})));
  expect(onUpload).toHaveBeenCalledWith(file);
});

test("variation image count remains available on mobile and uses the batch setting",()=>{
  const onRenderCount=jest.fn();render({variation:true,source:{name:"source.png"},onRenderCount});
  const select=container.querySelector("select");
  act(()=>{select.value="4";select.dispatchEvent(new Event("change",{bubbles:true}));});
  expect(onRenderCount).toHaveBeenCalledWith(4);
});

test("replacing a source returns to the upload step and relocks rendering",()=>{
  const onRemove=jest.fn();render({source:{name:"source.png"},onRemove});
  act(()=>Array.from(container.querySelectorAll("button")).find(button=>button.textContent.includes("Replace")).click());
  expect(onRemove).toHaveBeenCalledTimes(1);
  render({});expect(container.querySelector("textarea")).toBeNull();expect(container.querySelector('[data-testid="btn-source-workflow-render"]').disabled).toBe(true);
});

test("a pending upload cannot dispatch an edit",()=>{
  render({source:{name:"source.png"},uploading:true});
  expect(container.querySelector('[data-testid="btn-source-workflow-render"]').disabled).toBe(true);
});
