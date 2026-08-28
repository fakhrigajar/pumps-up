import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { IconCheck, IconChevronDown } from "../Icons";

const MENU_GAP = 6;

const MENU_ROOM = 180;

const SIZES = { sm: "h-8", md: "h-9" };

const TRIGGERS = {
  pill: "gap-1.5 bg-surface-1 pl-3 pr-2 hover:bg-surface-2",
  field: "w-full gap-2 bg-surface-2 px-3 hover:bg-surface-3",
};

export function Select({
  value,
  onChange,
  options,
  label,
  caption,
  size = "md",
  variant = "field",
  className = "",
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const itemsRef = useRef([]);

  const selectedIndex = options.findIndex((option) => option.value === value);
  const selected = options[selectedIndex];

  function openMenu() {
    setAnchor(triggerRef.current.getBoundingClientRect());
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    itemsRef.current[Math.max(0, selectedIndex)]?.focus();
  }, [open, selectedIndex]);

  useEffect(() => {
    if (!open) return undefined;

    const dismiss = () => setOpen(false);
    const onPointerDown = (event) => {
      const inside =
        triggerRef.current?.contains(event.target) ||
        menuRef.current?.contains(event.target);
      if (!inside) setOpen(false);
    };

    const onEscape = (event) => {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      close();
    };

    window.addEventListener("keydown", onEscape, true);
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("scroll", dismiss, true);
    window.addEventListener("resize", dismiss);
    return () => {
      window.removeEventListener("keydown", onEscape, true);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("scroll", dismiss, true);
      window.removeEventListener("resize", dismiss);
    };
  }, [open]);

  function close() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  function onTriggerKeyDown(event) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      openMenu();
    }
  }

  function onMenuKeyDown(event) {
    const last = options.length - 1;
    const current = itemsRef.current.indexOf(document.activeElement);
    const focusAt = (index) =>
      itemsRef.current[Math.min(last, Math.max(0, index))]?.focus();

    switch (event.key) {
      case "Tab":
        event.preventDefault();
        return close();
      case "ArrowDown":
        event.preventDefault();
        return focusAt(current + 1);
      case "ArrowUp":
        event.preventDefault();
        return focusAt(current - 1);
      case "Home":
        event.preventDefault();
        return focusAt(0);
      case "End":
        event.preventDefault();
        return focusAt(last);
      default:
        return undefined;
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => (open ? close() : openMenu())}
        onKeyDown={onTriggerKeyDown}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        className={`flex items-center rounded-lg border border-line text-left text-[13px] text-ink-1 transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${
          SIZES[size]
        } ${TRIGGERS[variant]} ${className}`}
      >
        {caption ? (
          <span className="shrink-0 text-ink-3">{caption}</span>
        ) : null}
        <span
          className={`min-w-0 flex-1 truncate ${
            variant === "pill" ? "font-medium" : ""
          }`}
        >
          {selected?.label ?? ""}
        </span>
        <IconChevronDown className="h-4 w-4 shrink-0 text-ink-3" />
      </button>

      {open && anchor
        ? createPortal(
            <ul
              ref={menuRef}
              role="menu"
              aria-label={label}
              onKeyDown={onMenuKeyDown}
              style={menuStyle(anchor)}
              className="fixed z-[60] overflow-y-auto rounded-lg border border-line bg-surface-1 py-1 shadow-pop"
            >
              {options.map((option, index) => {
                const isSelected = option.value === value;
                return (
                  <li key={option.value}>
                    <button
                      ref={(node) => {
                        itemsRef.current[index] = node;
                      }}
                      type="button"
                      role="menuitemradio"
                      aria-checked={isSelected}
                      onClick={() => {
                        onChange(option.value);
                        close();
                      }}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] hover:bg-surface-2 ${
                        isSelected ? "font-medium text-ink-1" : "text-ink-2"
                      }`}
                    >
                      <span className="w-4 shrink-0 text-accent">
                        {isSelected ? <IconCheck className="h-4 w-4" /> : null}
                      </span>
                      {option.label}
                    </button>
                  </li>
                );
              })}
            </ul>,
            document.body,
          )
        : null}
    </>
  );
}

function menuStyle(anchor) {
  const below = window.innerHeight - anchor.bottom;
  const dropUp = below < MENU_ROOM && anchor.top > below;

  return {
    left: anchor.left,
    minWidth: anchor.width,
    maxWidth: Math.max(anchor.width, window.innerWidth - anchor.left - 8),
    maxHeight: Math.max(120, (dropUp ? anchor.top : below) - MENU_GAP * 2),
    ...(dropUp
      ? { bottom: window.innerHeight - anchor.top + MENU_GAP }
      : { top: anchor.bottom + MENU_GAP }),
  };
}
