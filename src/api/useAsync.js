import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Answers already fetched during this session.
 *
 * A module-level Map rather than state, because it has to outlive the
 * component — and outliving the component is the whole point. The pages that
 * fetch through this hook are rendered from a ternary in App, so navigating
 * away unmounts them and takes everything they had loaded with them; without
 * somewhere outside React to keep it, every return to a page was a second
 * wait for something already known.
 */
const cache = new Map();

/**
 * Forgets everything cached. Called on sign-out: a till is a shared machine,
 * and the next person at it must not be handed the last one's figures.
 */
export function clearAsyncCache() {
  cache.clear();
}

/**
 * Fetches on mount and whenever `deps` changes, discarding the result of any
 * request superseded by a newer one before it resolves — the guard a
 * self-fetching page needs when its own filters (a date range, a grouping)
 * can change faster than the network answers.
 *
 * Pass `cacheKey` to have the answer remembered. What comes back is then
 * shown immediately on any later visit *and* re-requested behind it, so a
 * revisit costs no loading state and is still no more than one round trip
 * behind the shop. Leave it off and the hook fetches afresh every time, which
 * is what a caller wants when the answer must not be a moment old.
 */
export function useAsync(fetcher, deps, cacheKey) {
  // The deps cannot key the cache on their own: two pages that both fetch
  // once on mount each pass an empty array, and would collide. So the
  // resource names itself, and the deps tell one request for it from another.
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

    // Stale first, fresh behind it. Only a page with nothing to show waits.
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
        // A refresh that fails behind cached data leaves that data alone.
        // What is on screen is stale, not wrong, and blanking the page to
        // announce a failed background request is the worse of the two.
        setState((current) =>
          current.data === null
            ? { data: null, loading: false, error }
            : { ...current, loading: false },
        );
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run]);

  return { ...state, reload: run };
}
