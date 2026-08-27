import { useCallback, useEffect, useMemo, useState } from "react";
import { auth } from "../api/auth";
import { clearAsyncCache } from "../api/useAsync";

/**
 * The signed-in account, remembered for as long as this tab is open.
 *
 * A till is a shared machine, so a session is not something to hand back
 * days later: opening the app in a new tab or window asks for the login and
 * password again, rather than letting whoever walks up to the terminal
 * inherit the last person's session. A *reload* is not that — it is the same
 * person at the same counter, mid-shift — so the two have to be told apart.
 *
 * `sessionStorage` is exactly that line: it survives a refresh and dies with
 * the tab. The session itself still lives in the httpOnly cookie, which is
 * what actually authorizes anything; the marker below only records whether
 * this tab is entitled to pick that cookie back up without asking again.
 */
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
    // A tab that cannot remember is a tab that asks again on reload, which
    // is the safe direction for this to fail in.
  }
}

export function useSessionState() {
  const [user, setUser] = useState(null);

  // There is nothing to wait for when this tab has never signed in: the
  // sign-in screen is the first paint, with no round trip and no loading
  // frame in front of it. Only a tab resuming a session has a real gap
  // between mounting and knowing who is signed in.
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
        // The cookie is gone or no longer good — expired, signed out
        // elsewhere, or cleared by the browser. The marker outlived it, so
        // drop it and let this tab ask for the password again.
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

  /** The signed-in user, or null when the pair does not match an account.
   * The caller says what a failure looks like; this only answers whether it
   * was one. */
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
    // The cookie is cleared server-side first, so signing out is a real end
    // to the session rather than this tab merely forgetting about it.
    await auth.logout().catch(() => {});
    // Anything fetched under the old session goes with it. A till is a shared
    // machine: the next person to sign in gets their own answers, not a
    // cached glimpse of the last shift's takings.
    clearAsyncCache();
    setMarker(false);
    setUser(null);
  }, []);

  /**
   * Point the session at a login it has just been renamed to.
   *
   * The token is signed with the account's stable id rather than its login,
   * so a rename never risks the session itself — this only keeps the
   * in-memory user object showing the name that was just saved, without a
   * round trip back to the server to ask.
   */
  const follow = useCallback((next) => {
    setUser((current) => (current ? { ...current, login: next } : current));
  }, []);

  return useMemo(
    () => ({ user, authChecked, signIn, signOut, follow }),
    [user, authChecked, signIn, signOut, follow],
  );
}
