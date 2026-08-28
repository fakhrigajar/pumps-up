import { useEffect, useRef, useState } from "react";
import { Card } from "./Card";
import { IconClose } from "../Icons";
import { useTranslation } from "../../i18n/context";

const DURATION = 3500;

const ANIMATION_GRACE = 500;

const MAX_HOLD = DURATION * 3;

const TONES = {
  info: "var(--series-1)",
  success: "var(--status-good)",
  warning: "var(--status-warning)",
  error: "var(--status-critical)",
};

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
  const [paused, setPaused] = useState(false);
  const fallback = useRef(null);

  const tone = TONES[toast.tone] ?? TONES.info;

  useEffect(() => {
    fallback.current = setTimeout(
      () => onDismiss(toast.id),
      DURATION + ANIMATION_GRACE,
    );
    const ceiling = setTimeout(() => onDismiss(toast.id), MAX_HOLD);
    return () => {
      clearTimeout(fallback.current);
      clearTimeout(ceiling);
    };
  }, [toast.id, onDismiss]);

  const hold = () => setPaused(true);
  const release = () => setPaused(false);

  return (
    <Card
      role={toast.tone === "error" ? "alert" : "status"}
      onMouseEnter={hold}
      onMouseLeave={release}
      onFocus={hold}
      onBlur={release}
      className="toast-enter pointer-events-auto flex items-start gap-3 overflow-hidden px-4 pb-4 pt-3 shadow-pop"
    >
      <span
        aria-hidden="true"
        className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: tone }}
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

      <span
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-[3px] bg-surface-2"
      >
        <span
          className="toast-progress block h-full w-full origin-left"
          style={{
            backgroundColor: tone,
            animationDuration: `${DURATION}ms`,
            animationPlayState: paused ? "paused" : "running",
          }}
          onAnimationStart={() => clearTimeout(fallback.current)}
          onAnimationEnd={() => onDismiss(toast.id)}
        />
      </span>
    </Card>
  );
}
