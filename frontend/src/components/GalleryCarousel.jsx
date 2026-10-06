import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import { clamp, motionDuration, swipeDestination } from '@/lib/dragMotion';

const GalleryCarousel = forwardRef(function GalleryCarousel({ current, previous, next, onNavigate, outputUrl, isVideo }, ref) {
  const viewport = useRef(null);
  const gesture = useRef(null);
  const pending = useRef(null);
  const timer = useRef(null);
  const callback = useRef(onNavigate);
  callback.current = onNavigate;
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [settling, setSettling] = useState(false);
  const finish = () => {
    const direction = pending.current;
    pending.current = null;
    clearTimeout(timer.current);
    if (direction) callback.current(direction);
    setSettling(false); setOffset(0);
  };
  const navigate = direction => {
    if (!previous || !next || pending.current !== null || settling) return;
    const width = viewport.current?.getBoundingClientRect().width || window.innerWidth;
    const duration = motionDuration();
    if (!duration) { callback.current(direction); setOffset(0); setDragging(false); return; }
    pending.current = direction;
    setDragging(false); setSettling(true); setOffset(-direction * width);
    timer.current = setTimeout(finish, duration + 40);
  };
  useImperativeHandle(ref, () => ({ navigate }));
  useLayoutEffect(() => {
    clearTimeout(timer.current); pending.current = null; gesture.current = null;
    setOffset(0); setSettling(false); setDragging(false);
  }, [current.id]);
  useEffect(() => () => clearTimeout(timer.current), []);
  const settleBack = () => { gesture.current = null; setDragging(false); setOffset(0); };
  const end = (event, cancelled = false) => {
    const drag = gesture.current;
    if (!drag || drag.id !== event.pointerId) return;
    gesture.current = null;
    if (cancelled || drag.axis !== 'x') { settleBack(); return; }
    const delta = event.clientX - drag.x;
    const velocity = event.timeStamp - drag.time > 80 ? 0 : drag.velocity;
    const direction = swipeDestination(delta, velocity, viewport.current.getBoundingClientRect().width || window.innerWidth);
    if (direction) navigate(direction); else settleBack();
  };
  const slides = [previous || current, current, next || current];
  return <div ref={viewport} className="gallery-carousel-viewport flex-1 min-h-0 h-full" data-testid="gallery-carousel"
    onPointerDown={event => {
      if (!previous || !next || settling || event.isPrimary === false || event.button > 0 || event.target.closest('video, button, input, a')) return;
      gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY, last: event.clientX, time: event.timeStamp, velocity: 0, axis: null };
    }}
    onPointerMove={event => {
      const drag = gesture.current;
      if (!drag || drag.id !== event.pointerId) return;
      const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
      if (!drag.axis && Math.max(Math.abs(dx), Math.abs(dy)) > 6) {
        drag.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
        if (drag.axis === 'x') { event.currentTarget.setPointerCapture?.(event.pointerId); setDragging(true); }
      }
      if (drag.axis !== 'x') return;
      const elapsed = event.timeStamp - drag.time;
      if (elapsed > 0) drag.velocity = (event.clientX - drag.last) / elapsed;
      drag.last = event.clientX; drag.time = event.timeStamp;
      const width = viewport.current.getBoundingClientRect().width || window.innerWidth;
      setOffset(clamp(dx, -width, width));
    }}
    onPointerUp={event => end(event)} onPointerCancel={event => end(event, true)}
    onLostPointerCapture={event => { if (gesture.current) end(event, true); }}>
    <div className="gallery-carousel-track" data-testid="gallery-carousel-track"
      style={{ transform: `translate3d(calc(-100% + ${offset}px), 0, 0)`, transition: dragging ? 'none' : undefined }}
      onTransitionEnd={event => { if (event.target === event.currentTarget && event.propertyName === 'transform' && pending.current !== null) finish(); }}>
      {slides.map((item, position) => <div className="gallery-carousel-slide" key={`${position}-${item.id}`} aria-hidden={position !== 1} inert={position !== 1}>
        {isVideo(outputUrl(item)) ? <video src={outputUrl(item)} controls={position === 1} autoPlay={position === 1} playsInline loop preload={position === 1 ? 'metadata' : 'none'}
          data-testid={position === 1 ? 'gallery-lightbox-video' : undefined} />
          : <img src={outputUrl(item)} draggable={false} alt={position === 1 ? item.prompt_positive?.slice(0, 60) || 'render' : ''}
            data-testid={position === 1 ? 'gallery-lightbox-image' : undefined} />}
      </div>)}
    </div>
  </div>;
});
export default GalleryCarousel;
