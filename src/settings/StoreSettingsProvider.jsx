import { useCallback, useEffect, useMemo, useState } from "react";
import { StoreSettingsContext } from "./context";
import { DEFAULT_SETTINGS, normalizeSettings } from "../lib/storeSettings";
import { setFormatCurrency } from "../lib/format";
import { settings as settingsApi } from "../api/settings";

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
