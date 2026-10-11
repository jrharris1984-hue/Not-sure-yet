import {useEffect} from 'react';
import {endpoints} from '@/lib/api';
const terminal = status => ['done','failed','offline','cancelled'].includes(status);

export function useBuilderRenderPolling({batchRenders, selectedBatchRenderId, activeRender, setBatchRenders, setSelectedBatchRenderId, setActiveRender}) {
  useEffect(() => {
    if (batchRenders.length <= 1 || batchRenders.every(render => terminal(render.status))) return;
    let stopped = false, polling = false;
    const timer = setInterval(async () => {
      if (polling) return;
      polling = true;
      try {
        const updated = await Promise.all(batchRenders.map(async render => {
          if (terminal(render.status)) return render;
          try { return await endpoints.pollRender(render.id); } catch { return render; }
        }));
        if (stopped) return;
        setBatchRenders(updated);
        const selected = updated.find(render => render.id === selectedBatchRenderId);
        if (selected && updated.every(render => terminal(render.status)) && selected.status !== 'done') {
          const success = updated.find(render => render.status === 'done');
          if (success) { setSelectedBatchRenderId(success.id); setActiveRender(success); return; }
        }
        if (selected) setActiveRender(selected);
      } finally { polling = false; }
    }, 2500);
    return () => { stopped = true; clearInterval(timer); };
  }, [batchRenders, selectedBatchRenderId, setActiveRender, setBatchRenders, setSelectedBatchRenderId]);

  const id = activeRender?.id, status = activeRender?.status;
  const batchOwnsActive = batchRenders.length > 1 && batchRenders.some(render => render.id === id);
  useEffect(() => {
    if (!id || terminal(status) || batchOwnsActive) return;
    let stopped = false, polling = false;
    const timer = setInterval(async () => {
      if (polling) return;
      polling = true;
      try {
        const updated = await endpoints.pollRender(id);
        if (stopped) return;
        setActiveRender(updated);
        if (terminal(updated.status)) clearInterval(timer);
      } catch { /* A connection failure keeps the current result and retries. */ }
      finally { polling = false; }
    }, 2500);
    return () => { stopped = true; clearInterval(timer); };
  }, [id, status, batchOwnsActive, setActiveRender]);
}
