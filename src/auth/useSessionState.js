import { useCallback, useEffect, useMemo, useState } from "react";
import { auth } from "../api/auth";
import { clearAsyncCache } from "../api/useAsync";

const TAB_KEY = "pumpsup.session";

function hasMarker() {
  try {
    return sessionStorage.getItem(TAB_KEY) === "1";
  } catch {
    return false;
  }
}

function setMarker(present) {
  try {
    if (present) sessionStorage.setItem(TAB_KEY, "1");
    else sessionStorage.removeItem(TAB_KEY);
  } catch {
  }
}

export function useSessionState() {
  const [user, setUser] = useState(null);

  const [authChecked, setAuthChecked] = useState(() => !hasMarker());

  useEffect(() => {
    if (!hasMarker()) return undefined;
    let cancelled = false;

    auth
      .me()
      .then((data) => {
        if (!cancelled) setUser(data.user);
      })
      .catch(() => {
        if (cancelled) return;
        setMarker(false);
        setUser(null);
      })
      .finally(() => {
        if (!cancelled) setAuthChecked(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (candidate, password) => {
    try {
      const { user: signedInUser } = await auth.login(candidate, password);
      setMarker(true);
      setUser(signedInUser);
      return signedInUser;
    } catch {
      return null;
    }
  }, []);

  const signOut = useCallback(async () => {
    await auth.logout().catch(() => {});
    clearAsyncCache();
    setMarker(false);
    setUser(null);
  }, []);

  const follow = useCallback((next) => {
    setUser((current) => (current ? { ...current, login: next } : current));
  }, []);

  const noteActivityRead = useCallback((at) => {
    setUser((current) =>
      current
        ? { ...current, activityReadThrough: new Date(at).toISOString() }
        : current,
    );
  }, []);

  return useMemo(
    () => ({ user, authChecked, signIn, signOut, follow, noteActivityRead }),
    [user, authChecked, signIn, signOut, follow, noteActivityRead],
  );
}
