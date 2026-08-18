import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { IconCheck, IconChevronDown } from "../Icons";

/**
 * A select drawn by the app rather than by the operating system.
 *
 * A native `<select>` puts its menu beyond CSS: the list is painted by the OS,
 * in the OS's type and colors, and it ignores the theme the rest of the screen
 * is wearing. This is the same menu the language and export buttons drop —
 * app surfaces, app ink, a tick against the current choice — so every list of
 * choices in the app looks like the same control.
 *
 * The menu is portalled to the body and pinned to the viewport, because half
 * of these fields sit in a scrolling panel or a dialog that is `overflow`
 * hidden: laid out in place, the menu would be cut off at the edge of the box
 * it belongs to. Pinned, it cannot follow the field when the page moves under
 * it, so it closes instead.
 */

/** Space between the field and its menu, matching the header menus' `mt-1.5`. */
const MENU_GAP = 6;

/** How much room below the field is worth opening into before the menu gives
 * up and opens upwards instead. */
const MENU_ROOM = 180;

const SIZES = { sm: "h-8", md: "h-9" };

const TRIGGERS = {
  // The filter pills: they hug their content and sit on a card.
  pill: "gap-1.5 bg-surface-1 pl-3 pr-2 hover:bg-surface-2",
  // Form fields: full width, and a shade darker so they read as inputs.
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

  // Opening moves focus onto the current choice. The field is measured in the
  // same breath rather than in an effect afterwards: the menu has to be on
  // screen by the time the focus below goes looking for an item to land on,
  // and an effect would leave a first render with no menu in it at all.
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

    // Caught on the way down, before anything else can hear it: an open menu
    // owns the next Escape. A dialog holding this field is listening on the
    // window too, and it must not take the same keystroke as its own — the
    // first Escape closes the menu, not the half-filled form behind it.
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
        // Focus is in a menu at the end of the document, so letting Tab run
        // would land somewhere unrelated to the field. It goes back to the
        // field instead, and the next Tab carries on from there.
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
              // Above the dialog layer: a field inside a modal drops its menu
              // over the modal, not behind it.
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

/** The menu against its field: as wide as the field at least, below it when
 * there is room and above it when there is not, and never taller than the
 * space it opened into. */
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
