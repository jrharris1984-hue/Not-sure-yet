export function renderFeedback(status, submitting = false) {
  if (submitting) return {state:'submitting',label:'Submitting…',message:'Sending your request to the render queue.',busy:true};
  const states = {
    queued:['Waiting in queue','Your image will start when the renderer is available.',true],
    pending:['Waiting in queue','Your image will start when the renderer is available.',true],
    running:['Generating image','You can keep editing while this render finishes.',true],
    processing:['Processing result','Preparing the output for viewing.',true],
    done:['Ready to view','Your latest result is ready.',false],
    failed:['Render failed','Open render details to see the error and recovery options.',false],
    offline:['Renderer offline','Reconnect ComfyUI, then check the queue before submitting again.',false],
    cancelled:['Render cancelled','Your editing choices are still available.',false],
  };
  const entry=states[status];
  return entry ? {state:status,label:entry[0],message:entry[1],busy:entry[2]}
    : {state:'ready',label:'Ready to create',message:'Your image will appear after generation. Choose character details to get started.',busy:false};
}
