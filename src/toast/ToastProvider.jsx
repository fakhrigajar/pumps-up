import { useCallback, useMemo, useRef, useState } from "react";
import { ToastContext } from "./context";
import { ToastStack } from "../components/ui/ToastStack";

const MAX_VISIBLE = 3;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const serial = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback((message, tone = "info") => {
    serial.current += 1;
    const id = serial.current;
    setToasts((list) => [...list, { id, message, tone }].slice(-MAX_VISIBLE));
  }, []);

  const value = useMemo(() => ({ notify, dismiss }), [notify, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}
