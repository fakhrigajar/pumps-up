import { useCallback, useEffect, useRef, useState } from "react";

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
