export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
export const motionDuration = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 0 : 280;
export function sheetSnap(current, velocity, stops) {
  const projected = current - clamp(velocity, -2, 2) * 140;
  return stops.reduce((best, stop) => Math.abs(stop.pixels - projected) < Math.abs(best.pixels - projected) ? stop : best);
}
export function swipeDestination(distance, velocity, width) {
  if (Math.abs(distance) > Math.max(45, width * .2) || (Math.abs(distance) > 12 && Math.abs(velocity) > .5)) return distance < 0 ? 1 : -1;
  return 0;
}
