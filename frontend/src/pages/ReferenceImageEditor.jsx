import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { endpoints } from '@/lib/api';

export const REFERENCE_EDIT_STYLES = ['flux2_klein_edit', 'qwen_reference'];
export function referenceEditPayload(workflow, references, instruction, width, height, seed) {
  const minimum = workflow.prompt_style === 'qwen_reference' ? 2 : 1;
  if (!REFERENCE_EDIT_STYLES.includes(workflow.prompt_style)) throw new Error('Choose a reference editing workflow.');
  if (references.length < minimum || !references.slice(0, minimum).every(item => item?.name)) throw new Error(`Upload the first ${minimum} reference image${minimum === 1 ? '' : 's'}.`);
  if (references[2] && !references[1]) throw new Error('Add image 2 before image 3 to keep the reference numbers in order.');
  const images = references.filter(Boolean).map(item => [item.subfolder, item.name].filter(Boolean).join('/'));
  if (images.length > 3 || new Set(images).size !== images.length) throw new Error('Use up to three different reference images.');
  if (!instruction.trim()) throw new Error('Describe how to edit or combine the images.');
  if (seed !== '' && (!Number.isSafeInteger(Number(seed)) || Number(seed) < 0)) throw new Error('Use a whole-number seed or leave it blank.');
  return {workflow_id:workflow.id, workflow_type:'edit', reference_image:images[0], reference_images:images,
    edit_instruction:instruction.trim(), prompt_positive:instruction.trim(), preserve_unmentioned:false,
    width, height, batch_size:1, ...(seed !== '' ? {seed:Number(seed)} : {})};
}

export default function ReferenceImageEditor({ workflow }) {
  const location = useLocation();
  const [references, setReferences] = useState([location.state?.galleryReference || null, null, null]);
  const [previews, setPreviews] = useState([location.state?.previewUrl || '', '', '']);
  const [instruction, setInstruction] = useState('');
  const [width, setWidth] = useState(768), [height, setHeight] = useState(1024), [seed, setSeed] = useState('');
  const [busy, setBusy] = useState(''), [error, setError] = useState(''), [queued, setQueued] = useState(false);
  const urls = useRef({}), mounted = useRef(false);
  const minimum = workflow.prompt_style === 'qwen_reference' ? 2 : 1;
  useEffect(() => {
    mounted.current = true;
    const ownedUrls = urls.current;
    return () => {mounted.current = false; Object.values(ownedUrls).forEach(URL.revokeObjectURL);};
  }, []);
  const upload = async (event, index) => {
    const file = event.target.files?.[0]; event.target.value = ''; if (!file) return;
    setBusy('Uploading'); setError(''); setQueued(false);
    try {
      const result = await endpoints.uploadReferenceImage(file);
      if (!mounted.current) return;
      if (urls.current[index]) URL.revokeObjectURL(urls.current[index]);
      urls.current[index] = URL.createObjectURL(file);
      setPreviews(values => values.map((value,i) => i === index ? urls.current[index] : value));
      setReferences(values => values.map((value,i) => i === index ? result : value));
    } catch (err) { if (mounted.current) setError(err.response?.data?.detail || err.message || 'Upload failed.'); }
    finally { if (mounted.current) setBusy(''); }
  };
  const generate = async () => {
    setBusy('Submitting'); setError(''); setQueued(false);
    try {
      const result = await endpoints.dispatchRender(referenceEditPayload(workflow, references, instruction, width, height, seed));
      if (['failed','offline'].includes(result.status)) throw new Error(result.error || 'Could not start this edit.');
      if (mounted.current) setQueued(true);
    } catch (err) {if (mounted.current) setError(err.response?.data?.detail || err.message || 'Submission failed.');}
    finally {if (mounted.current) setBusy('');}
  };
  return <main className="mx-auto max-w-4xl space-y-5 p-4 sm:p-6">
    <Link to="/tools" className="text-cyan-300">← Tools</Link>
    <header><h1 className="font-display text-2xl font-bold">{workflow.name}</h1>
      <p className="mt-2 text-sm text-zinc-400">Upload {minimum}–3 images. Refer to them as image 1, image 2, and image 3 in your instructions.</p></header>
    {error && <p role="alert" className="rounded-lg border border-red-400/30 p-3 text-red-200">{error}</p>}
    <fieldset disabled={!!busy} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">{references.map((reference,index) => <section key={index} className="pane space-y-2 p-3">
        <label className="block text-sm">Reference image {index+1}{index >= minimum ? ' (optional)' : ' (required)'}
          <input aria-label={`Reference image ${index+1}`} className="mt-2 block w-full text-xs" type="file" accept="image/png,image/jpeg,image/webp" onChange={event => upload(event,index)}/></label>
        {previews[index] && <img src={previews[index]} alt={`Reference ${index+1}`} className="h-40 w-full rounded object-contain"/>}
        {reference && <><p className="break-all text-xs text-zinc-400">{reference.name}</p><button className="text-xs text-cyan-300" type="button" onClick={() => {
          if (urls.current[index]) {URL.revokeObjectURL(urls.current[index]); delete urls.current[index];}
          setReferences(values => values.map((value,i) => i === index ? null : value));
          setPreviews(values => values.map((value,i) => i === index ? '' : value)); setQueued(false);
        }}>Remove image {index+1}</button></>}
      </section>)}</div>
      <label className="block space-y-2 text-sm">Your instructions<textarea aria-label="Your instructions" className="block w-full rounded-lg border hairline bg-elevated p-3" rows={5} value={instruction} onChange={event => {setInstruction(event.target.value); setQueued(false);}} placeholder={minimum === 2 ? 'Place the people from image 1 and image 2 together in a studio portrait.' : 'Change the background of image 1 to a blue studio wall. Preserve the subject and outfit.'}/></label>
      <div className="grid grid-cols-2 gap-3">{[['Width',width,setWidth],['Height',height,setHeight]].map(([label,value,setter]) => <label key={label} className="text-sm">{label}<select aria-label={label} value={value} onChange={event => {setter(Number(event.target.value));setQueued(false);}} className="ml-2 rounded border hairline bg-elevated p-2">{[512,768,1024].map(size => <option key={size}>{size}</option>)}</select></label>)}</div>
      <label className="block text-sm">Seed (blank = random)<input aria-label="Seed" className="ml-2 rounded border hairline bg-elevated p-2" value={seed} onChange={event => {setSeed(event.target.value);setQueued(false);}}/></label>
    </fieldset>
    <button className="rounded-lg bg-cyan-400 px-5 py-2 font-semibold text-black disabled:opacity-40" disabled={!!busy || !instruction.trim() || !references.slice(0,minimum).every(Boolean) || (!!references[2] && !references[1])} onClick={generate}>{busy ? `${busy}…` : 'Generate edit'}</button>
    {queued && <p role="status" className="text-emerald-300">Queued. <Link className="underline" to="/queue">View progress</Link> · <Link className="underline" to="/gallery">Open Gallery</Link></p>}
  </main>;
}
