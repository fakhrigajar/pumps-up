import { useEffect } from "react";
import { Card } from "./Card";
import { IconClose } from "../Icons";
import { useTranslation } from "../../i18n/context";

const DURATION = 3500;

const TONES = {
  info: "var(--series-1)",
  error: "var(--status-critical)",
};

/**
 * Below the topbar and clear of the sale panel, over everything else.
 *
 * The column itself takes no pointer events and the cards inside it take
 * theirs back, so a toast is only ever in the way of the few pixels it
 * actually covers — the row underneath one stays clickable, which is the
 * whole point of telling somebody this way rather than in a dialog.
 */
export function ToastStack({ toasts, onDismiss }) {
  return (
    <div className="pointer-events-none fixed right-4 top-20 z-[60] flex w-[min(320px,calc(100vw-2rem))] flex-col gap-2">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function Toast({ toast, onDismiss }) {
  const { t } = useTranslation();

  // Keyed by id upstream, so a repeat of the same message is a new card with
  // a fresh timer rather than an old one about to expire under a new label.
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), DURATION);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <Card
      role={toast.tone === "error" ? "alert" : "status"}
      className="pointer-events-auto flex items-start gap-3 px-4 py-3 shadow-pop"
    >
      <span
        aria-hidden="true"
        className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: TONES[toast.tone] ?? TONES.info }}
      />

      <p className="min-w-0 flex-1 text-[13px] text-ink-1">{toast.message}</p>

      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="-mr-1 -mt-0.5 shrink-0 rounded p-1 text-ink-3 hover:text-ink-1"
      >
        <IconClose className="h-3.5 w-3.5" />
        <span className="sr-only">{t("toast.dismiss")}</span>
      </button>
    </Card>
  );
}
