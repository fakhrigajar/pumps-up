import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Fetches on mount and whenever `deps` changes, discarding the result of any
 * request superseded by a newer one before it resolves — the guard a
 * self-fetching page needs when its own filters (a date range, a grouping)
 * can change faster than the network answers.
 */
export function useAsync(fetcher, deps) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const requestId = useRef(0);

  const run = useCallback(() => {
    const id = (requestId.current += 1);
    setState((current) => ({ ...current, loading: true, error: null }));
    fetcher()
      .then((data) => {
        if (requestId.current === id) setState({ data, loading: false, error: null });
      })
      .catch((error) => {
        if (requestId.current === id) setState({ data: null, loading: false, error });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run]);

  return { ...state, reload: run };
}
