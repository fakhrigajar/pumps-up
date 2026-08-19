import { useEffect, useRef, useState } from "react";
import { IconBell } from "./Icons";
import { ActivityLog } from "./panels/ActivityLog";
import { useTranslation } from "../i18n/context";

/** Past this the badge stops counting and starts saying "more than it can
 * show": a bell is a nudge to open the log, not a readout of it. */
const BADGE_LIMIT = 9;

export function ActivityBell({ entries, unread = 0, onRead, onViewMore }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Pressing the bell is what marks the log read, whichever way it swings the
  // panel: closing it after something arrived while it was open has still put
  // that entry in front of the reader.
  const toggle = () => {
    setOpen((value) => !value);
    onRead?.();
  };

  // Leaving for the full page closes the panel behind it: it is a dropdown
  // anchored to a bell, not a second window onto the screen now being opened.
  // Without a handler there is no page to send anyone to — a cashier cannot
  // open the activity screen — and the panel simply does without the footer.
  const viewMore = onViewMore
    ? () => {
        setOpen(false);
        onViewMore();
      }
    : undefined;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-haspopup="dialog"
        aria-expanded={open}
        title={t("activity.title")}
        className="relative rounded-lg p-2 text-ink-2 hover:bg-surface-2 hover:text-ink-1"
      >
        <IconBell />
        {unread > 0 ? (
          <span
            aria-hidden="true"
            className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-status-critical px-1 text-[10px] font-semibold leading-none tabular-nums text-white ring-2 ring-surface-1"
          >
            {unread > BADGE_LIMIT ? `${BADGE_LIMIT}+` : unread}
          </span>
        ) : null}
        <span className="sr-only">{t("activity.title")}</span>
        {/* The badge rounds off at 9+; the name it is read out by does not. */}
        {unread > 0 ? (
          <span className="sr-only">{t("activity.unread", { count: unread })}</span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-30 mt-1.5 w-[340px]">
          <ActivityLog
            entries={entries}
            limit={null}
            onViewMore={viewMore}
            className="h-[380px] shadow-pop"
          />
        </div>
      ) : null}
    </div>
  );
}
