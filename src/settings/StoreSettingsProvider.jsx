import { useCallback, useMemo, useState } from "react";
import { StoreSettingsContext } from "./context";
import {
  normalizeSettings,
  readSettings,
  writeSettings,
} from "../lib/storeSettings";
import { setFormatCurrency } from "../lib/format";

/**
 * Holds the shop's settings above every page, and hands the currency to the
 * format helpers on the way past.
 *
 * The handover happens during render, the way the language provider hands over
 * the locale: it is the same idempotent assignment, and doing it in an effect
 * would paint one frame of every price in the old currency each time the
 * setting changed.
 */
export function StoreSettingsProvider({ children }) {
  const [settings, setSettings] = useState(readSettings);

  setFormatCurrency(settings.currency);

  const update = useCallback((changes) => {
    setSettings((current) => {
      const next = normalizeSettings({ ...current, ...changes });
      writeSettings(next);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ settings, update }), [settings, update]);

  return (
    <StoreSettingsContext.Provider value={value}>
      {children}
    </StoreSettingsContext.Provider>
  );
}
