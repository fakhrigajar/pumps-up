import { useCallback, useMemo, useState } from "react";
import { StoreSettingsContext } from "./context";
import { defaultSettings } from "../data.js";
import { normalizeSettings } from "../lib/storeSettings";
import { setFormatCurrency } from "../lib/format";

export function StoreSettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => normalizeSettings(defaultSettings));
  setFormatCurrency(settings.currency);

  const update = useCallback((changes) => {
    setSettings((current) => normalizeSettings({ ...current, ...changes }));
  }, []);

  const value = useMemo(() => ({ settings, update }), [settings, update]);
  return <StoreSettingsContext.Provider value={value}>{children}</StoreSettingsContext.Provider>;
}
