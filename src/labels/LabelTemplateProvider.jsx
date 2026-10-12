import { useCallback, useMemo, useState } from "react";
import { LabelTemplateContext } from "./context";
import { defaultLabelTemplate } from "../data.js";
import { normalizeTemplate } from "../lib/labelTemplate";

export function LabelTemplateProvider({ children }) {
  const [template, setTemplate] = useState(() => normalizeTemplate(defaultLabelTemplate));
  const save = useCallback((next) => {
    const clean = normalizeTemplate(next);
    setTemplate(clean);
    return clean;
  }, []);

  const value = useMemo(() => ({ template, save }), [template, save]);
  return <LabelTemplateContext.Provider value={value}>{children}</LabelTemplateContext.Provider>;
}
