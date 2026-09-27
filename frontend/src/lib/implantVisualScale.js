// The cc control is a visual direction, not a measurable implant specification.
// Give image models a short silhouette description instead of an exact number.
export function implantVisualPrompt(cc) {
  const volume = Math.max(0, Math.min(5000, Number(cc) || 0));
  if (!volume) return "";
  if (volume < 400) return "subtle augmented bust, gently rounded implant silhouette, slight forward projection";
  if (volume < 800) return "full augmented bust, rounded high-profile implant silhouette, clear forward projection";
  if (volume < 1500) return "very large augmented bust, distinctly round high-profile implant silhouette, strong forward projection";
  if (volume < 3000) return "exaggerated oversized augmented bust, prominent spherical implant silhouette, dramatic forward projection, upper-body silhouette dominated by the bust";
  return "fantasy-scale augmented bust, extremely oversized and prominently projected, distinctly round high-profile implant silhouette, bust dominates the upper-body silhouette while remaining attached to one coherent torso";
}
