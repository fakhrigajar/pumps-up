import { createContext, useContext } from "react";

export const StoreSettingsContext = createContext(null);

/**
 * The shop's currency and working hours, and the one way to change them.
 *
 * Read it wherever a screen needs to know what the shop is set to; the pages
 * that only need to *print a price* do not read it at all, because the format
 * helpers already carry the currency.
 */
export function useStoreSettings() {
  const context = useContext(StoreSettingsContext);
  if (!context) {
    throw new Error(
      "useStoreSettings must be used inside a StoreSettingsProvider",
    );
  }
  return context;
}
