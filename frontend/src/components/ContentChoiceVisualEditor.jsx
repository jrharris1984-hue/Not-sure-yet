import ContentMediaPicker from '@/components/ContentMediaPicker';
import { endpoints } from '@/lib/api';
import { useState } from 'react';

// Optional reference links are authoring aids only. They are not sent to
// ComfyUI and do not change the prompt compiler.
export default function ContentChoiceVisualEditor({ option, onChange }) {
  const [imageFailed, setImageFailed] = useState(false);
  const [showLibrary,setShowLibrary] = useState(false);
  const mediaId = option.reference_media_id || '';
  const mediaUrl = mediaId ? endpoints.mediaLibraryThumbnailUrl(mediaId) : '';
  const url = option.reference_url || '';
  const validUrl = /^https:\/\/[^\s]+$/i.test(url);
  return <section className="space-y-3 rounded-lg border hairline bg-black/20 p-3" aria-label="Visual choice details">
    <h3 className="text-sm font-semibold text-cyan-200">Visual reference &amp; preset details</h3>
    <p className="text-xs text-zinc-400">Attach a public HTTPS image link as an optional visual guide in this editor. It is not used as an image-conditioning reference during generation.</p>
    <div className="grid gap-3 sm:grid-cols-[minmax(0,180px)_1fr]">
      <div className="flex min-h-36 items-center justify-center overflow-hidden rounded-lg border hairline bg-elevated">
        {(mediaId || validUrl) && !imageFailed ? <img src={mediaUrl || url} alt={option.label + ' visual reference'} loading="lazy"
          referrerPolicy="no-referrer" onError={() => setImageFailed(true)} className="max-h-56 w-full object-contain" /> :
          <span className="p-3 text-center text-xs text-zinc-500">{url ? 'Preview unavailable or invalid HTTPS URL' : 'No reference image'}</span>}
      </div>
      <div className="space-y-3">
        <label className="block text-xs">Reference image URL
          <input type="url" value={url} placeholder="https://example.com/reference.jpg"
            className="mt-1 w-full rounded-lg border hairline bg-elevated px-3 py-2 text-sm"
            onChange={event => {setImageFailed(false);onChange({reference_url:event.target.value});}}/>
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="rounded-lg border hairline px-3 py-2 text-xs text-cyan-200" onClick={()=>setShowLibrary(value=>!value)}>Choose from Media Library</button>
          {mediaId && <button type="button" className="rounded-lg border hairline px-3 py-2 text-xs" onClick={()=>{setImageFailed(false);onChange({reference_media_id:''});}}>Clear library image</button>}
        </div>
        {mediaId && <p className="break-all text-[11px] text-zinc-400">Linked library image: {mediaId}</p>}
        <label className="block text-xs">Preset notes
          <textarea rows={3} maxLength={1000} value={option.notes || ''} placeholder="Describe the pose, fit, styling, or intended use."
            className="mt-1 w-full rounded-lg border hairline bg-elevated px-3 py-2 text-sm"
            onChange={event => onChange({notes:event.target.value})}/>
        </label>
      </div>
    </div>
    {showLibrary && <ContentMediaPicker onClose={()=>setShowLibrary(false)} onSelect={item=>{setImageFailed(false);onChange({reference_media_id:String(item.id),reference_url:''});setShowLibrary(false);}}/>}
  </section>;
}
