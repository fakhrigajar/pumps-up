import { createContext, useContext } from "react";

export const StoreSettingsContext = createContext(null);

export function useStoreSettings() {
  const context = useContext(StoreSettingsContext);
  if (!context) {
    throw new Error(
      "useStoreSettings must be used inside a StoreSettingsProvider",
    );
  }
  return context;
}
