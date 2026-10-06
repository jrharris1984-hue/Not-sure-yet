import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef } from 'react';
import { motionDuration } from '@/lib/dragMotion';

// Native scrolling owns touch tracking, momentum and snapping. React only commits
// the selected record once scrolling has stopped. A fast flick can cross many slides.
const GalleryCarousel = forwardRef(function GalleryCarousel({ current, items, previous, next, onNavigate, outputUrl, isVideo }, ref) {
  const viewport = useRef(null);
  const timer = useRef(null);
  const navigating = useRef(false);
  const touching = useRef(false);
  const callback = useRef(onNavigate);
  const available = useRef(false);
  const slides = items?.some(item => item.id === current.id) ? items : previous && next ? [previous, current, next] : [current];
  const index = items?.some(item => item.id === current.id) ? items.findIndex(item => item.id === current.id) : previous && next ? 1 : 0;
  const position = useRef({ index, count: slides.length });
  position.current = { index, count: slides.length };
  callback.current = onNavigate;
  available.current = slides.length > 1;
  const width = () => viewport.current?.clientWidth || viewport.current?.getBoundingClientRect().width || window.innerWidth;
  const recenter = () => {
    if (viewport.current) viewport.current.scrollLeft = width() * position.current.index;
  };
  const settled = () => {
    clearTimeout(timer.current);
    if (!viewport.current || touching.current) return;
    const destination = Math.max(0, Math.min(position.current.count - 1, Math.round(viewport.current.scrollLeft / width())));
    const direction = destination - position.current.index;
    navigating.current = false;
    if (available.current && direction) callback.current(direction);
    else recenter();
  };
  useImperativeHandle(ref, () => ({ navigate(direction) {
    if (!available.current || navigating.current) return;
    const destination = position.current.index + direction;
    if (!motionDuration() || destination < 0 || destination >= position.current.count) { callback.current(direction); return; }
    navigating.current = true;
    viewport.current.scrollTo({ left: width() * destination, behavior: 'smooth' });
    // Scroll events continually postpone this fallback until the animation stops.
    timer.current = setTimeout(settled, 200);
  } }));
  useLayoutEffect(() => {
    clearTimeout(timer.current); navigating.current = false; touching.current = false; recenter();
  }, [current.id, index]);
  useEffect(() => {
    const node = viewport.current;
    let measuredWidth = width();
    const resize = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => {
      const nextWidth = width();
      if (Math.abs(nextWidth - measuredWidth) < 1) return;
      measuredWidth = nextWidth;
      clearTimeout(timer.current); navigating.current = false; recenter();
    });
    resize?.observe(node);
    return () => { clearTimeout(timer.current); resize?.disconnect(); };
  }, []);
  return <div ref={viewport} className="gallery-carousel-viewport flex-1 min-h-0 h-full" data-testid="gallery-carousel"
    style={{ overflowX: available.current ? 'auto' : 'hidden' }}
    onTouchStart={() => { touching.current = true; clearTimeout(timer.current); }}
    onTouchEnd={event => {
      touching.current = event.touches.length > 0;
      if (!touching.current) { clearTimeout(timer.current); timer.current = setTimeout(settled, 160); }
    }}
    onTouchCancel={() => { touching.current = false; clearTimeout(timer.current); timer.current = setTimeout(settled, 160); }}
    onScroll={() => {
      clearTimeout(timer.current);
      timer.current = setTimeout(settled, 160);
    }}>
    <div className="gallery-carousel-track" data-testid="gallery-carousel-track">
      {slides.map((item, position) => <div className="gallery-carousel-slide" key={`${position}-${item.id}`} aria-hidden={position !== index} inert={position !== index}>
        {isVideo(outputUrl(item)) ? <video src={outputUrl(item)} controls={position === index} autoPlay={position === index} playsInline loop preload={position === index ? 'metadata' : 'none'}
          data-testid={position === index ? 'gallery-lightbox-video' : undefined} />
          : <img src={outputUrl(item)} loading={Math.abs(position - index) <= 1 ? "eager" : "lazy"} draggable={false} alt={position === index ? item.prompt_positive?.slice(0, 60) || 'render' : ''}
            data-testid={position === index ? 'gallery-lightbox-image' : undefined} />}
      </div>)}
    </div>
  </div>;
});
export default GalleryCarousel;
