import { useEffect, useRef, useState } from 'react';
import { endpoints } from '@/lib/api';
import { CHARACTER_PREVIEW_JOB_KEY } from '@/lib/characterPreview';

const terminal = status => ['done', 'failed', 'offline', 'cancelled'].includes(status);
const read = storageKey => {
  try { return JSON.parse(sessionStorage.getItem(storageKey)) || {}; } catch { return {}; }
};
const persist = (state, storageKey) => {
  try { sessionStorage.setItem(storageKey, JSON.stringify(state)); } catch { /* Storage is optional. */ }
};

export default function useCharacterPreview(requestKey, storageKey = CHARACTER_PREVIEW_JOB_KEY, jobLabel = 'Preview') {
  const [state, setState] = useState(() => read(storageKey));
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
          next.imageRender = updated; next.imagePayload = state.submittedPayload;
        }
        persist(next, storageKey);
        setState(next);
        setError(updated.status === 'done' && !updated.output_files?.[0]
          ? `The ${jobLabel.toLowerCase()} finished without an image. Try again.`
          : ['failed', 'offline', 'cancelled'].includes(updated.status)
            ? updated.error || `${jobLabel} ${updated.status}.` : '');
      } catch {
        if (!stopped) {
          setError(`Could not check ${jobLabel.toLowerCase()} progress. Retrying…`);
          timer = setTimeout(poll, 3000);
        }
      }
    };
    timer = setTimeout(poll, 2000);
    return () => { stopped = true; clearTimeout(timer); };
  }, [render, state, storageKey, jobLabel]);

  const update = async (payload, submittedKey = requestKey) => {
    if (inFlight.current || busy) return;
    inFlight.current = true;
    setSubmitting(true);
    setError('');
    try {
      const queued = await endpoints.dispatchRender(payload);
      if (!queued?.id) throw new Error(`The ${jobLabel.toLowerCase()} did not return a queue identifier.`);
      const next = { ...state, render: queued, requestKey: submittedKey, submittedPayload: payload };
      if (queued.status === 'done' && queued.output_files?.[0]) {
        next.image = queued.output_files[0]; next.imageKey = submittedKey;
        next.imageRender = queued; next.imagePayload = payload;
      }
      persist(next, storageKey);
      if (mounted.current) {
        setState(next);
        if (['failed', 'offline', 'cancelled'].includes(queued.status)) setError(queued.error || `${jobLabel} ${queued.status}.`);
        else if (queued.status === 'done' && !queued.output_files?.[0]) setError(`The ${jobLabel.toLowerCase()} finished without an image. Try again.`);
      }
    } catch (failure) {
      if (mounted.current) setError(failure?.response?.data?.detail || failure.message || `${jobLabel} could not start.`);
    } finally {
      inFlight.current = false;
      if (mounted.current) setSubmitting(false);
    }
  };
  return { update, busy, error, render, image: state.image, imagePayload: state.imagePayload,
    imageRender: state.imageRender || (render?.status === 'done' && state.requestKey === state.imageKey ? render : null),
    stale: !!state.image && state.imageKey !== requestKey,
    pendingStale: busy && !!state.requestKey && state.requestKey !== requestKey };
}
