import {useEffect} from 'react';
// Keep sticky panels below the app header and a toolbar that can wrap or grow.
export default function useWorkspaceOffsets(enabled) {
  useEffect(() => {
    if (!enabled) return;
    const root = document.querySelector('.design-workspace');
    const header = document.querySelector('.studio-app-header');
    const toolbar = root?.querySelector('#studio-model');
    if (!root || !toolbar) return;
    const measure = () => {
      const headerHeight = Math.ceil(header?.getBoundingClientRect().height || 0);
      const toolbarHeight = Math.ceil(toolbar.getBoundingClientRect().height || 0);
      root.style.setProperty('--workspace-header-height', `${headerHeight}px`);
      root.style.setProperty('--workspace-sticky-offset', `${headerHeight + toolbarHeight + 16}px`);
    };
    measure();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    if (header) observer?.observe(header);
    observer?.observe(toolbar);
    window.addEventListener('resize', measure);
    return () => {observer?.disconnect();window.removeEventListener('resize',measure);};
  }, [enabled]);
}
