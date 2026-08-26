import { useEffect, useRef, useState } from "react";
import { Card } from "./Card";
import { IconClose } from "../Icons";
import { useTranslation } from "../../i18n/context";

const DURATION = 3500;

/** How long the bar is given to start before the timer stops trusting it. */
const ANIMATION_GRACE = 500;

/**
 * The longest a hovered toast can hold its ground.
 *
 * Pausing under the pointer is what makes a message readable, but the stack
 * sits over the top-right of the page, which is where action buttons live —
 * and reaching one underneath means crossing the card that covers it. Without
 * a ceiling that is a standoff: the toast pauses as the cursor arrives and
 * never clears, so the button beneath it can never be reached.
 */
const MAX_HOLD = DURATION * 3;

const TONES = {
  info: "var(--series-1)",
  success: "var(--status-good)",
  warning: "var(--status-warning)",
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

/**
 * The bar along the bottom is the dismissal timer rather than a picture of
 * one: the toast goes when the bar's animation ends, which is what lets a
 * pointer resting on the card stop both at once. Someone reading a message
 * is the one case where the countdown is actively unhelpful.
 *
 * A browser that refuses to run the animation would otherwise leave the card
 * up forever, so a timer starts alongside and stands down as soon as the bar
 * reports for duty.
 */
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
