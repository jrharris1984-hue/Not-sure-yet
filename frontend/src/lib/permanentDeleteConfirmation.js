const ACKNOWLEDGMENT_KEY = 'ultra-studio:permanent-delete-acknowledged:v1';
let sessionAcknowledged = false;

export function confirmPermanentDelete(message) {
  try {
    if (window.localStorage.getItem(ACKNOWLEDGMENT_KEY) === 'true') return true;
  } catch {
    if (sessionAcknowledged) return true;
  }
  if (!window.confirm(`${message}\n\nFuture deletes in this browser will be permanent without another warning.`)) return false;
  sessionAcknowledged = true;
  try { window.localStorage.setItem(ACKNOWLEDGMENT_KEY, 'true'); } catch { /* Remember for this session if storage is unavailable. */ }
  return true;
}
