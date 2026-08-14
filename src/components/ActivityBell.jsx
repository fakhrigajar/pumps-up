import { useEffect, useRef, useState } from "react";
import { IconBell } from "./Icons";
import { ActivityLog } from "./panels/ActivityLog";
import { useTranslation } from "../i18n/context";

export function ActivityBell({ entries }) {
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

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="dialog"
        aria-expanded={open}
        title={t("activity.title")}
        className="relative rounded-lg p-2 text-ink-2 hover:bg-surface-2 hover:text-ink-1"
      >
        <IconBell />
        {entries.length > 0 ? (
          <span
            aria-hidden="true"
            className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full ring-2 ring-surface-1"
            style={{ backgroundColor: "var(--status-critical)" }}
          />
        ) : null}
        <span className="sr-only">{t("activity.title")}</span>
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-30 mt-1.5 w-[340px]">
          <ActivityLog entries={entries} className="shadow-pop" />
        </div>
      ) : null}
    </div>
  );
}
