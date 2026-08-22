import { useCallback, useEffect, useMemo, useState } from "react";
import { StoreSettingsContext } from "./context";
import { DEFAULT_SETTINGS, normalizeSettings } from "../lib/storeSettings";
import { setFormatCurrency } from "../lib/format";
import { settings as settingsApi } from "../api/settings";

/**
 * Holds the shop's settings above every page, and hands the currency to the
 * format helpers on the way past.
 *
 * Starts from `DEFAULT_SETTINGS` rather than a loading state — the endpoint
 * is public and fast, and a shop's settings rarely differ from the default
 * on a fresh install, so there is nothing worth gating the whole app behind
 * here. The real settings arrive moments later and replace it in place.
 */
export function StoreSettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  setFormatCurrency(settings.currency);

  useEffect(() => {
    let cancelled = false;
    settingsApi
      .get()
      .then((data) => {
        if (!cancelled) setSettings(normalizeSettings(data));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const update = useCallback(async (changes) => {
    const next = await settingsApi.update(changes);
    setSettings(normalizeSettings(next));
  }, []);

  const value = useMemo(() => ({ settings, update }), [settings, update]);

  return (
    <StoreSettingsContext.Provider value={value}>
      {children}
    </StoreSettingsContext.Provider>
  );
}
