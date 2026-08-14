import { useCallback, useMemo, useState } from "react";
import { LabelTemplateContext } from "./context";
import { normalizeTemplate, readTemplate, writeTemplate } from "../lib/labelTemplate";

/**
 * Holds the saved label design for the whole app.
 *
 * It sits above the pages because the two ends of it are on different screens:
 * Tools draws the design, Inventory prints with it, and neither should have to
 * know about the other. Local storage is what makes "save" mean saved — the
 * design outlives the tab it was drawn in, so a shop sets its label up once.
 */
export function LabelTemplateProvider({ children }) {
  const [template, setTemplate] = useState(readTemplate);

  const save = useCallback((next) => {
    const clean = normalizeTemplate(next);
    writeTemplate(clean);
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
