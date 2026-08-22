import { useCallback, useEffect, useMemo, useState } from "react";
import { auth } from "../api/auth";

/**
 * The signed-in account, now resolved by the server rather than a login
 * string in localStorage: the session lives in an httpOnly cookie neither
 * this code nor any script on the page can read directly, so on load the
 * only way to find out who (if anyone) is signed in is to ask.
 *
 * `authChecked` exists for exactly that reason — there is a real gap between
 * "the app just mounted" and "we know whether there's a session", and the
 * caller needs to tell those two apart to avoid flashing the sign-in screen
 * at somebody who is, in fact, already signed in.
 */
export function useSessionState() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    auth
      .me()
      .then((data) => {
        if (!cancelled) setUser(data.user);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
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
      setUser(signedInUser);
      return signedInUser;
    } catch {
      return null;
    }
  }, []);

  const signOut = useCallback(async () => {
    await auth.logout().catch(() => {});
    setUser(null);
  }, []);

  /**
   * Point the session at a login it has just been renamed to.
   *
   * The token is signed with the account's stable id rather than its login,
   * so a rename no longer risks the session itself — this only keeps the
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
