import { useEffect, useRef } from "react";

/**
 * A HID barcode scanner, read as what it actually is: a keyboard that types.
 *
 * The Syble sends its payload as ordinary keydown events and finishes with
 * Enter, so there is no port to open and no SDK to drive — the only real
 * question is how to tell its typing from a person's, and speed answers it.
 * The scanner emits a whole barcode at a few milliseconds per character; a
 * fast typist is nearer a tenth of a second and cannot hold that pace for
 * thirteen digits. So a gap longer than `MAX_GAP` is taken as a person and
 * starts the buffer over. That is what lets this listen at the window rather
 * than behind a focused field: a scan is recognised wherever the caret
 * happens to be, while typing in that same field is never mistaken for one.
 *
 * Once two characters have arrived close enough together to be a burst, the
 * rest of it is swallowed instead of passed on, so a scan aimed at a focused
 * input leaves at most its first character behind rather than the whole code.
 */

/** Longer than this between two keystrokes is a person, not a scanner. */
const MAX_GAP = 60;

/** Shorter than this is a stray Enter or a shortcut, not a barcode. */
const MIN_LENGTH = 4;

/**
 * The burst state machine, kept apart from React so it is what it looks like:
 * a fold over keystrokes that occasionally yields a barcode. `suppress` says
 * the keystroke was part of a burst and should be kept from whatever holds
 * focus; the first character of a burst is never suppressed, because nothing
 * about it is recognisable as a scan until a second one arrives fast behind.
 */
export function createScanReader({ maxGap = MAX_GAP, minLength = MIN_LENGTH } = {}) {
  let buffer = "";
  let lastAt = 0;

  return function read(key, at) {
    const burst = buffer.length > 0 && at - lastAt <= maxGap;

    if (key === "Enter") {
      const code = burst && buffer.length >= minLength ? buffer : null;
      buffer = "";
      return { code, suppress: code !== null };
    }

    // Shift and its like are passed over without disturbing the clock: a
    // scanner sending an uppercase character sends two events for it, and the
    // gap that matters is the one between the characters themselves.
    if (key.length !== 1) return { code: null, suppress: false };

    buffer = burst ? buffer + key : key;
    lastAt = at;
    return { code: null, suppress: burst };
  };
}

export function useBarcodeScanner(onScan, { enabled = true } = {}) {
  // Read through a ref so the listener binds once and still calls the newest
  // handler: every scan re-renders the till, and rebinding on each of those
  // would drop the buffer of anyone mid-scan.
  const handler = useRef(onScan);
  useEffect(() => {
    handler.current = onScan;
  });

  useEffect(() => {
    if (!enabled) return undefined;

    const read = createScanReader();

    const onKeyDown = (event) => {
      // A held-down key repeats fast enough to look like a scanner, and an
      // IME's keystrokes are not the characters they will become.
      if (event.repeat || event.isComposing) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      const { code, suppress } = read(event.key, event.timeStamp);
      if (suppress) event.preventDefault();

      if (code) {
        // This Enter closed a scan; it is not a form submission or a press of
        // whatever button happens to hold focus.
        event.stopPropagation();
        handler.current(code);
      }
    };

    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [enabled]);
}
