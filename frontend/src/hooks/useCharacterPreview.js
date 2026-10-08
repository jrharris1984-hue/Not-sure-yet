import { useEffect, useRef, useState } from 'react';
import { endpoints } from '@/lib/api';
import { CHARACTER_PREVIEW_JOB_KEY } from '@/lib/characterPreview';

const terminal = status => ['done', 'failed', 'offline', 'cancelled'].includes(status);
const read = () => {
  try { return JSON.parse(sessionStorage.getItem(CHARACTER_PREVIEW_JOB_KEY)) || {}; } catch { return {}; }
};
const persist = state => {
  try { sessionStorage.setItem(CHARACTER_PREVIEW_JOB_KEY, JSON.stringify(state)); } catch { /* Storage is optional. */ }
};

export default function useCharacterPreview(requestKey) {
  const [state, setState] = useState(read);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const inFlight = useRef(false);
  const mounted = useRef(false);
  const render = state.render;
  const busy = submitting || (!!render?.id && !terminal(render.status));

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    if (!render?.id || terminal(render.status)) return;
    let stopped = false;
    let timer;
    const poll = async () => {
      try {
        const updated = await endpoints.pollRender(render.id);
        if (stopped) return;
        const next = { ...state, render: updated };
        if (updated.status === 'done' && updated.output_files?.[0]) {
          next.image = updated.output_files[0];
          next.imageKey = state.requestKey;
        }
        persist(next);
        setState(next);
        setError(updated.status === 'done' && !updated.output_files?.[0]
          ? 'The preview finished without an image. Try updating it again.'
          : ['failed', 'offline', 'cancelled'].includes(updated.status)
            ? updated.error || `Preview ${updated.status}.` : '');
      } catch {
        if (!stopped) {
          setError('Could not check preview progress. Retrying…');
          timer = setTimeout(poll, 3000);
        }
      }
    };
    timer = setTimeout(poll, 2000);
    return () => { stopped = true; clearTimeout(timer); };
  }, [render, state]);

  const update = async payload => {
    if (inFlight.current || busy) return;
    inFlight.current = true;
    setSubmitting(true);
    setError('');
    const submittedKey = requestKey;
    try {
      const queued = await endpoints.dispatchRender(payload);
      if (!queued?.id) throw new Error('The preview did not return a queue identifier.');
      const next = { ...state, render: queued, requestKey: submittedKey };
      if (queued.status === 'done' && queued.output_files?.[0]) {
        next.image = queued.output_files[0]; next.imageKey = submittedKey;
      }
      persist(next);
      if (mounted.current) {
        setState(next);
        if (['failed', 'offline', 'cancelled'].includes(queued.status)) setError(queued.error || `Preview ${queued.status}.`);
        else if (queued.status === 'done' && !queued.output_files?.[0]) setError('The preview finished without an image. Try updating it again.');
      }
    } catch (failure) {
      if (mounted.current) setError(failure?.response?.data?.detail || failure.message || 'Preview could not start.');
    } finally {
      inFlight.current = false;
      if (mounted.current) setSubmitting(false);
    }
  };
  return { update, busy, error, render, image: state.image,
    stale: !!state.image && state.imageKey !== requestKey,
    pendingStale: busy && !!state.requestKey && state.requestKey !== requestKey };
}
