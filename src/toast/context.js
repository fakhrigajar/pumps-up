import { createContext, useContext } from "react";

export const ToastContext = createContext(null);

/**
 * A word to the operator that does not stop them working.
 *
 * `notify` returns nothing worth holding: a toast is fire-and-forget by
 * design, dismissing itself on a timer or on the button in its corner, so
 * there is no handle a caller has to remember to let go of.
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside a ToastProvider");
  }
  return context;
}
