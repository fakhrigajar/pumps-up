import { createContext, useContext } from "react";

export const LabelTemplateContext = createContext(null);

export function useLabelTemplate() {
  const context = useContext(LabelTemplateContext);
  if (!context) {
    throw new Error(
      "useLabelTemplate must be used inside a LabelTemplateProvider",
    );
  }
  return context;
}
