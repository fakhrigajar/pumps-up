import { createContext, useContext } from "react";

export const SessionContext = createContext(null);

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used inside a SessionContext.Provider");
  }
  return context;
}

export function isAdmin(user) {
  return user?.role === "admin";
}
