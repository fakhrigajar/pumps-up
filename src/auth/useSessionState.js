import { useCallback, useMemo, useState } from "react";
import { findUser } from "../data/users.js";

const TAB_KEY = "modshop.session";

function readLogin() {
  try {
    return sessionStorage.getItem(TAB_KEY);
  } catch {
    return null;
  }
}

function remember(login) {
  try {
    if (login) sessionStorage.setItem(TAB_KEY, login);
    else sessionStorage.removeItem(TAB_KEY);
  } catch {
    // Local state still works when browser storage is unavailable.
  }
}

export function useSessionState(users) {
  const [login, setLogin] = useState(readLogin);
  const account = login ? findUser(users, login) : null;
  const user = useMemo(() => account ? {
    login: account.login, role: account.role, activityReadThrough: account.activityReadThrough,
  } : null, [account]);

  const signIn = useCallback((candidate, password) => {
    const found = findUser(users, candidate);
    if (!found || found.password !== password) return null;
    remember(found.login);
    setLogin(found.login);
    return { login: found.login, role: found.role };
  }, [users]);

  const signOut = useCallback(() => {
    remember(null);
    setLogin(null);
  }, []);

  const follow = useCallback((next) => {
    remember(next);
    setLogin(next);
  }, []);

  return useMemo(() => ({ user, signIn, signOut, follow }), [user, signIn, signOut, follow]);
}
