import { useCallback, useEffect, useMemo, useState } from "react";
import { findUser, normalizeLogin } from "../data/users";

const STORAGE_KEY = "pumpsup.session";

function readStored() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * The signed-in account, held as a login rather than as a copy of the record.
 *
 * Storing the key and resolving it against the live list on every render is
 * what keeps a session honest: an account edited on the users screen is
 * immediately the account signed in, and one deleted while signed in resolves
 * to nobody, which drops that browser back to the sign-in page rather than
 * leaving a ghost with a deleted user's permissions.
 */
export function useSessionState(users) {
  const [login, setLogin] = useState(readStored);

  const user = useMemo(
    () => (login ? findUser(users, login) : null),
    [users, login],
  );

  useEffect(() => {
    try {
      if (user) localStorage.setItem(STORAGE_KEY, user.login);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // A session that cannot be remembered is still a session for this tab.
    }
  }, [user]);

  /** The signed-in user, or null when the pair does not match an account. The
   * caller says what a failure looks like; this only answers whether it was. */
  const signIn = useCallback(
    (candidate, password) => {
      const match = findUser(users, normalizeLogin(candidate));
      if (!match || match.password !== password) return null;
      setLogin(match.login);
      return match;
    },
    [users],
  );

  const signOut = useCallback(() => setLogin(null), []);

  /**
   * Point the session at a login it has just been renamed to.
   *
   * Holding the key rather than the record is what makes an edited account
   * take effect immediately, but it is also what would sign somebody out for
   * changing their own username: the old key stops resolving the moment the
   * list is updated. This is the one edit that has to move the key with it.
   */
  const follow = useCallback((next) => setLogin(normalizeLogin(next)), []);

  return useMemo(
    () => ({ user, signIn, signOut, follow }),
    [user, signIn, signOut, follow],
  );
}
