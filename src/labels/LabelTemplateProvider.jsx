import { useCallback, useEffect, useMemo, useState } from "react";
import { LabelTemplateContext } from "./context";
import { DEFAULT_TEMPLATE, normalizeTemplate } from "../lib/labelTemplate";
import { settings as settingsApi } from "../api/settings";

export function LabelTemplateProvider({ children }) {
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE);

  useEffect(() => {
    let cancelled = false;
    settingsApi
      .getLabelTemplate()
      .then((data) => {
        if (!cancelled) setTemplate(normalizeTemplate(data));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const save = useCallback(async (next) => {
    const clean = normalizeTemplate(
      await settingsApi.saveLabelTemplate(normalizeTemplate(next)),
    );
    setTemplate(clean);
    return clean;
  }, []);

  const value = useMemo(() => ({ template, save }), [template, save]);

  return (
    <LabelTemplateContext.Provider value={value}>
      {children}
    </LabelTemplateContext.Provider>
  );
}
