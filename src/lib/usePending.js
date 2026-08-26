import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Whether the action this button fires is still in flight.
 *
 * The unmount guard is the point rather than a precaution: nearly every
 * caller here is a dialog that closes on success, so the request finishing
 * and the component ceasing to exist are the same moment. Clearing the flag
 * afterwards would be a write to something that has already gone.
 *
 *   const [selling, run] = usePending()
 *   <Button pending={selling} onClick={() => run(() => onConfirm(lines))}>
 */
export function usePending() {
  const [pending, setPending] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const run = useCallback(async (task) => {
    setPending(true);
    try {
      return await task();
    } finally {
      if (mounted.current) setPending(false);
    }
  }, []);

  return [pending, run];
}
