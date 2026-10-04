import { useCallback, useEffect, useRef, useState } from "react";

// Restoring a recipe is a transaction even when its compiled text is identical
// to the current editor. Consume that transaction on its own render so a later
// user edit can never accidentally inherit the restoration exemption.
export function useCompiledPromptReset({ positive, negative, workflowId, setPositive, setNegative }) {
  const [restoreEpoch, setRestoreEpoch] = useState(0);
  const consumedEpoch = useRef(0);
  const restorationPending = useRef(false);
  const previousInputs = useRef(null);
  const preserveRestoredPrompt = useCallback(() => {
    restorationPending.current = true;
    setRestoreEpoch((epoch) => epoch + 1);
  }, []);

  useEffect(() => {
    const inputs = JSON.stringify([positive, negative, workflowId]);
    if (restorationPending.current) {
      // An earlier effect in this render may have just scheduled restoration.
      // Wait for the render containing the restored values and new epoch.
      if (restoreEpoch === consumedEpoch.current) return;
      consumedEpoch.current = restoreEpoch;
      restorationPending.current = false;
      previousInputs.current = inputs;
      return;
    }
    if (previousInputs.current === inputs) return;
    previousInputs.current = inputs;
    setPositive("");
    setNegative("");
  }, [positive, negative, workflowId, restoreEpoch, setPositive, setNegative]);

  return preserveRestoredPrompt;
}
