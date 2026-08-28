import { useCallback, useEffect, useRef, useState } from "react";

const cache = new Map();

export function clearAsyncCache() {
  cache.clear();
}

export function useAsync(fetcher, deps, cacheKey) {
  const key = cacheKey ? `${cacheKey}(${JSON.stringify(deps)})` : null;

  const [state, setState] = useState(() => {
    const hit = key ? cache.get(key) : undefined;
    return hit === undefined
      ? { data: null, loading: true, error: null }
      : { data: hit, loading: false, error: null };
  });
  const requestId = useRef(0);

  const run = useCallback(() => {
    const id = (requestId.current += 1);
    const hit = key ? cache.get(key) : undefined;

    setState((current) =>
      hit === undefined
        ? { ...current, loading: true, error: null }
        : { data: hit, loading: false, error: null },
    );

    fetcher()
      .then((data) => {
        if (key) cache.set(key, data);
        if (requestId.current === id) {
          setState({ data, loading: false, error: null });
        }
      })
      .catch((error) => {
        if (requestId.current !== id) return;
        setState((current) =>
          current.data === null
            ? { data: null, loading: false, error }
            : { ...current, loading: false },
        );
      });
  }, deps);

  useEffect(() => {
    run();
  }, [run]);

  return { ...state, reload: run };
}
