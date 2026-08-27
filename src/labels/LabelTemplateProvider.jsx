import { useCallback, useEffect, useMemo, useState } from "react";
import { LabelTemplateContext } from "./context";
import { DEFAULT_TEMPLATE, normalizeTemplate } from "../lib/labelTemplate";
import { settings as settingsApi } from "../api/settings";

/**
 * Holds the saved label design for the whole app.
 *
 * It sits above the pages because the two ends of it are on different
 * screens: Tools draws the design, Inventory prints with it, and neither
 * should have to know about the other. The design now lives on the server
 * rather than in this browser's storage, so it is the same on every device
 * signed in to this shop, not just the one it was drawn on.
 */
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

  // Normalized on the way back as well as on the way out: what the server
  // answers with is a stored design like any other, and one written by a
  // build that predates an element would otherwise be handed to the printer
  // with that element missing entirely.
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
