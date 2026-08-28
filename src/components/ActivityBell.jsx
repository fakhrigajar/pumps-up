import { useEffect, useRef, useState } from "react";
import { IconBell } from "./Icons";
import { ActivityLog } from "./panels/ActivityLog";
import { useTranslation } from "../i18n/context";

const BADGE_LIMIT = 9;

export function ActivityBell({
  entries,
  unread = 0,
  readThrough = 0,
  onMarkAllRead,
  onViewMore,
}) {
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

  const toggle = () => setOpen((value) => !value);

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
        {unread > 0 ? (
          <span className="sr-only">{t("activity.unread", { count: unread })}</span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-30 mt-1.5 w-[340px]">
          <ActivityLog
            entries={entries}
            limit={null}
            newSince={readThrough}
            onMarkAllRead={onMarkAllRead}
            onViewMore={viewMore}
            className="h-[380px] shadow-pop"
          />
        </div>
      ) : null}
    </div>
  );
}
