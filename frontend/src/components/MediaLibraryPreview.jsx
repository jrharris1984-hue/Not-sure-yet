import { useState } from 'react';
import { Images, Video } from 'lucide-react';
import { endpoints } from '@/lib/api';

export default function MediaLibraryPreview({ item, original = false, className = '' }) {
  const [failed, setFailed] = useState([]);
  const image = item.media_type !== 'video';
  const thumbnailUrl = endpoints.mediaLibraryThumbnailUrl(item.id);
  const originalUrl = endpoints.mediaLibraryOriginalUrl(item.id);
  const candidates = original && image ? [originalUrl, thumbnailUrl]
    : image ? (item.thumbnail_url ? [thumbnailUrl, originalUrl] : [originalUrl, thumbnailUrl]) : [thumbnailUrl];
  const src = candidates.find(url => !failed.includes(url));
  if (!src) return <div className="h-full min-h-32 grid place-items-center text-zinc-500 p-3 text-center" role="status">
    <div>{image ? <Images className="mx-auto" /> : <Video className="mx-auto" />}<p className="mt-2 text-xs">Preview unavailable</p>
      <p className="mt-1 text-[10px]">Check the original file and Media Library connection.</p></div>
  </div>;
  return <img src={src} alt={item.file_name || 'Media preview'} loading="lazy" className={className}
    onError={() => setFailed(current => [...current, src])} />;
}
