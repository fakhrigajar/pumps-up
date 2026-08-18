import { createContext, useContext } from "react";

export const SessionContext = createContext(null);

/**
 * Who is signed in, and the two things a screen ever wants to do about it.
 *
 * Every page below the sign-in gate has somebody signed in, so `user` is never
 * null where this is read — the gate is what guarantees it, rather than a
 * check repeated on every screen.
 */
export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used inside a SessionContext.Provider");
  }
  return context;
}

/** Shorthand for the question most screens actually ask. */
export function isAdmin(user) {
  return user?.role === "admin";
}
